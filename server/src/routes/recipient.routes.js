const express = require("express");
const router = express.Router();
const recipientController = require("../controllers/recipient.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { uploadData } = require("../middleware/upload.middleware");
const { uploadLimiter } = require("../middleware/rateLimiter.middleware");
const {
  manualRecipientSchema,
  updateRecordSchema,
} = require("../validators/recipient.validator");

// All routes require authentication
router.use(authenticate);
router.use(authorize("super_admin", "admin"));

router.get("/", recipientController.listBatches);
router.get("/:batchId", recipientController.getBatch);
router.post(
  "/upload",
  uploadLimiter,
  uploadData,
  recipientController.uploadFile,
);
router.post(
  "/manual",
  validate(manualRecipientSchema),
  recipientController.addManual,
);
router.put(
  "/:batchId/records/:recordId",
  validate(updateRecordSchema),
  recipientController.updateRecord,
);
router.delete("/:batchId/records/:recordId", recipientController.deleteRecord);
router.delete("/:batchId", recipientController.deleteBatch);
router.post("/:batchId/revalidate", recipientController.revalidate);

module.exports = router;
