const { Router } = require("express");
const { verifyToken } = require("../middleware/auth.js");
const { info } = require("../controllers/qr.controller.js");

const router = Router();

router.post("/qr/info", verifyToken, info);

module.exports = router;

