const express = require("express");
const controller = require("../controllers/notificationController");
const { serviceAuthMiddleware } = require("../middleware/serviceAuthMiddleware");

const router = express.Router();

router.use(serviceAuthMiddleware);
router.post("/appointment-booked", controller.sendAppointmentBooked);
router.post("/consultation-completed", controller.sendConsultationCompleted);
router.post("/payment-received", controller.sendPaymentReceived);
router.post("/payment-refunded", controller.sendPaymentRefunded);
router.post("/refund-payout-paid", controller.sendRefundPayoutPaid);

module.exports = router;
