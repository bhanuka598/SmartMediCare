const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, default: "" },
    doctorId: { type: String, default: "" },
    doctorName: { type: String, default: "" },
    appointmentId: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    paymentMethod: { type: String, default: "card" },
    stripeSessionId: { type: String, default: "" },
    stripePaymentIntentId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["completed", "pending", "failed", "refunded"],
      default: "completed"
    },
    refundId: { type: String, default: "" },
    refundReason: { type: String, default: "" },
    refundedBy: { type: String, default: "" },
    refundedAt: { type: Date, default: null },
    refundRequesterName: { type: String, default: "" },
    refundRequesterEmail: { type: String, default: "" },
    refundRequesterPhone: { type: String, default: "" },
    refundPayoutStatus: {
      type: String,
      enum: ["none", "pending", "paid", "failed", "rejected"],
      default: "none"
    },
    refundPayoutSessionId: { type: String, default: "" },
    refundPayoutPaidAt: { type: Date, default: null },
    refundPayoutRejectReason: { type: String, default: "" },
    refundPayoutRejectedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

transactionSchema.index({ appointmentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Transaction", transactionSchema);
