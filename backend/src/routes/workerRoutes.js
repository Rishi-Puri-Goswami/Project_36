import express from "express";
import { 
  registerWorker,
  verifyWorkerOtp,
  resendWorkerOtp,
  loginWorker,
  getWorkerProfile,
  submitWorkerProfile, 
  getWorkerById, 
  listApprovedWorkers,
  WorkerApplyToPost
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

// ============= WORKER PROFILE ROUTES =============
workerrouter.post('/submit', upload.single('workerimage'), submitWorkerProfile);
workerrouter.get('/:id', getWorkerById);
workerrouter.get('/', listApprovedWorkers);

// ============= JOB APPLICATION ROUTES =============
workerrouter.post('/apply/:postId', worker_auth, WorkerApplyToPost);

export default workerrouter;



// upload.fields([{ name: 'workPhotos', maxCount: 5 }, { name: 'idProof', maxCount: 1 }])






















// expect multipart/form-data with fields: workPhotos (array), idProof (single)
// workerrouter.post('/submit', upload.fields([{ name: 'workPhotos', maxCount: 5 }, { name: 'idProof', maxCount: 1 }]), submitWorkerProfile);
// workerrouter.get('/:id', getWorkerById);
// workerrouter.get('/', listApprovedWorkers);
