const jwt = require('jsonwebtoken');
const User = require('../models/User');
const transporter = require('../config/email');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, medicalLicenseNumber } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Please provide email, username, password, and role' 
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

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Check if medical license number is already registered (for doctors)
    if (role === 'doctor') {
      const existingLicense = await User.findOne({ medicalLicenseNumber });
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

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role,
      medicalLicenseNumber: role === 'doctor' ? medicalLicenseNumber : null,
      isVerified: true
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

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
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

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
    const user = await User.findById(req.userId).select('-password');
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
    const user = await User.findById(decoded.userId).select('-password');

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

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// In-memory store for verification codes (use Redis in production)
const verificationCodes = new Map();

// Send verification code
exports.sendVerification = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
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

    // Always log to console for development
    console.log('\n=== VERIFICATION CODE ===');
    console.log('Email:', email);
    console.log('Code:', code);
    console.log('=========================\n');

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
