const jwt = require("jsonwebtoken");

const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "secret";

const serviceAuthMiddleware = (req, res, next) => {
  try {
    const serviceToken = req.header("X-Service-Token");
    const serviceName = req.header("X-Service-Name");

    if (!serviceToken || !serviceName) {
      return res.status(401).json({ success: false, message: "Service credentials are required" });
    }

    const decoded = jwt.verify(serviceToken, INTERNAL_SERVICE_SECRET);
    if (decoded.service !== serviceName) {
      return res.status(403).json({ success: false, message: "Invalid service credentials" });
    }

    req.serviceName = serviceName;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid service token", error: error.message });
  }
};

module.exports = { serviceAuthMiddleware };
