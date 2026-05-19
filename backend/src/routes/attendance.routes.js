const { Router } = require("express");
const { verifyToken } = require("../middleware/auth.js");
const { attendance, statsToday, logs, granteesStats } = require("../controllers/attendance.controller.js");

const router = Router();

router.post("/attendance", verifyToken, attendance);
router.get("/attendance/stats/today", verifyToken, statsToday);
router.get("/attendance/logs", verifyToken, logs);
router.get("/grantees/stats", verifyToken, granteesStats);

module.exports = router;

