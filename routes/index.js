const { authenticate, strictAuthenticate } = require("../utils/authenticate");
const { fileDocument, fileDocumentData } = require("../utils/getFileDoc");

const express = require("express");
const AppController = require("../controllers/AppController");
const UserController = require("../controllers/UsersController");
const AuthController = require("../controllers/AuthController");
const FilesController = require("../controllers/FilesController");

const router = express.Router();

router.get("/status", AppController.getStatus);
router.get("/stats", AppController.getStats);
router.post("/users", UserController.postNew);
router.get("/connect", AuthController.getConnect);
router.get("/disconnect", AuthController.getDisconnect);
router.get("/users/me", UserController.getMe);
router.post("/files", strictAuthenticate, FilesController.postUpload);
router.get("/files/:id", strictAuthenticate, FilesController.getShow);
router.get("/files", FilesController.getIndex);
router.put(
  "/files/:id/publish",
  strictAuthenticate,
  fileDocument,
  FilesController.putPublish
);
router.put(
  "/files/:id/unpublish",
  strictAuthenticate,
  fileDocument,
  FilesController.putUnpublish
);
router.get(
  "/files/:id/data",
  authenticate,
  fileDocumentData,
  FilesController.getFile
);

export default router;
