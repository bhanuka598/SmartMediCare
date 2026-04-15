const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  changedBy: {
    type: String,
    default: "system"
  },
  reason: {
    type: String,
    default: ""
  }
}, { _id: false });

const reminderSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["EMAIL", "SMS", "PUSH"],
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  sentAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["PENDING", "SENT", "FAILED"],
    default: "PENDING"
  }
}, { _id: true });

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    patientName: {
      type: String,
      trim: true,
      default: ""
    },
    patientEmail: {
      type: String,
      trim: true,
      default: ""
    },
    patientPhone: {
      type: String,
      trim: true,
      default: ""
    },
    doctorId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    doctorName: {
      type: String,
      trim: true,
      default: ""
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    appointmentDate: {
      type: String,
      required: true,
      index: true
    },
    appointmentTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      default: ""
    },
    duration: {
      type: Number,
      default: 30
    },
    reason: {
      type: String,
      trim: true,
      default: ""
    },
    symptoms: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW", "IN_PROGRESS"],
      default: "PENDING",
      index: true
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },
    type: {
      type: String,
      enum: ["IN_PERSON", "TELEMEDICINE", "HOME_VISIT"],
      default: "IN_PERSON"
    },
    meetingLink: {
      type: String,
      default: ""
    },
    notes: {
      type: String,
      default: ""
    },
    doctorNotes: {
      type: String,
      default: ""
    },
    prescription: {
      type: String,
      default: ""
    },
    fee: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "USD"
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "REFUNDED", "FAILED"],
      default: "PENDING"
    },
    paymentReference: {
      type: String,
      default: ""
    },
    paidAt: {
      type: Date,
      default: null
    },
    reminders: {
      type: [reminderSchema],
      default: []
    },
    cancelledBy: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "SYSTEM", ""],
      default: ""
    },
    cancellationReason: {
      type: String,
      default: ""
    },
    rescheduleCount: {
      type: Number,
      default: 0
    },
    previousDates: {
      type: [{
        date: String,
        time: String,
        changedAt: Date
      }],
      default: []
    },
    queueNumber: {
      type: Number,
      default: null
    },
    estimatedStartTime: {
      type: String,
      default: ""
    },
    actualStartTime: {
      type: Date,
      default: null
    },
    actualEndTime: {
      type: Date,
      default: null
    },
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      feedback: {
        type: String,
        default: ""
      },
      createdAt: {
        type: Date,
        default: null
      }
    }
  },
  { timestamps: true }
);

appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, appointmentTime: 1 },
  { unique: true, partialFilterExpression: { status: { $nin: ["CANCELLED", "REJECTED"] } } }
);

appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ createdAt: -1 });

appointmentSchema.pre("save", function() {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this._changedBy || "system",
      reason: this._changeReason || ""
    });
  }
});

appointmentSchema.methods.canBeModified = function() {
  return ["PENDING", "CONFIRMED"].includes(this.status);
};

appointmentSchema.methods.canBeCancelled = function() {
  return !["COMPLETED", "CANCELLED", "REJECTED"].includes(this.status);
};

appointmentSchema.methods.isUpcoming = function() {
  const appointmentDateTime = new Date(`${this.appointmentDate}T${this.appointmentTime}`);
  return appointmentDateTime > new Date();
};

module.exports = mongoose.model("Appointment", appointmentSchema);
