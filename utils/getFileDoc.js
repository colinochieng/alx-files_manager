const { dbClient } = require("./db");
const { ObjectId } = require("mongodb");
const fs = require("fs");

/**
 * finds file document and sets it to the request object
 * @param {Request} req
 * @param {Response} res
 * @param {Callback} next
 */

export const fileDocument = async (req, res, next) => {
  // Retrieve the file based on the user Id and the ID passed as parameter

  const { userId } = req;
  const { id } = req.params;

  const file = await dbClient.filesCollection.findOne({
    userId,
    _id: ObjectId(id),
  });

  if (!file) {
    return res.status(404).send({ error: "Not found" });
  }

  req.file = file;

  // Continue with the next middleware or the main handler
  next();
};

/**
 * finds file document and sets it to the request object
 * @param {Request} req
 * @param {Response} res
 * @param {Callback} next
 */

export const fileDocumentData = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req;

  const file = await dbClient.filesCollection.findOne({
    _id: ObjectId(id),
  });

  if (!file || (file.isPublic === false && !userId)) {
    return res.status(404).send({ error: "Not found" });
  }

  if (file.type === "folder") {
    return res.status(400).send({ error: "A folder doesn't have content" });
  }

  if (!fs.existsSync(file.localPath)) {
    return res.status(404).send({ error: "Not found" });
  }

  req.file = file;

  // Continue with the next middleware or the main handler
  next();
};
