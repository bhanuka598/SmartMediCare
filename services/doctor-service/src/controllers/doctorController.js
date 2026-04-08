const Doctor = require('../models/Doctor');

// Get or create doctor profile
exports.getOrCreateProfile = async (req, res) => {
  try {
    const { userId, userEmail, userName } = req;

    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      // Create new doctor record from auth data
      doctor = new Doctor({
        userId,
        email: userEmail,
        username: userName,
        profile: {
          firstName: '',
          lastName: ''
        },
        availability: {
          defaultSchedule: {
            monday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            tuesday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            wednesday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            thursday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            friday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            saturday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            sunday: { isAvailable: false, startTime: '09:00', endTime: '17:00' }
          },
          schedules: [],
          timeZone: 'UTC'
        }
      });
      await doctor.save();
    }

    res.json({
      success: true,
      profile: doctor
    });
  } catch (error) {
    console.error('Get/Create profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get doctor profile
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req;

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({
      success: true,
      profile: doctor
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get public doctor profile by ID
exports.getPublicProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findOne({ userId: doctorId, isActive: true });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Return only public information
    const publicProfile = {
      userId: doctor.userId,
      fullName: doctor.fullName,
      profile: {
        firstName: doctor.profile.firstName,
        lastName: doctor.profile.lastName,
        avatar: doctor.profile.avatar,
        bio: doctor.profile.bio,
        languages: doctor.profile.languages
      },
      professional: {
        specialization: doctor.professional.specialization,
        subSpecializations: doctor.professional.subSpecializations,
        yearsOfExperience: doctor.professional.yearsOfExperience,
        education: doctor.professional.education,
        certifications: doctor.professional.certifications
      },
      practice: {
        hospital: doctor.practice.hospital,
        department: doctor.practice.department,
        consultationFee: doctor.practice.consultationFee,
        followUpFee: doctor.practice.followUpFee,
        currency: doctor.practice.currency,
        consultationDuration: doctor.practice.consultationDuration,
        isAcceptingNewPatients: doctor.practice.isAcceptingNewPatients
      },
      ratings: {
        averageRating: doctor.ratings.averageRating,
        totalReviews: doctor.ratings.totalReviews
      },
      isVerified: doctor.isVerified
    };

    res.json({
      success: true,
      profile: publicProfile
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update doctor profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req;
    const updateData = req.body;

    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Update profile fields
    if (updateData.profile) {
      Object.assign(doctor.profile, updateData.profile);
    }

    // Update professional fields
    if (updateData.professional) {
      Object.assign(doctor.professional, updateData.professional);
    }

    // Update practice fields
    if (updateData.practice) {
      Object.assign(doctor.practice, updateData.practice);
    }

    // Update default schedule
    if (updateData.availability?.defaultSchedule) {
      Object.assign(doctor.availability.defaultSchedule, updateData.availability.defaultSchedule);
    }

    // Update timezone
    if (updateData.availability?.timeZone) {
      doctor.availability.timeZone = updateData.availability.timeZone;
    }

    doctor.updatedAt = new Date();
    await doctor.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: doctor
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update professional info
exports.updateProfessionalInfo = async (req, res) => {
  try {
    const { userId } = req;
    const { specialization, subSpecializations, licenseNumber, yearsOfExperience, education, experience, certifications } = req.body;

    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    if (specialization !== undefined) doctor.professional.specialization = specialization;
    if (subSpecializations !== undefined) doctor.professional.subSpecializations = subSpecializations;
    if (licenseNumber !== undefined) doctor.professional.licenseNumber = licenseNumber;
    if (yearsOfExperience !== undefined) doctor.professional.yearsOfExperience = yearsOfExperience;
    if (education !== undefined) doctor.professional.education = education;
    if (experience !== undefined) doctor.professional.experience = experience;
    if (certifications !== undefined) doctor.professional.certifications = certifications;

    doctor.updatedAt = new Date();
    await doctor.save();

    res.json({
      success: true,
      message: 'Professional information updated successfully',
      professional: doctor.professional
    });
  } catch (error) {
    console.error('Update professional info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update practice info
exports.updatePracticeInfo = async (req, res) => {
  try {
    const { userId } = req;
    const { hospital, department, consultationFee, followUpFee, currency, consultationDuration, isAcceptingNewPatients } = req.body;

    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    if (hospital !== undefined) doctor.practice.hospital = hospital;
    if (department !== undefined) doctor.practice.department = department;
    if (consultationFee !== undefined) doctor.practice.consultationFee = consultationFee;
    if (followUpFee !== undefined) doctor.practice.followUpFee = followUpFee;
    if (currency !== undefined) doctor.practice.currency = currency;
    if (consultationDuration !== undefined) doctor.practice.consultationDuration = consultationDuration;
    if (isAcceptingNewPatients !== undefined) doctor.practice.isAcceptingNewPatients = isAcceptingNewPatients;

    doctor.updatedAt = new Date();
    await doctor.save();

    res.json({
      success: true,
      message: 'Practice information updated successfully',
      practice: doctor.practice
    });
  } catch (error) {
    console.error('Update practice info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update profile picture
exports.updateAvatar = async (req, res) => {
  try {
    const { userId } = req;
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }

    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    doctor.profile.avatar = avatarUrl;
    doctor.updatedAt = new Date();
    await doctor.save();

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: doctor.profile.avatar
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search doctors
exports.searchDoctors = async (req, res) => {
  try {
    const {
      specialization,
      name,
      minRating,
      maxFee,
      isAcceptingNewPatients,
      city,
      language,
      page = 1,
      limit = 10,
      sortBy = 'ratings.averageRating',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };

    if (specialization) {
      query['professional.specialization'] = { $regex: specialization, $options: 'i' };
    }

    if (name) {
      query.$or = [
        { 'profile.firstName': { $regex: name, $options: 'i' } },
        { 'profile.lastName': { $regex: name, $options: 'i' } }
      ];
    }

    if (minRating) {
      query['ratings.averageRating'] = { $gte: parseFloat(minRating) };
    }

    if (maxFee) {
      query['practice.consultationFee'] = { $lte: parseFloat(maxFee) };
    }

    if (isAcceptingNewPatients === 'true') {
      query['practice.isAcceptingNewPatients'] = true;
    }

    if (city) {
      query['profile.address.city'] = { $regex: city, $options: 'i' };
    }

    if (language) {
      query['profile.languages'] = { $in: [language] };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const doctors = await Doctor.find(query)
      .select('userId profile.firstName profile.lastName profile.avatar profile.languages professional.specialization professional.yearsOfExperience practice.hospital practice.consultationFee practice.currency ratings.averageRating ratings.totalReviews isVerified')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments(query);

    res.json({
      success: true,
      doctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search doctors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all doctors (internal endpoint for appointment service)
exports.getAllDoctors = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const doctors = await Doctor.find({ isActive: true })
      .select('userId profile.firstName profile.lastName profile.avatar profile.languages professional.specialization professional.yearsOfExperience practice.hospital practice.consultationFee practice.currency ratings.averageRating ratings.totalReviews isVerified')
      .sort({ 'ratings.averageRating': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      doctors,
      count: doctors.length
    });
  } catch (error) {
    console.error('Get all doctors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDoctorInternalProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findOne({ userId: doctorId, isActive: true })
      .select("userId email username profile.firstName profile.lastName profile.phone professional.specialization practice.hospital");

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    return res.json({
      success: true,
      data: {
        userId: doctor.userId,
        email: doctor.email || "",
        phone: doctor.profile?.phone || "",
        name: doctor.fullName,
        specialty: doctor.professional?.specialization || "",
        hospital: doctor.practice?.hospital || ""
      }
    });
  } catch (error) {
    console.error("Get doctor internal profile error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all specializations
exports.getSpecializations = async (req, res) => {
  try {
    const specializations = await Doctor.distinct('professional.specialization', { isActive: true });
    
    res.json({
      success: true,
      specializations: specializations.filter(s => s && s.trim() !== '')
    });
  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get doctor statistics
exports.getStatistics = async (req, res) => {
  try {
    const { userId } = req;

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({
      success: true,
      statistics: doctor.statistics,
      ratings: {
        averageRating: doctor.ratings.averageRating,
        totalReviews: doctor.ratings.totalReviews
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Sync doctor from auth-service (internal endpoint)
exports.syncDoctor = async (req, res) => {
  try {
    const { userId, email, username, firstName, lastName } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ message: 'userId and email are required' });
    }

    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      doctor = new Doctor({
        userId,
        email,
        username,
        profile: {
          firstName: firstName || '',
          lastName: lastName || ''
        },
        availability: {
          defaultSchedule: {
            monday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            tuesday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            wednesday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            thursday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            friday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            saturday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
            sunday: { isAvailable: false, startTime: '09:00', endTime: '17:00' }
          },
          schedules: [],
          timeZone: 'UTC'
        }
      });
      await doctor.save();
      return res.status(201).json({ success: true, message: 'Doctor synced' });
    }

    res.json({ success: true, message: 'Doctor already exists' });
  } catch (error) {
    console.error('Sync doctor error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add review (called by appointment service or patient)
exports.addReview = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { patientId, patientName, rating, comment, appointmentId } = req.body;

    if (!patientId || !rating) {
      return res.status(400).json({ message: 'patientId and rating are required' });
    }

    const doctor = await Doctor.findOne({ userId: doctorId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if patient already reviewed
    const existingReview = doctor.ratings.reviews.find(r => r.patientId === patientId && r.appointmentId === appointmentId);
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this appointment' });
    }

    const review = {
      patientId,
      patientName: patientName || 'Anonymous',
      rating,
      comment: comment || '',
      appointmentId: appointmentId || null,
      createdAt: new Date()
    };

    doctor.ratings.reviews.push(review);
    doctor.calculateAverageRating();
    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get doctor reviews
exports.getReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const doctor = await Doctor.findOne({ userId: doctorId, isActive: true });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const reviews = doctor.ratings.reviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: doctor.ratings.reviews.length
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
