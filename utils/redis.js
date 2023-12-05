const redis = require("redis");

/**
 * Redis Controller
 */
class RedisClient {
  constructor(options) {
    this.client = redis.createClient(options);

    this.client.on("error", (err) => {
      console.error(`Error connecting to Redis: ${err}`);
    });
  }

  /**
   *
   * @returns {Boolean}: if redis client is connect or not
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   *
   * @param {string} redisStringKey : key for setting redis string
   * @returns { Promise }
   */
  async get(redisStringKey) {
    return new Promise((resolve, reject) => {
      this.client.GET(redisStringKey, (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve(reply);
      });
    });
  }

  /**
   *
   * @param {string} redisStringKey : key to set value to
   * @param {string} redisStringValue : value to set
   * @param {number} duration : expiration time
   * @returns {Promise}
   */
  async set(redisStringKey, redisStringValue, duration) {
    return new Promise((resolve, reject) => {
      this.client.SET(
        redisStringKey,
        redisStringValue,
        "EX",
        duration,
        (err, reply) => {
          if (err) reject(err);

          resolve(reply);
        }
      );
    });
  }

  /**
   *
   * @param {string} redisStringKey : key to delete
   * @returns {Promise}
   */
  async del(redisStringKey) {
    return new Promise((resolve, reject) => {
      this.client.DEL(redisStringKey, (err, reply) => {
        if (err) reject(err);
        resolve(reply);
      });
    });
  }

  close() {
    this.client.quit((err, reply) => {
      if (err) {
        console.log(`Error closing Redis client: ${err}`);
      }
      // console.log('Redis client closed reply => ', reply);
    });
  }
}

const redisOptions = {
  host: "127.0.0.1",
  port: 6379,
};

const redisClient = new RedisClient(redisOptions);

module.exports = { redisClient, RedisClient };
