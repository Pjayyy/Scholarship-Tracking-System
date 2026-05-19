const { Router } = require("express");
const { verifyToken } = require("../middleware/auth.js");
const { me, announcements } = require("../controllers/student.controller.js");

const router = Router();

router.get("/student/me", verifyToken, me);
router.get("/student/announcements", verifyToken, announcements);

module.exports = router;

