const { Router } = require("express");
const { verifyToken } = require("../middleware/auth.js");
const { documentUpload, requireDocumentAnalyzerRole } = require("../middleware/documentUpload.js");
const { analyze } = require("../controllers/documents.controller.js");

const router = Router();

router.post(
  "/documents/analyze",
  verifyToken,
  requireDocumentAnalyzerRole,
  (req, res, next) => documentUpload.single("file")(req, res, next),
  analyze
);

module.exports = router;

