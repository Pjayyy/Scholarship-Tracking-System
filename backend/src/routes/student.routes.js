const { Router } = require("express");
const { verifyToken } = require("../middleware/auth.js");
const { me, updateMe, changePassword, announcements } = require("../controllers/student.controller.js");

const router = Router();

router.get("/student/me", verifyToken, me);
router.put("/student/me", verifyToken, updateMe);
router.put("/student/change-password", verifyToken, changePassword);
router.get("/student/announcements", verifyToken, announcements);

module.exports = router;

