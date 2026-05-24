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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ]);

    const ext = file.originalname.split(".").pop()?.toLowerCase() || "";
    const csvExtensions = new Set(["xlsx", "xls", "csv"]);

    if (allowed.has(file.mimetype) || csvExtensions.has(ext)) return cb(null, true);

    cb(
      new Error(
        "Unsupported type. Use PDF, images, or Excel/CSV files (JPEG, PNG, TIFF, BMP, HEIF, XLSX, XLS, CSV)."
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

