require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

/**
 * Mount a reverse proxy when target URL is set.
 * pathPrefix: public path on the gateway (e.g. /api/auth)
 * envKey: env var holding the upstream base URL (e.g. http://localhost:5002)
 */
function mountProxy(pathPrefix, envKey) {
  const target = process.env[envKey];
  if (!target) return;
  const escaped = pathPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  app.use(
    pathPrefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${escaped}`]: "",
      },
    })
  );
}

mountProxy("/api/auth", "AUTH_SERVICE_URL");
mountProxy("/api/patients", "PATIENT_SERVICE_URL");
mountProxy("/api/doctors", "DOCTOR_SERVICE_URL");
mountProxy("/api/appointments", "APPOINTMENT_SERVICE_URL");
mountProxy("/api/notifications", "NOTIFICATION_SERVICE_URL");
mountProxy("/api/telemedicine", "TELEMEDICINE_SERVICE_URL");
mountProxy("/api/payments", "PAYMENT_SERVICE_URL");

app.listen(PORT, () => {
  console.log(`Gateway listening on http://localhost:${PORT}`);
});
