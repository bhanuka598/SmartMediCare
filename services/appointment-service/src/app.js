const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");
const appointmentRoutes = require("./routes/appointmentRoutes");
const realtimeTrackingService = require("./services/realtimeTrackingService");
const { getServiceHealth: getAuthHealth } = require("./services/authService");
const { getServiceHealth: getDoctorHealth } = require("./services/doctorService");
const { getServiceHealth: getPatientHealth } = require("./services/patientService");
const { getServiceHealth: getTelemedicineHealth } = require("./services/telemedicineService");

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
  const circuitBreakers = {
    authService: getAuthHealth(),
    doctorService: getDoctorHealth(),
    patientService: getPatientHealth(),
    telemedicineService: getTelemedicineHealth()
  };

  // Check if any circuit breaker is open
  const unhealthyServices = Object.entries(circuitBreakers)
    .filter(([_, state]) => state.state === 'OPEN')
    .map(([name, _]) => name);

  const isHealthy = unhealthyServices.length === 0;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "healthy" : "degraded",
    connectedUsers: realtimeTrackingService.getConnectedUsersCount(),
    circuitBreakers,
    unhealthyServices: unhealthyServices.length > 0 ? unhealthyServices : undefined,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/appointments", appointmentRoutes);

module.exports = { app, httpServer, io };