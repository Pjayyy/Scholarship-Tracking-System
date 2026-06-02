const { Router } = require("express");
const {
  verifyToken,
  requireAdmin,
} = require("../middleware/auth.js");

const { createAnnouncement } = require("../controllers/announcementAdmin.controller.js");

const router = Router();

// Admin creates an announcement manually. Triggers dispatch + MQTT publish.
router.post(
  "/admin/announcements",
  verifyToken,
  requireAdmin,
  createAnnouncement
);

module.exports = router;

