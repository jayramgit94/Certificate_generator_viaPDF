const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificate.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { verifyLimiter } = require("../middleware/rateLimiter.middleware");
const {
  generateCertificateSchema,
  generateBatchSchema,
  revokeCertificateSchema,
} = require("../validators/certificate.validator");

// Public verification route (no auth needed)
router.get("/verify/:certificateId", verifyLimiter, certificateController.verify);

// Protected routes
router.use(authenticate);
router.use(authorize("super_admin", "admin"));

router.get("/", certificateController.list);
router.get("/:id", certificateController.getById);
router.get("/:id/download", certificateController.download);
router.post(
  "/generate",
  validate(generateCertificateSchema),
  certificateController.generateSingle,
);
router.post(
  "/generate-batch",
  validate(generateBatchSchema),
  certificateController.generateBatch,
);
router.put(
  "/:id/revoke",
  validate(revokeCertificateSchema),
  certificateController.revoke,
);
router.delete("/:id", certificateController.deleteById);

module.exports = router;
