const mongoose = require("mongoose");

const telemedicineSessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true
    },
    patientId: {
      type: String,
      required: true
    },
    doctorId: {
      type: String,
      required: true
    },
    patientName: {
      type: String,
      default: ""
    },
    doctorName: {
      type: String,
      default: ""
    },
    appointmentDate: {
      type: String,
      default: ""
    },
    appointmentTime: {
      type: String,
      default: ""
    },
    roomName: {
      type: String,
      required: true
    },
    meetingLink: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ENDED"],
      default: "ACTIVE"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TelemedicineSession",
  telemedicineSessionSchema
);