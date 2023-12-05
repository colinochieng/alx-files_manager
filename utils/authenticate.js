const { redisClient } = require("./redis");
const { dbClient } = require("./db");
const { ObjectId } = require("mongodb");

/**
 * authonticate user
 * @param {Request} req
 * @param {Response} res
 * @param {Callback} next
 */

export const strictAuthenticate = async (req, res, next) => {
  // Retrieve the user based on the token
  const token = req.header("X-Token");

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await dbClient.usersCollection.findOne({
    _id: ObjectId(userId),
  });

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Attach the user to the request for further use
  req.userId = userId;
  req.user = user;

  // Continue with the next middleware or the main handler
  next();
};

export const authenticate = async (req, res, next) => {
  // Retrieve the user based on the token
  // return no error message
  const token = req.header("X-Token");

  if (token) {
    const userId = await redisClient.get(`auth_${token}`);

    if (userId) {
      const user = await dbClient.usersCollection.findOne({
        _id: ObjectId(userId),
      });

      // Attach the user to the request for further use

      if (user) {
        req.userId = userId;
        req.user = user;
      }
    }
  }

  next();
};
