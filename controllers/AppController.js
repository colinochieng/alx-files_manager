const { dbClient } = require("../utils/db");
const { redisClient } = require("../utils/redis");

module.exports = {
  /**
   *
   * @param {Request} req : Incoming object
   * @param {Response} res : Outgoing object
   */
  getStatus: function (req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).json(status);
  },
  /**
   *
   * @param {Request} req : Incoming object
   * @param {Response} res : Outgoing object
   */
  getStats: async function (req, res) {
    const stat = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };

    res.status(200).json(stat);
  },
};
