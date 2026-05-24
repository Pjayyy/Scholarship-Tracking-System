const { Router } = require("express");
const { verifyToken, requireAdmin } = require("../middleware/auth.js");
const { documentUpload, requireDocumentAnalyzerRole } = require("../middleware/documentUpload.js");
const { analyze, bulkImportStudents } = require("../controllers/documents.controller.js");

const router = Router();

router.post(
  "/documents/analyze",
  verifyToken,
  requireDocumentAnalyzerRole,
  (req, res, next) => documentUpload.single("file")(req, res, next),
  analyze
);

router.post(
  "/documents/bulk-import",
  verifyToken,
  requireAdmin,
  bulkImportStudents
);

module.exports = router;