const express = require('express');
const router = express.Router();
const { 
  authMiddleware, 
  authMiddlewareWithServiceVerification,
  enrichUserProfile,
  adminMiddleware, 
  optionalAuthMiddleware,
  serviceAuthMiddleware 
} = require('../middleware/authMiddleware');
const doctorController = require('../controllers/doctorController');
const availabilityController = require('../controllers/availabilityController');
const appointmentController = require('../controllers/appointmentController');

// Public routes (no auth required)
router.get('/search', doctorController.searchDoctors);
router.get('/specializations', doctorController.getSpecializations);
router.get('/public/:doctorId', doctorController.getPublicProfile);
router.get('/public/:doctorId/reviews', doctorController.getReviews);
router.get('/public/:doctorId/availability', availabilityController.getPublicAvailability);

// Protected routes (doctor auth required)
router.use(authMiddleware);

// Profile routes with optional auth service enrichment
router.get('/profile', enrichUserProfile, doctorController.getOrCreateProfile);
router.put('/profile', doctorController.updateProfile);
router.put('/profile/professional', doctorController.updateProfessionalInfo);
router.put('/profile/practice', doctorController.updatePracticeInfo);
router.put('/profile/avatar', doctorController.updateAvatar);

// Statistics
router.get('/statistics', doctorController.getStatistics);

// Appointment management routes
router.get('/appointments', appointmentController.getMyAppointments);
router.get('/prescriptions', appointmentController.getIssuedPrescriptions);
router.get('/appointments/pending', appointmentController.getPendingRequests);
router.get('/appointments/today', appointmentController.getTodayAppointments);
router.get('/appointments/stats', appointmentController.getAppointmentStats);
router.get('/patients/:patientId/reports', appointmentController.getPatientReports);
router.get('/patients/:patientId/prescriptions', appointmentController.getPatientPrescriptions);
router.post('/patients/:patientId/prescriptions', appointmentController.issuePrescription);
router.get('/appointments/:appointmentId/telemedicine', appointmentController.getTelemedicineSession);
router.post('/appointments/:appointmentId/telemedicine/start', appointmentController.startTelemedicineSession);
router.patch('/appointments/:appointmentId/telemedicine/end', appointmentController.endTelemedicineSession);
router.patch('/appointments/:appointmentId/accept', appointmentController.acceptAppointment);
router.patch('/appointments/:appointmentId/reject', appointmentController.rejectAppointment);
router.patch('/appointments/:appointmentId/complete', appointmentController.completeAppointment);
router.patch('/appointments/:appointmentId/in-progress', appointmentController.markInProgress);
router.patch('/appointments/:appointmentId/no-show', appointmentController.markNoShow);

// Availability routes
router.get('/availability', availabilityController.getAvailabilitySchedule);
router.post('/availability', availabilityController.setAvailability);
router.post('/availability/bulk', availabilityController.setBulkAvailability);
router.put('/availability/default', availabilityController.updateDefaultSchedule);
router.post('/availability/generate', availabilityController.generateRecurringAvailability);
router.delete('/availability/:date', availabilityController.deleteAvailability);
router.delete('/availability/clear/old', availabilityController.clearOldSchedules);

// Internal endpoints (for other services) - Protected with service-to-service auth
router.use('/sync', serviceAuthMiddleware);
router.use('/internal', serviceAuthMiddleware);

router.get('/internal/all', doctorController.getAllDoctors);
router.post('/sync', doctorController.syncDoctor);
router.post('/internal/:doctorId/book', availabilityController.bookTimeSlot);
router.post('/internal/:doctorId/release', availabilityController.releaseTimeSlot);
router.post('/internal/:doctorId/review', doctorController.addReview);

module.exports = router;
