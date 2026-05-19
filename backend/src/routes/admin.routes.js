const { Router } = require("express");
const { verifyToken, requireAdmin, verifyTokenFromHeaderOrQuery } = require("../middleware/auth.js");
const { announcementsList, gmailSync, announcementsStream } = require("../controllers/admin.controller.js");

const router = Router();

router.get("/admin/announcements", verifyToken, requireAdmin, announcementsList);
router.post("/admin/announcements/gmail-sync", verifyToken, requireAdmin, gmailSync);
router.get(
  "/admin/announcements/stream",
  verifyTokenFromHeaderOrQuery,
  requireAdmin,
  announcementsStream
);

module.exports = router;

