const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect, adminOnly, patientOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/config", paymentController.getPaymentConfig);
router.get("/verify-session", protect, paymentController.verifyCheckoutSession);
router.get("/appointments/:appointmentId/sync", protect, paymentController.syncAppointmentPayment);
router.post("/checkout-session", protect, patientOnly, paymentController.createCheckoutSession);
router.get("/transactions", protect, paymentController.getTransactions);
router.get("/transactions/:id", protect, paymentController.getTransactionById);
router.get("/admin/transactions", protect, adminOnly, paymentController.getTransactions);

module.exports = router;
