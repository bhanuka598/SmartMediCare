const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyTokenAndUser, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-token', authController.verifyToken);
router.post('/send-verification', authController.sendVerification);
router.post('/verify-email', authController.verifyEmail);
router.post('/send-admin-code', authController.sendAdminCode);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', verifyToken, authController.getMe);
router.post('/change-password', verifyToken, authController.changePassword);

// Admin only routes
router.get('/users', verifyTokenAndUser, authorize('admin'), authController.getAllUsers);
router.delete('/users/:id', verifyTokenAndUser, authorize('admin'), authController.deleteUser);

module.exports = router;
