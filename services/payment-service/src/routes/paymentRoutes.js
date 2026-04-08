const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect, adminOnly, patientOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/config", paymentController.getPaymentConfig);
router.post("/checkout-session", protect, patientOnly, paymentController.createCheckoutSession);
router.get("/transactions", protect, paymentController.getTransactions);
router.get("/transactions/:id", protect, paymentController.getTransactionById);
router.get("/admin/transactions", protect, adminOnly, paymentController.getTransactions);

module.exports = router;
