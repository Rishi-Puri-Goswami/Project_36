import jwt from "jsonwebtoken";
import { Worker } from "../../models/worker_model.js";

export const worker_auth = async (req, res, next) => {
  try {
    const token = req.cookies?.workertoken;
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required", status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token", status: 401 });
    }

    const userId = decoded.id;
    const worker = await Worker.findById(userId).select('-password -otp');

    if (!worker) {
      return res.status(401).json({ message: "Worker not found", status: 401 });
    }

    // Check if worker account is blocked
    if (worker.accountStatus === 'blocked') {
      return res.status(403).json({ 
        message: "Your account has been blocked by admin. Please contact support.", 
        status: 403,
        blocked: true
      });
    }

    req.worker = worker;
    next();

  } catch (error) {
    console.error("Worker auth middleware error:", error);
    return res.status(401).json({ message: "Authentication failed", status: 401 });
  }
};

export const validWorker = async (req, res, next) => {
  try {
    const token = req.cookies?.workertoken;
    
    if (!token) {
      return res.status(401).json({ 
        message: "No authentication token found", 
        status: 401 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ 
        message: "Invalid authentication token", 
        status: 401 
      });
    }

    const worker = await Worker.findById(decoded.id).select('-password -otp');
    
    if (!worker) {
      return res.status(404).json({ 
        message: "Worker account not found", 
        status: 404 
      });
    }

    // Check if worker account is blocked
    if (worker.accountStatus === 'blocked') {
      return res.status(403).json({ 
        message: "Your account has been blocked by admin. Please contact support.", 
        status: 403,
        blocked: true
      });
    }

    req.worker = worker;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Invalid token format", 
        status: 401 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Token has expired", 
        status: 401 
      });
    }

    console.error("Worker validation error:", error);
    return res.status(500).json({ 
      message: "Server error during authentication", 
      status: 500 
    });
  }
};




