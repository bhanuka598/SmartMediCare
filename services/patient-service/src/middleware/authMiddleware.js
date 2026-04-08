const jwt = require('jsonwebtoken');

// JWT Authentication middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.userId = decoded.id || decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    req.userName = decoded.username;

    // Ensure only patients can access patient routes
    if (req.userRole !== 'patient' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Patient role required.' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is invalid', error: error.message });
  }
};

const doctorMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id || decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    req.userName = decoded.username;

    if (req.userRole !== 'doctor' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    next();
  } catch (error) {
    console.error('Doctor auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is invalid', error: error.message });
  }
};

// Admin only middleware
const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

module.exports = { authMiddleware, doctorMiddleware, adminMiddleware };
