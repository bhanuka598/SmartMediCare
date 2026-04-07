const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");
const appointmentRoutes = require("./routes/appointmentRoutes");
const realtimeTrackingService = require("./services/realtimeTrackingService");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

realtimeTrackingService.initialize(io);

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Appointment Service is running",
    features: [
      "Doctor search by specialty",
      "Appointment booking",
      "Appointment modification and cancellation",
      "Real-time status tracking",
      "Queue management",
      "WebSocket support for live updates"
    ]
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    connectedUsers: realtimeTrackingService.getConnectedUsersCount(),
    timestamp: new Date().toISOString()
  });
});

app.use("/api/appointments", appointmentRoutes);

module.exports = { app, httpServer, io };