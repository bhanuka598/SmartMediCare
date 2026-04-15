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
    status: {
      type: String,
      enum: ["completed", "pending", "failed", "refunded"],
      default: "completed"
    }
  },
  { timestamps: true }
);

transactionSchema.index({ appointmentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Transaction", transactionSchema);
