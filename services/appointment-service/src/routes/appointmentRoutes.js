const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { protect, optionalAuth, adminOnly, patientOnly, doctorOnly, serviceAuth } = require("../middleware/authMiddleware");

// Public routes - search doctors
router.get("/doctors/search", optionalAuth, appointmentController.searchDoctorsBySpecialty);

// Doctor availability routes
router.get("/doctors/:doctorId/schedule", protect, appointmentController.getDoctorSchedule);
router.get("/doctors/:doctorId/slots", protect, appointmentController.getAvailableSlots);

// Protected routes - require authentication

// Admin routes
router.get("/", protect, adminOnly, appointmentController.getAllAppointments);
router.get("/statistics", protect, adminOnly, appointmentController.getAppointmentStatistics);

// Internal (service-to-service)
router.patch(
  "/internal/:id/mark-paid",
  serviceAuth,
  appointmentController.markAppointmentPaidInternal
);
router.patch(
  "/internal/:id/mark-refunded",
  serviceAuth,
  appointmentController.markAppointmentRefundedInternal
);
router.get(
  "/internal/:id",
  serviceAuth,
  appointmentController.getAppointmentByIdInternal
);
router.patch(
  "/internal/:id/in-progress",
  serviceAuth,
  appointmentController.markAppointmentInProgressInternal
);
router.patch(
  "/internal/:id/complete",
  serviceAuth,
  appointmentController.completeAppointmentInternal
);
router.patch(
  "/internal/:id/no-show",
  serviceAuth,
  appointmentController.markAppointmentNoShowInternal
);

// Patient routes
router.post("/", protect, patientOnly, appointmentController.createAppointment);
router.get("/my-appointments", protect, patientOnly, appointmentController.getPatientAppointments);
router.get("/patient/:patientId", protect, patientOnly, appointmentController.getPatientAppointments);

// Doctor routes
router.get("/doctor/:doctorId", protect, doctorOnly, appointmentController.getDoctorAppointments);
router.patch("/:id/confirm", protect, doctorOnly, appointmentController.confirmAppointment);
router.patch("/:id/reject", protect, doctorOnly, appointmentController.rejectAppointment);
router.patch("/:id/complete", protect, doctorOnly, appointmentController.completeAppointment);
router.patch("/:id/in-progress", protect, doctorOnly, appointmentController.markInProgress);
router.patch("/:id/no-show", protect, doctorOnly, appointmentController.markNoShow);

// Shared routes (patient or doctor)
router.get("/:id", protect, appointmentController.getAppointmentById);
router.get("/:id/status", protect, appointmentController.getAppointmentStatus);
router.get("/:id/details", protect, appointmentController.getAppointmentWithSession);
router.put("/:id", protect, appointmentController.updateAppointment);
router.delete("/:id", protect, appointmentController.cancelAppointment);

// Rating route (patient only, after completion)
router.post("/:id/rate", protect, patientOnly, appointmentController.rateAppointment);

module.exports = router;
