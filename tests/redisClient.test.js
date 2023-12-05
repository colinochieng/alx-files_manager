const chai = require("chai");
const { expect } = chai;
const { RedisClient } = require("../utils/redis");
const sinon = require("sinon");

describe("Test Redis connection", function () {
  let redisClient = "";

  before(() => {
    const redisOptions = {
      host: "127.0.0.1",
      port: 6379,
    };
    redisClient = new RedisClient(redisOptions);
  });

  after(() => {
    redisClient.close();
  });

  it("check if the Redis client is alive", function () {
    expect(redisClient.isAlive()).to.be.a("boolean");
    expect(redisClient.isAlive()).to.be.true;
  });

  it("set and get a value from Redis", async () => {
    const key = "testKey",
      value = "testValue",
      duration = 10;

    await redisClient.set(key, value, duration);

    const retrievedValue = await redisClient.get(key);

    expect(retrievedValue).to.be.equal(value);
  });

  it("delete a key from Redis", async () => {
    const key = "redisDeleteKey";

    await redisClient.set(key, "value", 10);

    const deleteResult = await redisClient.del(key);

    const valueAfterDelete = await redisClient.get(key);

    expect(deleteResult).to.equal(1);
    expect(valueAfterDelete).to.equal(null);
  });

  it("check for ttl of set Redis key", async function () {
    this.timeout(25000);

    const [key, value] = ["name", "John Doe"];

    await redisClient.set(key, value, 5);

    const valueBeforeExpiration = await redisClient.get(key);

    expect(valueBeforeExpiration).to.be.equal(value);

    // Wait for the Redis key to expire
    await new Promise((resolve) => setTimeout(resolve, 6000));

    const valueAfterExpiration = await redisClient.get(key);
    expect(valueAfterExpiration).to.equal(null);
  });
});
