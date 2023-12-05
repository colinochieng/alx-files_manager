const { dbClient } = require("../utils/db");
const { redisClient } = require("../utils/redis");
const sha1 = require("sha1");
const { ObjectId } = require("mongodb");
const { userQueue } = require("../worker");

module.exports = {
  postNew: async function (req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: "Missing email" });
      return;
    } else if (!password) {
      res.status(400).json({ error: "Missing password" });
      return;
    }

    let user = await dbClient.usersCollection.findOne({ email });

    if (user) {
      return res.status(400).json({ error: "Already exist" });
    }

    const { insertedId } = await dbClient.usersCollection.insertOne({
      email,
      password: sha1(password),
    });

    user = {
      id: insertedId,
      email,
    };

    await userQueue.add({ userId: user.id });

    res.status(201).json(user);
  },

  getMe: async function (req, res) {
    const token = req.header("X-Token");

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userId = await redisClient.get(`auth_${token}`);

    const user = await dbClient.usersCollection.findOne(
      { _id: ObjectId(userId) },
      { _id: 1, email: 1 }
    );

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { _id: id, email } = user;

    return res.status(200).json({ id, email });
  },
};
