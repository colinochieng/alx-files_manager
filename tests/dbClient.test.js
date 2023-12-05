const { expect } = require("chai");
const { DBClient } = require("../utils/db");

describe("Test DBclient", function () {
  this.timeout(25000);

  let dbClient;

  before(async () => {
    dbClient = new DBClient();

    // await for connection
    await new Promise((resolve) => setTimeout(resolve, 10000));
  });
  after(async () => {
    await dbClient.client.close();
  });

  it("establish a connection to MongoDB", () => {
    expect(dbClient.isAlive()).to.equal(true);
  });

  it("retrieve the number of documents in users collection", async () => {
    const userCount = await dbClient.nbUsers();
    expect(userCount).to.be.a("number").and.to.be.at.least(0);
  });

  it("should retrieve the number of documents in files collection", async () => {
    const fileCount = await dbClient.nbFiles();
    expect(fileCount).to.be.a("number").and.to.be.at.least(0);
  });

  it("usersCollection exists and works well", async function () {
    const userCount = await dbClient.nbUsers();

    await dbClient.usersCollection.insertOne({ name: "Smith Test" });
    await dbClient.usersCollection.insertOne({ name: "John Test" });

    expect(await dbClient.nbUsers()).to.be.equal(userCount + 2);

    await dbClient.usersCollection.deleteOne({ name: "Smith Test" });
    await dbClient.usersCollection.deleteOne({ name: "John Test" });

    expect(await dbClient.nbUsers()).to.be.equal(userCount);
  });

  it("filesCollection exists and works well", async function () {
    const fileCount = await dbClient.nbFiles();

    await dbClient.filesCollection.insertOne({ name: "file1.test.txt" });
    await dbClient.filesCollection.insertOne({ name: "file2.test.txt" });

    expect(await dbClient.nbFiles()).to.be.equal(fileCount + 2);

    await dbClient.filesCollection.deleteOne({ name: "file1.test.txt" });
    await dbClient.filesCollection.deleteOne({ name: "file2.test.txt" });

    expect(await dbClient.nbFiles()).to.be.equal(fileCount);
  });
});
