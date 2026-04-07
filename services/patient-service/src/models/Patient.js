const mongoose = require('mongoose');

const MedicalReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image', 'document'],
    default: 'pdf'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['lab', 'xray', 'mri', 'ct', 'prescription', 'discharge', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: String,
    default: 'patient'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    required: true,
    unique: true
  },
  doctorId: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorSpecialization: {
    type: String,
    default: ''
  },
  appointmentId: {
    type: String,
    default: null
  },
  diagnosis: {
    type: String,
    required: true
  },
  symptoms: [{
    type: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const MedicalHistorySchema = new mongoose.Schema({
  condition: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['allergy', 'chronic', 'surgical', 'family', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    default: ''
  },
  diagnosedDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'ongoing'],
    default: 'active'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const PatientSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  profile: {
    firstName: {
      type: String,
      default: ''
    },
    lastName: {
      type: String,
      default: ''
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: ''
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    height: {
      type: Number,
      default: null
    },
    weight: {
      type: Number,
      default: null
    },
    allergies: [String],
    medications: [String],
    avatar: {
      type: String,
      default: null
    }
  },
  medicalReports: [MedicalReportSchema],
  prescriptions: [PrescriptionSchema],
  medicalHistory: [MedicalHistorySchema],
  appointments: [{
    appointmentId: String,
    doctorId: String,
    doctorName: String,
    date: Date,
    time: String,
    status: String,
    type: String,
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

PatientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Patient', PatientSchema);
