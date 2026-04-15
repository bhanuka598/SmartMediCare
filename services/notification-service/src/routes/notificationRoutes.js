const express = require("express");
const controller = require("../controllers/notificationController");
const { serviceAuthMiddleware } = require("../middleware/serviceAuthMiddleware");

const router = express.Router();

router.use(serviceAuthMiddleware);
router.post("/appointment-booked", controller.sendAppointmentBooked);
router.post("/consultation-completed", controller.sendConsultationCompleted);

module.exports = router;
