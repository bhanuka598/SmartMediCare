const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");

router.get("/doctors/search", appointmentController.searchDoctorsBySpecialty);

router.post("/", appointmentController.createAppointment);
router.get("/:id", appointmentController.getAppointmentById);
router.put("/:id", appointmentController.updateAppointment);
router.delete("/:id", appointmentController.cancelAppointment);

router.get("/patient/:patientId", appointmentController.getPatientAppointments);
router.get("/doctor/:doctorId", appointmentController.getDoctorAppointments);

router.patch("/:id/confirm", appointmentController.confirmAppointment);
router.patch("/:id/reject", appointmentController.rejectAppointment);
router.patch("/:id/complete", appointmentController.completeAppointment);

module.exports = router;