import express from "express";
import {
  // Auth
  registerBusinessOwner,
  verifyBusinessOtp,
  resendBusinessOtp,
  loginBusinessOwner,
  verifyBusinessAuth,
  getBusinessProfile,
  logoutBusinessOwner,
  sendBusinessForgotOtp,
  verifyBusinessForgotOtp,
  resetBusinessPassword,
  updateBusinessOwnerProfile,
  uploadOwnerProfilePicture,
  getBusinessImageKitAuth,
  
  // Business CRUD
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  uploadBusinessImages,
  uploadBusinessLogo,
  
  // Reviews
  addReview,
  updateReview,
  deleteReview,
  getBusinessReviews,
  uploadReviewImages,
  
  // Public
  getAllBusinesses,
  searchBusinesses,
  getBusinessTypes,
  getFilterOptions
} from "../controllers/businessController.js";

import { business_auth, optional_business_auth } from "../middlewares/business_middlewares/business_auth.js";
import { upload } from "../middlewares/uploads/upload.js";

const businessRouter = express.Router();

// ==================== AUTH ROUTES (Public) ====================
businessRouter.post('/register', registerBusinessOwner);
businessRouter.post('/verify-otp', verifyBusinessOtp);
businessRouter.post('/resend-otp', resendBusinessOtp);
businessRouter.post('/login', loginBusinessOwner);
businessRouter.get('/verify-auth', verifyBusinessAuth);
businessRouter.post('/logout', logoutBusinessOwner);

// Forgot Password
businessRouter.post('/forgot-password/send-otp', sendBusinessForgotOtp);
businessRouter.post('/forgot-password/verify-otp', verifyBusinessForgotOtp);
businessRouter.post('/forgot-password/reset', resetBusinessPassword);

// ==================== PROFILE ROUTES (Protected) ====================
businessRouter.get('/profile', business_auth, getBusinessProfile);
businessRouter.put('/profile', business_auth, updateBusinessOwnerProfile);
businessRouter.post('/profile/upload-picture', business_auth, upload.single('profilePicture'), uploadOwnerProfilePicture);
businessRouter.get('/imagekit-auth', getBusinessImageKitAuth);

// ==================== BUSINESS CRUD (Protected) ====================
businessRouter.post('/create', business_auth, createBusiness);
businessRouter.get('/my-businesses', business_auth, getMyBusinesses);
businessRouter.put('/:businessId', business_auth, updateBusiness);
businessRouter.delete('/:businessId', business_auth, deleteBusiness);

// Upload Images
businessRouter.post('/upload-images', business_auth, upload.array('images', 10), uploadBusinessImages);
businessRouter.post('/:businessId/upload-images', business_auth, upload.array('images', 10), uploadBusinessImages);
businessRouter.post('/:businessId/upload-logo', business_auth, upload.single('logo'), uploadBusinessLogo);

// ==================== REVIEW ROUTES ====================
businessRouter.post('/:businessId/reviews', business_auth, addReview);
businessRouter.put('/:businessId/reviews/:reviewId', business_auth, updateReview);
businessRouter.delete('/:businessId/reviews/:reviewId', business_auth, deleteReview);
businessRouter.get('/:businessId/reviews', getBusinessReviews);
businessRouter.post('/reviews/upload-images', business_auth, upload.array('images', 5), uploadReviewImages);

// ==================== PUBLIC ROUTES ====================
businessRouter.get('/types', getBusinessTypes);
businessRouter.get('/filter-options', getFilterOptions);
businessRouter.get('/all', getAllBusinesses);
businessRouter.get('/search', searchBusinesses);
businessRouter.get('/:businessId', optional_business_auth, getBusinessById);

export default businessRouter;
