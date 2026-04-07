const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

// Public route - search doctors (with optional auth for enriched results)
router.get("/doctors/search", optionalAuth, appointmentController.searchDoctorsBySpecialty);

// Protected routes - require authentication
router.post("/", protect, appointmentController.createAppointment);
router.get("/:id", protect, appointmentController.getAppointmentById);
router.get("/:id/details", protect, appointmentController.getAppointmentWithSession);
router.put("/:id", protect, appointmentController.updateAppointment);
router.delete("/:id", protect, appointmentController.cancelAppointment);

router.get("/patient/:patientId", protect, appointmentController.getPatientAppointments);
router.get("/doctor/:doctorId", protect, appointmentController.getDoctorAppointments);

router.patch("/:id/confirm", protect, appointmentController.confirmAppointment);
router.patch("/:id/reject", protect, appointmentController.rejectAppointment);
router.patch("/:id/complete", protect, appointmentController.completeAppointment);

module.exports = router;