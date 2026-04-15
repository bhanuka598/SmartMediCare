const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientName: {
      type: String,
      default: ""
    },
    patientEmail: {
      type: String,
      default: ""
    },
    doctorId: {
      type: String,
      required: true,
      index: true
    },
    doctorName: {
      type: String,
      default: ""
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "USD"
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
      index: true
    },
    paymentMethod: {
      type: String,
      default: "stripe"
    },
    stripeCheckoutSessionId: {
      type: String,
      index: true,
      sparse: true
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
      sparse: true
    },
    stripeEventId: {
      type: String,
      default: ""
    },
    paidAt: {
      type: Date,
      default: null
    },
    failureReason: {
      type: String,
      default: ""
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
