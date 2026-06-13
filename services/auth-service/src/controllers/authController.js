const jwt = require('jsonwebtoken');
const User = require('../models/User');
const transporter = require('../config/email');
const { withRetry, isRetryableDBError, isRetryableEmailError } = require('../utils/retry');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign({
    id: user._id,
    role: user.role,
    email: user.email,
    username: user.username
  }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, medicalLicenseNumber, adminCode } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Please provide email, username, password, and role' 
      });
    }

    // Validate email format (must contain @)
    if (!email.includes('@')) {
      return res.status(400).json({
        message: 'Please enter a valid email address with @'
      });
    }

    // Validate role
    const validRoles = ['patient', 'doctor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be patient, doctor, or admin' 
      });
    }

    // Require medical license number for doctors
    if (role === 'doctor' && !medicalLicenseNumber) {
      return res.status(400).json({ 
        message: 'Medical license number is required for doctor registration' 
      });
    }

    // Validate admin registration code for admin role
    if (role === 'admin') {
      const validation = validateAdminCode(email, adminCode);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
    }

    // Check if user already exists (with retry)
    const existingUser = await withRetry(
      () => User.findOne({ 
        $or: [{ username }, { email }] 
      }),
      { shouldRetry: isRetryableDBError }
    );
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Check if medical license number is already registered (for doctors) (with retry)
    if (role === 'doctor') {
      const existingLicense = await withRetry(
        () => User.findOne({ medicalLicenseNumber }),
        { shouldRetry: isRetryableDBError }
      );
      if (existingLicense) {
        return res.status(400).json({ message: 'Medical license number already registered' });
      }
    }

    // Check if email was verified via OTP
    const verificationData = verificationCodes.get(email);
    if (!verificationData || !verificationData.verified) {
      return res.status(400).json({ 
        message: 'Email not verified. Please verify your email with the OTP first.' 
      });
    }

    // Create new user (with retry)
    const user = new User({
      username,
      email,
      password,
      role,
      medicalLicenseNumber: role === 'doctor' ? medicalLicenseNumber : null,
      isVerified: true
    });

    await withRetry(() => user.save(), { shouldRetry: isRetryableDBError });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ 
        message: 'Please provide email, password, and role' 
      });
    }

    // Find user (with retry)
    const user = await withRetry(
      () => User.findOne({ email }),
      { shouldRetry: isRetryableDBError }
    );
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Validate role matches registered role
    if (user.role !== role) {
      return res.status(403).json({ 
        message: `This account is registered as a ${user.role}. Please select the correct role to login.` 
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login (with retry)
    user.lastLogin = new Date();
    await withRetry(() => user.save(), { shouldRetry: isRetryableDBError });

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileId: user.profileId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    // Get current user (with retry)
    const user = await withRetry(
      () => User.findById(req.userId).select('-password'),
      { shouldRetry: isRetryableDBError }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide current and new password' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify token (for gateway)
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
};

// Get all users (admin only) (with retry)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await withRetry(
      () => User.find().select('-password'),
      { shouldRetry: isRetryableDBError }
    );
    res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'User id is required' });
    }

    if (String(req.userId) === String(id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const deleted = await withRetry(
      () => User.findByIdAndDelete(id),
      { shouldRetry: isRetryableDBError }
    );

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// In-memory store for verification codes (use Redis in production)
const verificationCodes = new Map();

// In-memory store for admin registration codes
const adminCodes = new Map();

// Send admin registration code
exports.sendAdminCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate admin code
    const adminCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Store code with 30 min expiry
    adminCodes.set(email, {
      code: adminCode,
      expiresAt: Date.now() + 30 * 60 * 1000
    });

    // Send email with admin code
    try {
      await transporter.sendMail({
        from: `"SmartMediCare" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'SmartMediCare - Admin Registration Code',
        text: `Your admin registration code is: ${adminCode}\n\nThis code expires in 30 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Admin Registration</h2>
            <p>You have requested to register as an administrator.</p>
            <p>Your admin registration code is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
              ${adminCode}
            </div>
            <p style="color: #6b7280;">This code expires in 30 minutes.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #9ca3af;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      });
      console.log('Admin code email sent to:', email);
    } catch (emailError) {
      console.log('Email sending failed:', emailError.message);
      // Still return the code in dev mode
    }

    res.status(200).json({ 
      message: 'Admin registration code sent to your email',
      devCode: adminCode 
    });
  } catch (error) {
    console.error('SendAdminCode error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Validate admin code during registration
const validateAdminCode = (email, code) => {
  const stored = adminCodes.get(email);
  
  if (!stored) {
    return { valid: false, message: 'No admin code found. Please request a new one.' };
  }

  if (Date.now() > stored.expiresAt) {
    adminCodes.delete(email);
    return { valid: false, message: 'Admin code expired. Please request a new one.' };
  }

  if (stored.code !== code) {
    return { valid: false, message: 'Invalid admin registration code' };
  }

  // Valid - delete after use
  adminCodes.delete(email);
  return { valid: true };
};

// Send verification code
exports.sendVerification = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    // Validate email format (must contain @)
    if (!email.includes('@')) {
      return res.status(400).json({
        message: 'Please enter a valid email address with @'
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with 10 min expiry
    verificationCodes.set(email, {
      code,
      role,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Try to send email, but don't fail if it doesn't work
    try {
      await transporter.sendMail({
        from: `"SmartMediCare" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'SmartMediCare - Email Verification Code',
        text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Email Verification</h2>
            <p>Your verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #6b7280;">This code expires in 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #9ca3af;">If you didn't request this code, please ignore this email.</p>
          </div>
        `
      });
      console.log('Email sent successfully to:', email);
    } catch (emailError) {
      console.log('Email sending failed (using console fallback):', emailError.message);
    }

    res.status(200).json({ 
      message: 'Verification code sent',
      devCode: code 
    });
  } catch (error) {
    console.error('SendVerification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify email code
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const stored = verificationCodes.get(email);

    if (!stored) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'Verification code expired. Please request a new one.' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Mark as verified (keep in memory for registration)
    stored.verified = true;

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('VerifyEmail error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// In-memory store for password reset codes
const resetCodes = new Map();

// Send password reset verification code
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format (must contain @)
    if (!email.includes('@')) {
      return res.status(400).json({
        message: 'Please enter a valid email address with @'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with 10 min expiry
    resetCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Send email
    try {
      await transporter.sendMail({
        from: `"SmartMediCare" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'SmartMediCare - Password Reset Code',
        text: `Your password reset code is: ${code}\n\nThis code expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Password Reset</h2>
            <p>You requested to reset your password.</p>
            <p>Your verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #6b7280;">This code expires in 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #9ca3af;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      });
      console.log('Password reset email sent to:', email);
    } catch (emailError) {
      console.log('Email sending failed:', emailError.message);
    }

    res.status(200).json({ 
      message: 'Password reset code sent to your email',
      devCode: code 
    });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify reset code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const stored = resetCodes.get(email);

    if (!stored) {
      return res.status(400).json({ message: 'No reset code found. Please request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Mark as verified for password reset
    stored.verified = true;

    res.status(200).json({ message: 'Code verified successfully' });
  } catch (error) {
    console.error('VerifyResetCode error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    const stored = resetCodes.get(email);

    if (!stored || !stored.verified) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    // Clear reset code
    resetCodes.delete(email);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
