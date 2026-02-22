const express = require("express");
const router = express.Router();
const templateController = require("../controllers/template.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const {
  uploadTemplate,
  uploadFont,
  uploadSignature,
} = require("../middleware/upload.middleware");
const { uploadLimiter } = require("../middleware/rateLimiter.middleware");
const {
  createTemplateSchema,
  updateTemplateSchema,
} = require("../validators/template.validator");

// All routes require authentication
router.use(authenticate);
router.use(authorize("super_admin", "admin"));

router.get("/", templateController.list);
router.get("/:id", templateController.getById);
router.post("/", uploadLimiter, uploadTemplate, templateController.create);
router.put("/:id", templateController.update);
router.delete("/:id", templateController.remove);
router.post("/:id/duplicate", templateController.duplicate);
router.put("/:id/default", templateController.setDefault);
router.post(
  "/:id/fonts",
  uploadLimiter,
  uploadFont,
  templateController.uploadFont,
);
router.post(
  "/:id/signature",
  uploadLimiter,
  uploadSignature,
  templateController.uploadSignature,
);
router.post(
  "/:id/upload-background",
  uploadLimiter,
  uploadTemplate,
  templateController.uploadBackground,
);

module.exports = router;
