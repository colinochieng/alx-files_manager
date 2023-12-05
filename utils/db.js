const { MongoClient } = require("mongodb");

const {
  DB_HOST = "localhost",
  DB_PORT = 27017,
  DB_DATABASE = "files_manager",
} = process.env;

const url = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

/**
 * Mongo Storage Controller
 */
class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true });

    this.client
      .connect()
      .then(() => {
        this.db = this.client.db();
        this.usersCollection = this.db.collection("users");
        this.filesCollection = this.db.collection("files");
      })
      .catch((err) => {
        console.log(`Error connecting to MongoDB: ${err.message}`);
        this.db = false;
      });
  }

  /**
   * Checks if connection to MongoDB is a success
   * @return {boolean}: true if connection alive otherwise false
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * @return {number}: the number of documents in the collection users
   */
  async nbUsers() {
    return this.usersCollection.countDocuments();
  }

  /**
   * @return {number}: the number of documents in the collection files
   */
  async nbFiles() {
    return this.filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();

module.exports = { dbClient, DBClient };
