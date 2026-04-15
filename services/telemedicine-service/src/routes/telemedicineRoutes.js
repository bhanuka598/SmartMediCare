const express = require("express");
const router = express.Router();
const telemedicineController = require("../controllers/telemedicineController");
const { getServiceHealth } = require("../services/appointmentService");

router.post("/session/create", telemedicineController.createSession);
router.get("/session/:appointmentId", telemedicineController.getSessionByAppointmentId);
router.patch("/session/:appointmentId/end", telemedicineController.endSession);

// Health check endpoint with service status
router.get("/health", async (req, res) => {
  try {
    const appointmentServiceHealth = getServiceHealth();

    res.status(200).json({
      success: true,
      service: "telemedicine-service",
      timestamp: new Date().toISOString(),
      dependencies: {
        appointmentService: appointmentServiceHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message
    });
  }
});

module.exports = router;