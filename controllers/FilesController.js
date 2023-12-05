const { dbClient } = require("../utils/db");
const { ObjectId } = require("mongodb");
const uuid = require("uuid");
const fs = require("fs");
const mime = require("mime-types");
const { fileQueue } = require("../worker");

/**
 * @param {*} file: file mongod document
 * @param {Boolean} pub : publish or unpublish
 */
async function publish(file, pub) {
  await dbClient.filesCollection.updateOne(
    { _id: file._id },
    { $set: { isPublic: pub } }
  );

  const updatedFile = await dbClient.filesCollection.findOne(
    { _id: file._id },
    {
      localPath: 0,
    }
  );

  updatedFile.id = updatedFile._id;
  delete updatedFile._id;

  return updatedFile;
}

// C:\\Users\\user\\Desktop
const { FOLDER_PATH = "/tmp/files_manager" } = process.env;

module.exports = {
  postUpload: async function (req, res) {
    /**
     * To create a file, you must specify:
     * name: as filename
     * type: either folder, file or image
     * parentId: (optional) as ID of the parent (default: 0 -> the root)
     * isPublic: (optional) as boolean to define if the file
     *  + is public or not (default: false)
     * data: (only for type=file|image) as Base64 of the file content
     * '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }'
     */

    let { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) return res.status(400).json({ error: "Missing name" });

    if (!type || !["folder", "file", "image"].includes(type.toLowerCase())) {
      return res.status(400).json({ error: "Missing type" });
    }

    type = type.toLowerCase();

    if (!data && type !== "folder")
      return res.status(400).json({ error: "Missing data" });

    if (parentId) {
      /* Not equal to root id */
      const parentFile = await dbClient.filesCollection.findOne({
        _id: ObjectId(parentId),
      });

      if (!parentFile) {
        return res.status(400).json({ error: "Parent not found" });
      } else if (parentFile.type !== "folder") {
        return res.status(400).json({ error: "Parent is not a folder" });
      }
    }

    // The user ID should be added to the
    // document saved in DB - as owner of a file
    const newFileDocument = {
      userId: req.userId,
      name,
      type,
      isPublic,
      parentId,
    };

    /**
     * If the type is folder, add the new file
     * document in the DB and return the new file with a status code 201
     */
    if (type === "folder") {
      const { insertedId } = await dbClient.filesCollection.insertOne(
        newFileDocument
      );

      if (newFileDocument._id) {
        delete newFileDocument._id;
      }
      newFileDocument.id = insertedId.toHexString();

      return res.status(201).json(newFileDocument);
    } else {
      /**
       * All file will be stored locally in
       *      a folder (to create automatically if not present):
       * The relative path of this folder is
       *      given by the environment variable FOLDER_PATH
       * If this variable is not present or empty,
       *      use /tmp/files_manager as storing folder path
       */
      const filePath = `${FOLDER_PATH}\\${uuid.v4()}`;

      try {
        await fs.writeFile(filePath, Buffer.from(data, "base64"), (err) => {
          if (err) {
            console.error(`Error writing file: ${err}`);
            return res.status(500).json({ error: "Internal Server Error" });
          }
        });
      } catch (error) {
        console.error(`Error writing file: ${error}`);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      newFileDocument.localPath = filePath;

      const { insertedId } = await dbClient.filesCollection.insertOne(
        newFileDocument
      );

      newFileDocument.id = insertedId.toHexString();

      delete newFileDocument.localPath;

      if (newFileDocument._id) {
        delete newFileDocument._id;
      }

      if (type === "image") {
        const job = await fileQueue.add({
          userId: req.userId,
          fileId: newFileDocument.id,
        });
      }

      return res.status(201).json(newFileDocument);
    }
  },
  /**
   * path: GET /files/:id
   * should retrieve the file document based on the ID
   * @param {Request} req
   * @param {Response} res
   * @returns { Response }: file document or error
   */
  getShow: async function (req, res) {
    const { id } = req.params;

    const file = await dbClient.filesCollection.findOne({
      _id: ObjectId(id),
      userId: req.userId,
    });

    if (!file) return res.status(404).json({ error: "Not found" });

    file.id = file._id.toHexString();

    delete file._id;

    if (["file", "image"].includes(file.type)) {
      delete file.localPath;
    }

    return res.status(200).json(file);
  },

  /**
   * path: GET /files
   * retrieve all users file documents for
   *    + a specific parentId and with pagination
   * @param {Request} req
   * @param {Response} res
   * @returns { Response }: file document or error
   */

  getIndex: async function (req, res) {
    let { parentId = "0", page = 0 } = req.query;

    if (parentId === "0") {
      parentId = parseInt(parentId);
    }

    if (!page) {
      page = parseInt(page);

      if (isNaN(page)) page = 0;
    }

    if (parentId) {
      const folder = await dbClient.filesCollection.findOne({
        _id: ObjectId(parentId),
      });

      if (!folder || !folder.type === "folder") {
        return res.status(200).json([]);
      }
    }

    const pipeline = [
      {
        $match: { parentId },
      },
      {
        $skip: page * 20,
      },
      {
        $limit: 20,
      },
    ];
    const filesArr = await dbClient.filesCollection
      .aggregate(pipeline)
      .toArray();

    const files = filesArr.map((fileObj) => {
      if (["image", "file"].includes(fileObj.type)) {
        delete fileObj.localPath;
      }
      return fileObj;
    });

    res.status(200);
    return res.send(files);
  },

  /**
   * path: PUT /files/:id/unpublish
   * set isPublic to true on the
   *    + file document based on the ID
   * @param {Request} req
   * @param {Response} res
   * @returns { Response }: file document or error
   */
  putPublish: async function (req, res) {
    const data = await publish(req.file, true);

    return res.status(200).json(data);
  },

  /**
   * path: PUT /files/:id/publish
   * set isPublic to true on the
   *    + file document based on the ID
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @returns { Express.Response }: file document or error
   */
  putUnpublish: async function (req, res) {
    const data = await publish(req.file, false);

    return res.status(200).json(data);
  },

  /**
   * path: GET /files/:id/data
   * return the content of the file document based on the ID
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @returns { Express.Response }: file document or error
   */

  getFile: function (req, res) {
    const { file } = req;
    const { size } = req.query;

    let data;

    if (size) {
      if (!["500", "250", "100"].includes(size)) {
        return res.status(400).json({ error: "Invalid size parameter" });
      }

      const filePath = `${file.localPath}_${size}`;

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Not found" });
      }

      data = fs.readFileSync(filePath);
    } else {
      data = fs.readFileSync(file.localPath);
    }
    res.setHeader(
      "Content-Type",
      mime.lookup(file.name) || "application/octet-stream"
    );
    return res.status(200).send(data);
  },
};
