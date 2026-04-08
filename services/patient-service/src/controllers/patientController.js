const Patient = require('../models/Patient');
const appointmentService = require('../services/appointmentService');
const telemedicineService = require('../services/telemedicineService');

const hasDoctorPatientRelationship = async (doctorId, patientId, token) => {
  const result = await appointmentService.getDoctorAppointments(doctorId, token, {
    limit: 1000
  });

  return (result.data || []).some((appointment) => appointment.patientId === patientId);
};

const buildPrescriptionId = () => `RX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

// Get or create patient profile
exports.getOrCreateProfile = async (req, res) => {
  try {
    const { userId, userEmail, userName } = req;

    let patient = await Patient.findOne({ userId });

    if (!patient) {
      // Create new patient record from auth data
      patient = new Patient({
        userId,
        email: userEmail,
        username: userName,
        profile: {
          firstName: '',
          lastName: ''
        }
      });
      await patient.save();
    }

    res.json({
      success: true,
      profile: patient
    });
  } catch (error) {
    console.error('Get/Create profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get patient profile
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json({
      success: true,
      profile: patient
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update patient profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req;
    const updateData = req.body;

    let patient = await Patient.findOne({ userId });

    if (!patient) {
      // Create if doesn't exist
      patient = new Patient({
        userId,
        email: req.userEmail,
        username: req.userName,
        ...updateData
      });
    } else {
      // Update existing profile
      if (updateData.profile) {
        Object.assign(patient.profile, updateData.profile);
      }
      if (updateData.medicalHistory) {
        patient.medicalHistory = updateData.medicalHistory;
      }
    }

    await patient.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: patient
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload medical report
exports.uploadReport = async (req, res) => {
  try {
    const { userId } = req;
    const { title, fileName, fileUrl, fileType, fileSize, category, description } = req.body;

    if (!title || !fileName || !fileUrl) {
      return res.status(400).json({ message: 'Title, fileName, and fileUrl are required' });
    }

    let patient = await Patient.findOne({ userId });

    if (!patient) {
      patient = new Patient({
        userId,
        email: req.userEmail,
        username: req.userName
      });
    }

    const newReport = {
      title,
      fileName,
      fileUrl,
      fileType: fileType || 'pdf',
      fileSize: fileSize || 0,
      category: category || 'other',
      description: description || '',
      uploadedBy: 'patient',
      uploadedAt: new Date()
    };

    patient.medicalReports.push(newReport);
    await patient.save();

    // Get the last added report (which now has _id)
    const savedReport = patient.medicalReports[patient.medicalReports.length - 1];

    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      report: savedReport
    });
  } catch (error) {
    console.error('Upload report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all medical reports
exports.getReports = async (req, res) => {
  try {
    const { userId } = req;
    const { category } = req.query;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    let reports = patient.medicalReports || [];

    if (category && category !== 'all') {
      reports = reports.filter(r => r.category === category);
    }

    // Sort by uploaded date (newest first)
    reports.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({
      success: true,
      reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete medical report
exports.deleteReport = async (req, res) => {
  try {
    const { userId } = req;
    const { reportId } = req.params;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const reportIndex = patient.medicalReports.findIndex(
      r => r._id.toString() === reportId
    );

    if (reportIndex === -1) {
      return res.status(404).json({ message: 'Report not found' });
    }

    patient.medicalReports.splice(reportIndex, 1);
    await patient.save();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get prescriptions
exports.getPrescriptions = async (req, res) => {
  try {
    const { userId } = req;
    const { status, limit = 20 } = req.query;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    let prescriptions = patient.prescriptions || [];

    if (status && status !== 'all') {
      prescriptions = prescriptions.filter(p => p.status === status);
    }

    // Sort by created date (newest first)
    prescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit
    prescriptions = prescriptions.slice(0, parseInt(limit));

    res.json({
      success: true,
      prescriptions,
      count: prescriptions.length
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single prescription
exports.getPrescriptionById = async (req, res) => {
  try {
    const { userId } = req;
    const { prescriptionId } = req.params;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescription = patient.prescriptions.find(
      p => p._id.toString() === prescriptionId || p.prescriptionId === prescriptionId
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({
      success: true,
      prescription
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get medical history
exports.getMedicalHistory = async (req, res) => {
  try {
    const { userId } = req;
    const { type } = req.query;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    let history = patient.medicalHistory || [];

    if (type && type !== 'all') {
      history = history.filter(h => h.type === type);
    }

    // Sort by date
    history.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add medical history entry
exports.addMedicalHistory = async (req, res) => {
  try {
    const { userId } = req;
    const { condition, type, description, diagnosedDate, status } = req.body;

    if (!condition) {
      return res.status(400).json({ message: 'Condition is required' });
    }

    let patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const newEntry = {
      condition,
      type: type || 'other',
      description: description || '',
      diagnosedDate: diagnosedDate || null,
      status: status || 'active',
      addedAt: new Date()
    };

    patient.medicalHistory.push(newEntry);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Medical history entry added',
      entry: newEntry
    });
  } catch (error) {
    console.error('Add medical history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete medical history entry
exports.deleteMedicalHistory = async (req, res) => {
  try {
    const { userId } = req;
    const { entryId } = req.params;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const entryIndex = patient.medicalHistory.findIndex(
      h => h._id.toString() === entryId
    );

    if (entryIndex === -1) {
      return res.status(404).json({ message: 'Medical history entry not found' });
    }

    patient.medicalHistory.splice(entryIndex, 1);
    await patient.save();

    res.json({
      success: true,
      message: 'Medical history entry deleted'
    });
  } catch (error) {
    console.error('Delete medical history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { userId } = req;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const stats = {
      totalReports: patient.medicalReports?.length || 0,
      totalPrescriptions: patient.prescriptions?.length || 0,
      medicalHistoryCount: patient.medicalHistory?.length || 0,
      upcomingAppointments: patient.appointments?.filter(a => 
        a.status === 'scheduled' && new Date(a.date) >= new Date()
      ).length || 0,
      profileCompletion: calculateProfileCompletion(patient.profile)
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyTelemedicineConsultations = async (req, res) => {
  try {
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }

    const patient = await Patient.findOne({ userId });
    const consultations = (patient?.appointments || []).filter(
      (appointment) => appointment.type === 'TELEMEDICINE'
    );

    return res.json({
      success: true,
      data: consultations,
      count: consultations.length
    });
  } catch (error) {
    console.error('Get telemedicine consultations error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getTelemedicineConsultation = async (req, res) => {
  try {
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { appointmentId } = req.params;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }

    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success || !appointment.data) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.data.patientId !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to access this consultation' });
    }

    if (appointment.data.type !== 'TELEMEDICINE') {
      return res.status(400).json({ success: false, message: 'This appointment is not a video consultation' });
    }

    return res.json({
      success: true,
      data: appointment.data
    });
  } catch (error) {
    console.error('Get telemedicine consultation error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.joinTelemedicineConsultation = async (req, res) => {
  try {
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { appointmentId } = req.params;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }

    const appointment = await appointmentService.getAppointmentById(appointmentId, token);
    if (!appointment.success || !appointment.data) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.data.patientId !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to join this consultation' });
    }

    if (appointment.data.type !== 'TELEMEDICINE') {
      return res.status(400).json({ success: false, message: 'This appointment is not a video consultation' });
    }

    const session = await telemedicineService.getSessionByAppointmentId(appointmentId, token);

    return res.json({
      success: true,
      data: {
        appointment: appointment.data,
        telemedicineSession: session.data,
        meetingLink: session.data?.meetingLink || appointment.data.meetingLink || null
      }
    });
  } catch (error) {
    console.error('Join telemedicine consultation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join video consultation',
      error: error.message
    });
  }
};

exports.getPatientReportsForDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { category } = req.query;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }

    const isRelatedPatient = await hasDoctorPatientRelationship(userId, patientId, token);
    if (!isRelatedPatient) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this patient\'s reports'
      });
    }

    const patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    let reports = patient.medicalReports || [];
    if (category && category !== 'all') {
      reports = reports.filter((report) => report.category === category);
    }

    reports.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Get patient reports for doctor error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getPatientPrescriptionsForDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }

    const isRelatedPatient = await hasDoctorPatientRelationship(userId, patientId, token);
    if (!isRelatedPatient) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this patient\'s prescriptions'
      });
    }

    const patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const prescriptions = [...(patient.prescriptions || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json({
      success: true,
      data: prescriptions,
      count: prescriptions.length
    });
  } catch (error) {
    console.error('Get patient prescriptions for doctor error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.issuePrescriptionForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, userName } = req;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const {
      appointmentId,
      doctorName,
      doctorSpecialization,
      diagnosis,
      symptoms = [],
      medications = [],
      notes = '',
      followUpDate = null
    } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }

    if (!diagnosis || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Diagnosis and at least one medication are required'
      });
    }

    const isRelatedPatient = await hasDoctorPatientRelationship(userId, patientId, token);
    if (!isRelatedPatient) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to issue prescriptions for this patient'
      });
    }

    if (appointmentId) {
      const appointment = await appointmentService.getAppointmentById(appointmentId, token);
      if (!appointment.success || !appointment.data) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      if (appointment.data.patientId !== patientId || appointment.data.doctorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'This appointment does not belong to the specified patient'
        });
      }
    }

    const patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const prescription = {
      prescriptionId: buildPrescriptionId(),
      doctorId: userId,
      doctorName: doctorName || userName || 'Doctor',
      doctorSpecialization: doctorSpecialization || '',
      appointmentId: appointmentId || null,
      diagnosis,
      symptoms,
      medications,
      notes,
      followUpDate: followUpDate || null,
      status: 'active',
      createdAt: new Date()
    };

    patient.prescriptions.push(prescription);
    await patient.save();

    return res.status(201).json({
      success: true,
      message: 'Prescription issued successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Issue prescription for patient error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Helper function to calculate profile completion percentage
const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;

  const fields = [
    'firstName',
    'lastName',
    'dateOfBirth',
    'gender',
    'phone',
    'bloodType',
    'address.street',
    'emergencyContact.name'
  ];

  let filledFields = 0;

  fields.forEach(field => {
    const value = field.includes('.') 
      ? profile[field.split('.')[0]]?.[field.split('.')[1]]
      : profile[field];
    
    if (value && value !== '') {
      filledFields++;
    }
  });

  return Math.round((filledFields / fields.length) * 100);
};

// Sync patient from auth-service (internal endpoint for auth-service to call)
exports.syncPatient = async (req, res) => {
  try {
    const { userId, email, username, firstName, lastName } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ message: 'userId and email are required' });
    }

    let patient = await Patient.findOne({ userId });

    if (!patient) {
      patient = new Patient({
        userId,
        email,
        username,
        profile: {
          firstName: firstName || '',
          lastName: lastName || ''
        }
      });
      await patient.save();
      return res.status(201).json({ success: true, message: 'Patient synced' });
    }

    res.json({ success: true, message: 'Patient already exists' });
  } catch (error) {
    console.error('Sync patient error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
