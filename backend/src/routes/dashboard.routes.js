const { Router } = require("express");
const { verifyToken } = require("../middleware/auth.js");
const {
  dashboardStats,
  monthlyDistribution,
  statusDistribution,
  monitoringStats,
  presenceHeartbeat,
  onlineNow,
} = require("../controllers/dashboard.controller.js");
const { forecastsList, predictRisk } = require("../controllers/forecast.controller.js");

const router = Router();

router.get("/dashboard/stats", verifyToken, dashboardStats);

// Dashboard metrics (admin)
router.get("/dashboard/monthly-distribution", verifyToken, monthlyDistribution);
router.get("/dashboard/status-distribution", verifyToken, statusDistribution);
router.get("/dashboard/monitoring-stats", verifyToken, monitoringStats);

// Presence (student portal heartbeat)
router.post("/dashboard/presence/heartbeat", verifyToken, presenceHeartbeat);
router.get("/dashboard/online-now", verifyToken, onlineNow);

// Scholarship risk forecasting (admin)
router.get("/forecast", verifyToken, forecastsList);
router.post("/predict", verifyToken, predictRisk);

module.exports = router;



