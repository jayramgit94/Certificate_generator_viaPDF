const express = require("express");
const router = express.Router();
const fileController = require("../controllers/file.controller");

// Public file streaming for uploaded assets stored in GridFS
router.get("/:id", fileController.serveFile);

module.exports = router;