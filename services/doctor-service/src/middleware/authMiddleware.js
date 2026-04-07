const jwt = require('jsonwebtoken');
const { 
  verifyTokenWithAuthService, 
  getUserProfileFromAuthService,
  INTERNAL_SERVICE_SECRET 
} = require('../services/authService');

// JWT Authentication middleware - Local verification (fast, default)
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token locally using shared JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.userId = decoded.id || decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    req.userName = decoded.username;
    req.token = token; // Store token for potential auth service calls

    // Ensure only doctors can access doctor routes
    if (req.userRole !== 'doctor' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is invalid', error: error.message });
  }
};

// Auth middleware that verifies with auth service (for critical operations)
const authMiddlewareWithServiceVerification = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // First verify locally for performance
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // If local verification fails, try auth service
      console.log('Local token verification failed, trying auth service...');
    }

    // If local verification succeeded, use that data
    if (decoded) {
      req.userId = decoded.id || decoded.userId;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;
      req.userName = decoded.username;
      req.token = token;
    } else {
      // Verify with auth service
      const authData = await verifyTokenWithAuthService(token);
      
      if (!authData.valid) {
        return res.status(401).json({ message: 'Token verification failed' });
      }

      const user = authData.user;
      req.userId = user.id || user._id;
      req.userRole = user.role;
      req.userEmail = user.email;
      req.userName = user.username;
      req.token = token;
    }

    // Ensure only doctors can access doctor routes
    if (req.userRole !== 'doctor' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is invalid', error: error.message });
  }
};

// Middleware to enrich request with full user profile from auth service
const enrichUserProfile = async (req, res, next) => {
  try {
    if (!req.token) {
      return next();
    }

    // Fetch full profile from auth service
    const userProfile = await getUserProfileFromAuthService(req.token);
    req.authUserProfile = userProfile;
    next();
  } catch (error) {
    console.error('Enrich user profile error:', error.message);
    // Continue without enriched profile
    next();
  }
};

// Admin only middleware
const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Optional auth middleware for public routes that may need user info
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id || decoded.userId;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;
      req.userName = decoded.username;
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without auth info
    next();
  }
};

// Service-to-service authentication middleware
const serviceAuthMiddleware = (req, res, next) => {
  try {
    const serviceToken = req.header('X-Service-Token');
    const serviceName = req.header('X-Service-Name');

    if (!serviceToken) {
      return res.status(401).json({ message: 'Service token required' });
    }

    // Verify service token using hardcoded internal secret
    const decoded = jwt.verify(serviceToken, INTERNAL_SERVICE_SECRET);
    
    if (!decoded.service || decoded.service !== serviceName) {
      return res.status(403).json({ message: 'Invalid service credentials' });
    }

    req.serviceName = decoded.service;
    req.isServiceRequest = true;
    
    next();
  } catch (error) {
    console.error('Service auth error:', error.message);
    res.status(401).json({ message: 'Invalid service token' });
  }
};

module.exports = { 
  authMiddleware, 
  authMiddlewareWithServiceVerification,
  enrichUserProfile,
  adminMiddleware, 
  optionalAuthMiddleware,
  serviceAuthMiddleware
};
