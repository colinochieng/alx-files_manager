const Queue = require("bull");
const dbClient = require("./utils/db");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const imageThumbnail = require("image-thumbnail");

export const fileQueue = new Queue("fileQueue");
export const userQueue = new Queue("userQueue");

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error("Missing fileId");
  }
  if (!userId) {
    throw new Error("Missing userId");
  }

  const fileDoc = await dbClient.filesCollection.findOne({
    _id: ObjectId(fileId),
    userId,
  });

  if (!fileDoc) {
    throw new Error("File not found");
  }

  try {
    const imageBuffer = fs.readFileSync(fileDoc.localPath);
    const thumbnail500 = await imageThumbnail(imageBuffer, { width: 500 });

    fs.writeFileSync(`${fileDoc.localPath}_500`, thumbnail500);

    const thumbnail250 = await imageThumbnail(imageBuffer, { width: 250 });

    fs.writeFileSync(`${fileDoc.localPath}_250`, thumbnail250);

    const thumbnail100 = await imageThumbnail(imageBuffer, { width: 100 });

    fs.writeFileSync(`${fileDoc.localPath}_100`, thumbnail100);
  } catch (error) {
    console.error(`Error generating thumbnails: ${error}`);
    throw new Error("Internal Server Error");
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error("Missing userId");
  }
  const user = await dbClient.usersCollection.findOne({
    _id: ObjectId(userId),
  });

  if (!file) {
    throw new Error("User not found");
  }

  console.log(`Welcome ${user.email}!`);
});
