const sha1 = require("sha1");
const { dbClient } = require("../utils/db");
const uuid = require("uuid");
const { redisClient } = require("../utils/redis");

module.exports = {
  /**
   * @param { Request } req
   * @param { Response } res
   * @returns { Response }
   */
  getConnect: async function (req, res) {
    const Authorization = req.header("Authorization") || "";

    const authBase64 = Authorization.split(" ")[1];

    if (!authBase64) return res.status(401).json({ error: "Unauthorized" });

    const [email, password] = Buffer.from(authBase64, "base64")
      .toString("utf8")
      .split(":");

    if (!email || !password)
      return res.status(401).json({ error: "Unauthorized" });

    const user = await dbClient.usersCollection.findOne({
      email,
      password: sha1(password),
    });

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const token = uuid.v4();
    const redisStringKey = `auth_${token}`;

    await redisClient.set(redisStringKey, user._id.toHexString(), 24 * 3600);

    return res.status(200).send({ token });
  },

  /**
   * Every authenticated endpoints of our API will look
   * at this token inside the header X-Token
   * @param { Request } req
   * @param { Response } res
   */
  getDisconnect: async function (req, res) {
    const token = req.header("X-Token");

    if (!token) return res.status(401).send({ error: "Unauthorized" });

    try {
      await redisClient.del(`auth_${token}`);
    } catch (error) {
      console.error(error);
    }

    return res.status(204).send();
  },
};
