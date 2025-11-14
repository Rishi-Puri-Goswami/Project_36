import jwt from 'jsonwebtoken';
import { Admin } from '../../models/admin_model.js';

/**
 * Admin Authentication Middleware
 * Validates JWT token and attaches admin data to request
 */
export const adminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.id).select('-secretKey');

    if (!admin) {
      return res.status(401).json({ 
        error: 'Invalid token. Admin not found.' 
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ 
        error: 'Admin account is deactivated.' 
      });
    }

    // Attach admin data to request
    req.admin = {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      name: admin.name
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }

    console.error('Error in adminAuth middleware:', error);
    return res.status(500).json({ 
      error: 'Server error during authentication',
      details: error.message 
    });
  }
};

/**
 * Super Admin Only Middleware
 * Requires adminAuth to run first
 */
export const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== 'super-admin') {
    return res.status(403).json({ 
      error: 'Access denied. Super admin only.' 
    });
  }
  next();
};
