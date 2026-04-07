const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const patientController = require('../controllers/patientController');

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

// Dashboard stats
router.get('/dashboard/stats', patientController.getDashboardStats);

// Internal sync endpoint (for auth-service)
router.post('/sync', patientController.syncPatient);

module.exports = router;
