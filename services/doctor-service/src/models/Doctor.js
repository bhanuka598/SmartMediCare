const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  appointmentId: {
    type: String,
    default: null
  }
}, { _id: true });

const AvailabilityScheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  timeSlots: [TimeSlotSchema],
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  },
  appointmentId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const EducationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  fieldOfStudy: {
    type: String,
    default: ''
  },
  startYear: {
    type: Number,
    default: null
  },
  endYear: {
    type: Number,
    default: null
  }
});

const ExperienceSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  startYear: {
    type: Number,
    default: null
  },
  endYear: {
    type: Number,
    default: null
  },
  isCurrent: {
    type: Boolean,
    default: false
  }
});

const DoctorSchema = new mongoose.Schema({
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
    phone: {
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
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      default: ''
    },
    languages: [{
      type: String
    }],
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  professional: {
    specialization: {
      type: String,
      default: ''
    },
    subSpecializations: [{
      type: String
    }],
    licenseNumber: {
      type: String,
      default: ''
    },
    licenseExpiry: {
      type: Date,
      default: null
    },
    yearsOfExperience: {
      type: Number,
      default: 0
    },
    education: [EducationSchema],
    experience: [ExperienceSchema],
    certifications: [{
      name: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date
    }]
  },
  practice: {
    hospital: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    consultationFee: {
      type: Number,
      default: 0
    },
    followUpFee: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    consultationDuration: {
      type: Number,
      default: 30
    },
    isAcceptingNewPatients: {
      type: Boolean,
      default: true
    }
  },
  availability: {
    defaultSchedule: {
      monday: { isAvailable: Boolean, startTime: String, endTime: String },
      tuesday: { isAvailable: Boolean, startTime: String, endTime: String },
      wednesday: { isAvailable: Boolean, startTime: String, endTime: String },
      thursday: { isAvailable: Boolean, startTime: String, endTime: String },
      friday: { isAvailable: Boolean, startTime: String, endTime: String },
      saturday: { isAvailable: Boolean, startTime: String, endTime: String },
      sunday: { isAvailable: Boolean, startTime: String, endTime: String }
    },
    schedules: [AvailabilityScheduleSchema],
    timeZone: {
      type: String,
      default: 'UTC'
    }
  },
  ratings: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    reviews: [ReviewSchema]
  },
  statistics: {
    totalAppointments: {
      type: Number,
      default: 0
    },
    completedAppointments: {
      type: Number,
      default: 0
    },
    cancelledAppointments: {
      type: Number,
      default: 0
    },
    totalPatients: {
      type: Number,
      default: 0
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for searching doctors
DoctorSchema.index({ 'profile.firstName': 'text', 'profile.lastName': 'text', 'professional.specialization': 'text' });
DoctorSchema.index({ 'professional.specialization': 1 });
DoctorSchema.index({ 'ratings.averageRating': -1 });
DoctorSchema.index({ 'practice.consultationFee': 1 });

// Virtual for full name
DoctorSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`.trim() || this.username;
});

// Method to calculate average rating
DoctorSchema.methods.calculateAverageRating = function() {
  if (this.ratings.reviews.length === 0) {
    this.ratings.averageRating = 0;
    this.ratings.totalReviews = 0;
    return;
  }
  
  const sum = this.ratings.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.ratings.averageRating = sum / this.ratings.reviews.length;
  this.ratings.totalReviews = this.ratings.reviews.length;
};

// Method to get availability for a date range
DoctorSchema.methods.getAvailabilityForRange = function(startDate, endDate) {
  return this.availability.schedules.filter(schedule => 
    schedule.date >= startDate && schedule.date <= endDate
  );
};

// Method to check if time slot is available
DoctorSchema.methods.isTimeSlotAvailable = function(date, startTime, endTime) {
  const schedule = this.availability.schedules.find(s => 
    s.date.toDateString() === new Date(date).toDateString()
  );
  
  if (!schedule || !schedule.isAvailable) {
    return false;
  }
  
  return schedule.timeSlots.some(slot => 
    slot.startTime === startTime && 
    slot.endTime === endTime && 
    slot.isAvailable && 
    !slot.isBooked
  );
};

module.exports = mongoose.model('Doctor', DoctorSchema);
