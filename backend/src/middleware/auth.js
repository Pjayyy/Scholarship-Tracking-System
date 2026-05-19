const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "SECRET123"
    );

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({
    status: "error",
    message: "Admin only",
  });
}

function verifyTokenFromHeaderOrQuery(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const rawToken = authHeader
      ? authHeader.split(" ")[1]
      : (req.query?.token || "").toString();

    if (!rawToken) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(
      rawToken,
      process.env.JWT_SECRET || "SECRET123"
    );

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = {
  verifyToken,
  requireAdmin,
  verifyTokenFromHeaderOrQuery,
};

