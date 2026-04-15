const express = require('express');
const router = express.Router();
const { authMiddleware, doctorMiddleware, adminMiddleware, serviceAuthMiddleware } = require('../middleware/authMiddleware');
const patientController = require('../controllers/patientController');
const symptomController = require('../controllers/symptomController');

// Doctor access routes
router.get('/doctor-access/patients/:patientId/reports', doctorMiddleware, patientController.getPatientReportsForDoctor);
router.get('/doctor-access/patients/:patientId/prescriptions', doctorMiddleware, patientController.getPatientPrescriptionsForDoctor);
router.post('/doctor-access/patients/:patientId/prescriptions', doctorMiddleware, patientController.issuePrescriptionForPatient);
router.get('/doctor-access/prescriptions', doctorMiddleware, patientController.getDoctorIssuedPrescriptions);

router.get('/internal/:patientId', serviceAuthMiddleware, patientController.getPatientInternalProfile);

// All routes require authentication
router.use(authMiddleware);

// Profile routes
router.get('/profile', patientController.getOrCreateProfile);
router.put('/profile', patientController.updateProfile);

// Medical reports routes
router.post('/reports', patientController.uploadReport);
router.get('/reports', patientController.getReports);
router.delete('/reports/:reportId', patientController.deleteReport);

// Prescriptions routes
router.get('/prescriptions', patientController.getPrescriptions);
router.get('/prescriptions/:prescriptionId', patientController.getPrescriptionById);

// Medical history routes
router.get('/history', patientController.getMedicalHistory);
router.post('/history', patientController.addMedicalHistory);
router.delete('/history/:entryId', patientController.deleteMedicalHistory);

// Symptom Checker routes
router.post('/symptoms/analyze', symptomController.analyzeSymptoms);

// Dashboard stats
router.get('/dashboard/stats', patientController.getDashboardStats);

// Telemedicine consultations
router.get('/consultations', patientController.getMyTelemedicineConsultations);
router.get('/consultations/:appointmentId', patientController.getTelemedicineConsultation);
router.post('/consultations/:appointmentId/join', patientController.joinTelemedicineConsultation);

// Internal sync endpoint (for auth-service)
router.post('/sync', patientController.syncPatient);

module.exports = router;
