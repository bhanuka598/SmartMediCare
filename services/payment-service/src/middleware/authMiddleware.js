const jwt = require("jsonwebtoken");

const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "secret";

const protect = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: "No authentication token, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id || decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    req.userName = decoded.username;
    req.token = token;

    next();
  } catch (error) {
    console.error("Payment auth middleware error:", error.message);
    return res.status(401).json({ success: false, message: "Token is invalid", error: error.message });
  }
};

const adminOnly = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied. Admin role required." });
  }
  return next();
};

const patientOnly = (req, res, next) => {
  if (!["patient", "admin"].includes(req.userRole)) {
    return res.status(403).json({ success: false, message: "Access denied. Patient role required." });
  }
  return next();
};

const serviceAuth = (req, res, next) => {
  try {
    const serviceToken = req.header("X-Service-Token");
    const serviceName = req.header("X-Service-Name");

    if (!serviceToken || !serviceName) {
      return res.status(401).json({ success: false, message: "Service token required" });
    }

    const decoded = jwt.verify(serviceToken, INTERNAL_SERVICE_SECRET);

    if (!decoded.service || decoded.service !== serviceName) {
      return res.status(403).json({ success: false, message: "Invalid service credentials" });
    }

    req.serviceName = decoded.service;
    req.isServiceRequest = true;
    return next();
  } catch (error) {
    console.error("Payment service auth error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid service token", error: error.message });
  }
};

module.exports = {
  protect,
  adminOnly,
  patientOnly,
  serviceAuth,
  INTERNAL_SERVICE_SECRET
};
