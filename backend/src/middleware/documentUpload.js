const multer = require("multer");

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/tiff",
      "image/bmp",
      "image/heif",
      "image/heic",
    ]);

    if (allowed.has(file.mimetype)) return cb(null, true);

    cb(
      new Error(
        "Unsupported type. Use PDF or common image formats (JPEG, PNG, TIFF, BMP, HEIF)."
      )
    );
  },
});

function requireDocumentAnalyzerRole(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({
    status: "error",
    message: "Only administrators can upload and scan documents.",
  });
}

module.exports = { documentUpload, requireDocumentAnalyzerRole };

