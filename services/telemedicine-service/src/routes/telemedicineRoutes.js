const express = require("express");
const router = express.Router();
const telemedicineController = require("../controllers/telemedicineController");

router.post("/session/create", telemedicineController.createSession);
router.get("/session/:appointmentId", telemedicineController.getSessionByAppointmentId);
router.patch("/session/:appointmentId/end", telemedicineController.endSession);

module.exports = router;