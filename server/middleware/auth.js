const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole) && !allowedRoles.includes('both')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Check if user owns resource
const requireOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check if user owns the resource
      const ownerField = resource.provider ? 'provider' : 'user';
      if (resource[ownerField].toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireOwnership,
  generateToken
};
