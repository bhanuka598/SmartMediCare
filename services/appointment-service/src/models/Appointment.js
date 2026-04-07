const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      trim: true
    },
    patientName: {
      type: String,
      trim: true,
      default: ""
    },
    doctorId: {
      type: String,
      required: true,
      trim: true
    },
    doctorName: {
      type: String,
      trim: true,
      default: ""
    },
    specialty: {
      type: String,
      required: true,
      trim: true
    },
    appointmentDate: {
      type: String,
      required: true
    },
    appointmentTime: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"],
      default: "PENDING"
    },
    meetingLink: {
      type: String,
      default: ""
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, appointmentTime: 1 },
  { unique: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);