import jwt from "jsonwebtoken";
import { BusinessOwner } from "../../models/business_model.js";

export const business_auth = async (req, res, next) => {
  try {
    // Check for token in Authorization header first, then fall back to cookies
    let token = req.cookies?.businesstoken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ 
        message: "Authentication required. No token provided", 
        status: 401 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token", status: 401 });
    }

    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in token", status: 401 });
    }

    const owner = await BusinessOwner.findById(userId).select("-password -otp");

    if (!owner) {
      return res.status(401).json({ message: "User not found", status: 401 });
    }

    // Check if account is blocked
    if (owner.status === 'blocked') {
      return res.status(403).json({
        message: "Your account has been blocked by admin. Please contact support.",
        status: 403,
        blocked: true
      });
    }

    req.user = owner;
    next();

  } catch (error) {
    console.error("Business auth error:", error);
    return res.status(401).json({ message: "Invalid or expired token", status: 401 });
  }
};

// Optional auth - doesn't require login but attaches user if logged in
export const optional_business_auth = async (req, res, next) => {
  try {
    let token = req.cookies?.businesstoken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const owner = await BusinessOwner.findById(decoded.id).select("-password -otp");
      if (owner && owner.status !== 'blocked') {
        req.user = owner;
      }
    }

    next();

  } catch (error) {
    // Don't throw error, just continue without user
    next();
  }
};
