import express from "express";
import { 
  registerWorker,
  verifyWorkerOtp,
  resendWorkerOtp,
  loginWorker,
  getWorkerProfile,
  updateWorkerProfile,
  submitWorkerProfile, 
  getWorkerById, 
  listApprovedWorkers,
  WorkerApplyToPost,
  createWorkerPost,
  getWorkerPosts,
  deleteWorkerPost,
  getAllWorkerPosts,
  updateWorkerLocation,
  uploadWorkerProfilePicture
} from "../controllers/workerController.js";
import { upload } from "../middlewares/uploads/upload.js";
import { worker_auth } from "../middlewares/worker_middlewares/worker_auth.js";

const workerrouter = express.Router();

// ============= AUTHENTICATION ROUTES =============
workerrouter.post('/register', registerWorker);
workerrouter.post('/verify-otp', verifyWorkerOtp);
workerrouter.post('/resend-otp', resendWorkerOtp);
workerrouter.post('/login', loginWorker);
workerrouter.get('/profile', worker_auth, getWorkerProfile);
workerrouter.put('/update-profile', worker_auth, updateWorkerProfile);

// ============= LOCATION ROUTES =============
workerrouter.post('/update-location', worker_auth, updateWorkerLocation);

// ============= PROFILE PICTURE UPLOAD =============
workerrouter.post('/upload-profile-picture', worker_auth, upload.single('profilePicture'), uploadWorkerProfilePicture);

// ============= WORKER POST ROUTES (Must come before /:id route) =============
workerrouter.post('/create-post', worker_auth, upload.array('postImages', 5), createWorkerPost); // Allow up to 5 images
workerrouter.get('/my-posts', worker_auth, getWorkerPosts);
workerrouter.delete('/delete-post/:postId', worker_auth, deleteWorkerPost);
workerrouter.get('/all-posts', getAllWorkerPosts); // Public route to view all worker posts

// ============= JOB APPLICATION ROUTES =============
workerrouter.post('/apply/:postId', worker_auth, WorkerApplyToPost);

// ============= WORKER PROFILE ROUTES (/:id must come last to avoid conflicts) =============
workerrouter.post('/submit', upload.single('workerimage'), submitWorkerProfile);
workerrouter.get('/', listApprovedWorkers);
workerrouter.get('/:id', getWorkerById);

export default workerrouter;



// upload.fields([{ name: 'workPhotos', maxCount: 5 }, { name: 'idProof', maxCount: 1 }])






















// expect multipart/form-data with fields: workPhotos (array), idProof (single)
// workerrouter.post('/submit', upload.fields([{ name: 'workPhotos', maxCount: 5 }, { name: 'idProof', maxCount: 1 }]), submitWorkerProfile);
// workerrouter.get('/:id', getWorkerById);
// workerrouter.get('/', listApprovedWorkers);
