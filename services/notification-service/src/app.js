const express = require("express");
const cors = require("cors");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Notification Service is running",
    features: ["Appointment booking notifications", "Consultation completion notifications", "Email + SMS delivery"]
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    providers: {
      email: process.env.EMAIL_USER && process.env.EMAIL_PASS ? "live" : "mock",
      sms: process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER ? "live" : "mock"
    },
    timestamp: new Date().toISOString()
  });
});

app.use("/api/notifications", notificationRoutes);

module.exports = { app };
