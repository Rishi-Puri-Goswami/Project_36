import express from "express";
import { 
  createClientPost, 
  listClientPostsForAdmin, 
  payForPostVisibility, 
  renewPost,
  registerClint,
  verifyClintOtp,
  resendClientOtp,
  sendClientForgotOtp,
  verifyClientForgotOtp,
  resetClientPasswordWithOtp,
  loginClint,
  verifyAuth,
  getProfile,
  logoutClint,
  payment,
  paymentVerification,
  workerApplication,
  createJobPost,
  getMyJobPosts,
  getJobPostById,
  updateJobPost,
  deleteJobPost,
  getAllAvailableJobs,
  getAllAvailableWorkers,
  searchWorkersWithPosts,
  unlockWorkerPost,
  getSubscriptionStatus,
  getAllPlans,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  checkSubscriptionAccess,
  viewWorkerProfile,
  updateClientLocation,
  unlockWorkerProfile,
  getUnlockedWorkers,
  uploadClientProfilePicture,
  uploadClientCoverPhoto,
  getImageKitAuthParams
} from "../controllers/clientController.js";
import { clint_auth } from "../middlewares/clint_middlewares/clint_auth.js";
import { upload } from "../middlewares/uploads/upload.js";

const clientRouter = express.Router();

// Authentication routes (no auth required)
clientRouter.post('/register', registerClint);
clientRouter.post('/verify-otp', verifyClintOtp);
clientRouter.post('/resend-otp', resendClientOtp);
clientRouter.post('/forgot-password/send-otp', sendClientForgotOtp);
clientRouter.post('/forgot-password/verify-otp', verifyClientForgotOtp);
clientRouter.post('/forgot-password/reset', resetClientPasswordWithOtp);
clientRouter.post('/login', loginClint);
clientRouter.get('/verify-auth', verifyAuth);
clientRouter.get('/profile', getProfile);
clientRouter.post('/logout', logoutClint);

// Location routes (auth required)
clientRouter.post('/update-location', clint_auth, updateClientLocation);

// 📸 Profile Picture Upload (auth required)
clientRouter.post('/upload-profile-picture', clint_auth, upload.single('profilePicture'), uploadClientProfilePicture);
// 🖼️ Cover Photo Upload (auth required)
clientRouter.post('/upload-cover-photo', clint_auth, upload.single('coverPhoto'), uploadClientCoverPhoto);
clientRouter.get('/imagekit-auth', getImageKitAuthParams);

// Worker Search routes (public)
clientRouter.get('/workers/available', getAllAvailableWorkers); // Public route for clients to search workers

// 🔍 Search Workers with Posts (auth required to see unlock status)
clientRouter.get('/workers/with-posts', clint_auth, searchWorkersWithPosts); // Returns workers + their posts

// 🔓 Unlock Worker Post - Deduct 1 credit to view full post
clientRouter.post('/worker-posts/unlock/:postId', clint_auth, unlockWorkerPost);

// Job Post routes (public)
clientRouter.get('/jobs/available', getAllAvailableJobs); // Public route for workers to see jobs

// Job Post routes (auth required)
clientRouter.post('/jobs/create', clint_auth, createJobPost);
clientRouter.get('/jobs/my-jobs', clint_auth, getMyJobPosts);
clientRouter.get('/jobs/:jobId', clint_auth, getJobPostById);
clientRouter.put('/jobs/:jobId', clint_auth, updateJobPost);
clientRouter.delete('/jobs/:jobId', clint_auth, deleteJobPost);

// Old Post routes (keeping for backward compatibility)
clientRouter.post('/create', createClientPost);
clientRouter.post('/pay', payForPostVisibility);
clientRouter.post('/pay/renewPost', renewPost);

// Payment routes
clientRouter.post('/payment/:planId', payment);
clientRouter.post('/payment-verification', paymentVerification);

// Subscription routes (auth required)
clientRouter.get('/subscription/status', clint_auth, getSubscriptionStatus);
clientRouter.get('/subscription/check-access', clint_auth, checkSubscriptionAccess);
clientRouter.get('/plans', getAllPlans); // Public route to view plans
clientRouter.post('/subscription/create-order', clint_auth, createSubscriptionOrder);
clientRouter.post('/subscription/verify-payment', clint_auth, verifySubscriptionPayment);

// Worker Profile View (auth required - consumes credits)
clientRouter.get('/worker/view/:workerId', clint_auth, viewWorkerProfile);

// 🔓 Worker Profile Unlock - Credit-based access with 24-hour validity
clientRouter.post('/worker/unlock/:workerId', clint_auth, unlockWorkerProfile);
clientRouter.get('/worker/unlocked', clint_auth, getUnlockedWorkers);

// Application routes (auth required)
clientRouter.get('/applications/:postId', clint_auth, workerApplication);

export default clientRouter;











// clientRouter.post('/create', createClientPost);
// clientRouter.post('/pay', createClientPost);
// clientRouter.post('/pay/post', (req, res) => res.status(501).json({ error: 'use /payForPost or /renew endpoints' }));
// clientRouter.post('/payForPost', async (req, res) => {
// 	const controller = await import('../controllers/clientController.js');
// 	return controller.payForPostVisibility(req, res);
// });
// clientRouter.post('/renew', async (req, res) => {
// 	const controller = await import('../controllers/clientController.js');
// 	return controller.renewPost(req, res);
// });
// clientRouter.get('/admin/list', listClientPostsForAdmin);

