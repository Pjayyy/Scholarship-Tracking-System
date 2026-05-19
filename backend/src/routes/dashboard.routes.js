const { Router } = require("express");
const { verifyToken } = require("../middleware/auth.js");
const { dashboardStats } = require("../controllers/dashboard.controller.js");

const router = Router();

router.get("/dashboard/stats", verifyToken, dashboardStats);

module.exports = router;

