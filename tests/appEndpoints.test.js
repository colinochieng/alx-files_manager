const chai = require("chai");
const chaiHttp = require("chai-http");
const { DBClient } = require("../utils/db");
const request = require("request");
const uuid = require("uuid");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const { redisClient } = require("../utils/redis");

const expect = chai.expect;
chai.use(chaiHttp);

const dbClient = new DBClient();

describe("Endpoints Testing", function () {
  this.timeout(25000);
  // Assuming your server is running on port 5000, change it if needed
  const baseURL = "http://localhost:5000";
  const [email, password] = ["fileManagerUser@mocha.chai.test", "fakePass"];
  const Authorization =
    "Basic ZmlsZU1hbmFnZXJVc2VyQG1vY2hhLmNoYWkudGVzdDpmYWtlUGFzcw==";

  this.beforeAll(async () => {
    // delay for connection of dbClient
    await new Promise((resolve) => setTimeout(resolve, 6000));
  });

  this.afterAll(async () => {
    await dbClient.client.close();
  });

  describe("General Endpoints Testing", () => {
    it("GET /status should return status of redis and db", async () => {
      const res = await chai.request(baseURL).get("/status");

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("redis").to.be.a("boolean");
      expect(res.body).to.have.property("db").to.be.a("boolean");
    });

    it("GET /stats should return user and file statistics", async () => {
      const res = await chai.request(baseURL).get("/stats");

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("users").to.be.a("number");
      expect(res.body).to.have.property("files").to.be.a("number");
    });
  });

  describe("User creation Endpoints Testing", function () {
    this.afterEach(async () => {
      await dbClient.usersCollection.deleteOne({ email });
    });

    it("POST /users (no email or password), should return error messages", async function () {
      chai
        .request(baseURL)
        .post("/users")
        .send({})
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(400);
          expect(res.body).to.haveOwnProperty("error", "Missing email");
        });

      chai
        .request(baseURL)
        .post("/users")
        .send({ email })
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(400);
          expect(res.body).to.haveOwnProperty("error", "Missing password");
        });
    });

    it("POST /users create new user (success)", function () {
      chai
        .request(baseURL)
        .post("/users")
        .send({ email, password })
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(201);
          expect(res.body).to.haveOwnProperty("id");
          expect(res.body).has.own.property("email", email);
        });
    });

    it("POST /users (use existing user)", async function () {
      await dbClient.usersCollection.insertOne({ email, password });
      chai
        .request(baseURL)
        .post("/users")
        .send({ email, password })
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(400);
          expect(res.body).to.haveOwnProperty("error", "Already exist");
        });
    });
  });

  describe("Test User connect and disconnect", function () {
    let userToken = "";
    before(() => {
      // create user
      request.post(
        {
          url: baseURL + "/users",
          json: {
            email,
            password,
          },
        },
        (err, response, body) => {
          if (err) {
            console.log(err);
          }
        }
      );

      request.get(
        {
          uri: baseURL + "/connect",
          headers: { Authorization },
        },
        (error, res, body) => {
          if (error) {
            console.log(error);
          }
          userToken = body["token"];
        }
      );
    });

    after(async () => {
      await dbClient.usersCollection.deleteOne({ email, password });
      await redisClient.del(`auth_${userToken}`);
    });

    it("test connect without Authorization header", function () {
      chai
        .request(baseURL)
        .get("/connect")
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(401);
          expect(res.body).to.haveOwnProperty("error", "Unauthorized");
        });
    });

    it("test connect with Authorization header", function () {
      chai
        .request(baseURL)
        .get("/connect")
        .set("Authorization", Authorization)
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body["token"]).not.to.be.null;
        });
    });

    it("test disconnect without X-Token header", function () {
      // Assuming connect test was successful
      chai
        .request(baseURL)
        .get("/disconnect")
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(401);
          expect(res.body).to.haveOwnProperty("error", "Unauthorized");
        });
    });

    it("test disconnect with Authorization header", function () {
      chai
        .request(baseURL)
        .get("/disconnect")
        .set("X-Token", userToken)
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(204);
          expect(res.body).to.be.empty;
        });
    });
  });

  describe("Test (with/without connection) user and files", function () {
    let userToken = "";
    let trackFilesId = [];
    const imageFileData = fs
      .readFileSync("./landscraping.png")
      .toString("base64");

    before(() => {
      // create user
      request.post(
        {
          url: baseURL + "/users",
          json: {
            email,
            password,
          },
        },
        (err, response, body) => {
          if (err) {
            console.log(err);
          }
        }
      );

      // connect user

      request.get(
        {
          url: baseURL + "/connect",
          headers: { Authorization },
        },
        (err, response, body) => {
          if (err) {
            console.log(err);
          }

          if (response.statusCode === 200) {
            userToken = JSON.parse(body)["token"];
          } else {
            console.log(`Error connecting user`);
          }
        }
      );
    });

    after(async () => {
      // delete the mocked user
      await dbClient.usersCollection.deleteOne({ email, password });

      trackFilesId.forEach(async (value) => {
        await dbClient.filesCollection.deleteOne({ _id: ObjectId(value) });
      });
    });

    it("GET /users/me (without token)", function () {
      chai
        .request(baseURL)
        .get("/users/me")
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(401);
          expect(res.body).to.haveOwnProperty("error", "Unauthorized");
        });
    });

    it("GET /users/me (with token)", function () {
      chai
        .request(baseURL)
        .get("/users/me")
        .set("token", userToken)
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body).to.haveOwnProperty("id");
          expect(res.body).to.haveOwnProperty("email", email);
        });
    });

    // POST /files
    it("POST /files (without token)", function () {
      chai
        .request(baseURL)
        .get("/files")
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(401);
          expect(res.body).to.haveOwnProperty("error", "Unauthorized");
        });
    });

    it("POST /files (with token: missing crucial info for file creation)", function () {
      // array of arrays of [0] => missing value [1] => data sent
      const brokenUserData = [
        ["name", { type: "file", data: "SGVsbG8gV2Vic3RhY2shCg==" }],
        ["type", { name: "testFile.txt", data: "SGVsbG8gV2Vic3RhY2shCg==" }],
        [
          "type",
          {
            name: "testFile.txt",
            type: "video",
            data: "SGVsbG8gV2Vic3RhY2shCg==",
          },
        ],
        [("data", { name: "testFile.txt", type: "file" })], // wrong type // No data and is file
      ];

      brokenUserData.forEach(([missing, postData]) => {
        chai
          .request(baseURL)
          .get("/files")
          .set("token", userToken)
          .send(postData)
          .end((err, res) => {
            expect(res.statusCode).to.be.equal(400);
            expect(res.body).to.haveOwnProperty("error", `Missing ${missing}`);
          });
      });
    });

    it("POST /files (with token: with unknown parentId)", function () {
      const postData = {
        name: "testFile.txt",
        type: "file",
        data: "SGVsbG8gV2Vic3RhY2shCg==",
        parentId: uuid.v4(),
      };

      chai
        .request(baseURL)
        .get("/files")
        .set("token", userToken)
        .send(postData)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(400);
          expect(res.body).to.haveOwnProperty("error", "Parent not found");
        });
    });

    it("POST /files (with token: parentId set to Id not of folder)", async function () {
      // create a mock file in db
      const { insertedId } = await dbClient.filesCollection.insertOne({
        name: "mock.test.txt",
        type: "file",
        data: "Testing file",
      });
      const postData = {
        name: "testFile.txt",
        type: "file",
        data: "SGVsbG8gV2Vic3RhY2shCg==",
        parentId: insertedId.toHexString(),
      };

      chai
        .request(baseURL)
        .get("/files")
        .set("token", userToken)
        .send(postData)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(400);
          expect(res.body).to.haveOwnProperty(
            "error",
            "Parent is not a folder"
          );
        });
      await dbClient.filesCollection.deleteOne({ id: insertedId });
    });

    // create files successfully

    it("POST /files create folder successfully", async function () {
      const postData = { name: "images", type: "folder" };

      chai
        .request(baseURL)
        .get("/files")
        .set("token", userToken)
        .send(postData)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(201);
          expect(res.body).to.haveOwnProperty("isPublic", false);

          trackFilesId.push(res.body["id"]);
        });
    });

    it("POST /files create file successfuly", async function () {
      const postData = {
        name: "mock.txt",
        type: "file",
        data: "SGVsbG8gV2Vic3RhY2shCg==",
      };

      chai
        .request(baseURL)
        .get("/files")
        .set("token", userToken)
        .send(postData)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(201);
          expect(res.body).to.haveOwnProperty("isPublic", false);
          trackFilesId.push(res.body["id"]);
        });
    });

    it("POST /files create image successfuly", async function () {
      // assuming folder was created
      const postData = {
        name: "mock.png",
        type: "image",
        data: imageFileData,
        parentId: trackFilesId[0],
      };

      chai
        .request(baseURL)
        .get("/files")
        .set("token", userToken)
        .send(postData)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(201);
          expect(res.body).to.haveOwnProperty("isPublic", false);

          trackFilesId.push(res.body["id"]);
        });
    });

    // assuming files were created successfully
    // tests acquisition of files

    it("tests GET /files/:id (no token)", function () {
      trackFilesId.forEach((fileId) => {
        chai
          .request(baseURL)
          .get(`/files/${fileId}`)
          .send()
          .end((err, res) => {
            expect(res.statusCode).to.be.equal(401);
            expect(res.body).to.haveOwnProperty("error", "Unauthorized");
          });
      });
    });

    it("tests GET /files/:id (with token)", function () {
      trackFilesId.forEach((fileId) => {
        chai
          .request(baseURL)
          .get(`/files/${fileId}`)
          .set(token, userToken)
          .send()
          .end((err, res) => {
            expect(res.statusCode).to.be.equal(200);
            expect(res.body).to.haveOwnProperty("id", fileId);
          });
      });
    });

    /* it("tests GET /files (with parentId)", function () {
      chai
        .request(baseURL)
        .get(`/files`)
        .query({ parentId: trackFilesId[0] })
        .set("token", userToken)
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body).to.be.an("array");
          expect(res.body[0]).to.be.an("object").to.haveOwnProperty("id");
        });
    }); */

    // test publish and unpublish
    // no authontication token
    it("PUT /files/:id/publish", function () {
      trackFilesId.forEach((fileId) => {
        chai
          .request(baseURL)
          .get(`/files/${fileId}/publish`)
          .send()
          .end((err, res) => {
            expect(res.statusCode).to.be.equal(401);
            expect(res.body).to.haveOwnProperty("error", "Unauthorized");
          });
      });
    });

    it("PUT /files/:id/publish", function () {
      trackFilesId.forEach((fileId) => {
        chai
          .request(baseURL)
          .get(`/files/${fileId}/unpublish`)
          .send()
          .end((err, res) => {
            expect(res.statusCode).to.be.equal(401);
            expect(res.body).to.haveOwnProperty("error", "Unauthorized");
          });
      });
    });

    // set user token
    it("PUT /files/:id/publish", function () {
      trackFilesId.forEach((fileId) => {
        chai
          .request(baseURL)
          .get(`/files/${fileId}/publish`)
          .set(token, userToken)
          .send()
          .end((err, res) => {
            expect(res.statusCode).to.be.equal(200);
            expect(res.body).to.haveOwnProperty("isPublic", true);
          });
      });
    });

    it("PUT /files/:id/publish", function () {
      trackFilesId.forEach((fileId) => {
        chai
          .request(baseURL)
          .get(`/files/${fileId}/publish`)
          .set(token, userToken)
          .send()
          .end((err, res) => {
            expect(res.statusCode).to.be.equal(200);
            expect(res.body).to.haveOwnProperty("isPublic", false);
          });
      });
    });

    // use unknown file id
    it("GET /files/:id/data", function () {
      const fileId = uuid.v4();
      chai
        .request(baseURL)
        .get(`/files/${fileId}/data`)
        .set("token", userToken)
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(404);
          expect(res.body).to.haveOwnProperty("error", "Not found");
        });
    });

    // no user authenticate file document
    // (folder or file) is not public (isPublic: false)
    // use unknown file id
    it("GET /files/:id/data", async function () {
      const fileId = trackFilesId[1];
      await dbClient.filesCollection.updateOne(
        { _id: ObjectId(fileId) },
        { $set: { isPublic: false } }
      );

      chai
        .request(baseURL)
        .get(`/files/${fileId}/data`)
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(404);
          expect(res.body).to.haveOwnProperty("error", "Not found");
        });
    });

    // If the type of the file document is folder,
    // return an error A folder doesn't have content with a status code 400
    it("GET /files/:id/data", function () {
      const fileId = trackFilesId[0];
      chai
        .request(baseURL)
        .get(`/files/${fileId}/data`)
        .set("token", userToken)
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(400);
          expect(res.body).to.haveOwnProperty(
            "error",
            "A folder doesn't have content"
          );
        });
    });

    // get content of file with all info
    it("GET /files/:id/data", function () {
      const fileId = trackFilesId[1];
      chai
        .request(baseURL)
        .get(`/files/${fileId}/data`)
        .set("token", userToken)
        .send()
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body).to.haveOwnProperty("data");
        });
    });
  });
});
