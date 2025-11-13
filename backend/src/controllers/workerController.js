import { Worker } from "../models/worker_model.js";
import { Client } from "../models/client_models.js";
import { ClientPost } from "../models/client_post_model.js";
import { WorkerPost } from "../models/worker_post_model.js";
import jwt from "jsonwebtoken";
import { sendOtpSms } from "../utils/smsService.js";
import { Subscription } from "../models/subscription_model.js";
import { Plan } from "../models/planes_model.js";
import imagekit from "../config/imagekit.js";

// ============= AUTHENTICATION APIs =============

export const registerWorker = async (req, res) => {
  try {
    const { name, email, password, phone, workType, location, yearsOfExperience, age } = req.body;

    // Validation
    if (!name || !phone || !password || !workType) {
      return res.status(400).json({ message: "Name, phone, password and work type are required", status: 400 });
    }

    // Check if worker already exists with this phone number
    const existingWorkerByPhone = await Worker.findOne({ phone });
    if (existingWorkerByPhone) {
      return res.status(400).json({ message: "Worker already exists with this phone number", status: 400 });
    }

    // Check if worker already exists with this email (if email provided)
    if (email) {
      const existingWorkerByEmail = await Worker.findOne({ email });
      if (existingWorkerByEmail) {
        return res.status(400).json({ message: "Worker already exists with this email", status: 400 });
      }
    }

    // Generate 6 digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("Generated Worker OTP is:", otp);

    if (!otp) {
      return res.status(500).json({ message: "Error in generating OTP", status: 500 });
    }

    // Send OTP via SMS using 2factor.in
    const smsResult = await sendOtpSms(phone, otp);

    if (!smsResult.success) {
      return res.status(500).json({
        message: "Failed to send OTP to phone number",
        status: 500,
        error: smsResult.message
      });
    }

    const newWorker = new Worker({
      name,
      email: email || undefined,
      password,
      phone,
      workType,
      location: location || undefined,
      yearsOfExperience: yearsOfExperience || 0,
      age: age || undefined,
      otp: {
        code: otp.toString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
        attempts: 0,
        lastSentAt: new Date()
      },
      otpVerified: false,
      status: "approved" // Auto-approve workers
    });

    await newWorker.save();

    return res.status(201).json({
      message: "OTP sent to your phone number for verification",
      status: 201,
      phone: phone
    });

  } catch (error) {
    console.log("Error on register worker:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const verifyWorkerOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone number and OTP required", status: 400 });
    }

    const worker = await Worker.findOne({ phone });

    if (!worker) {
      return res.status(400).json({ message: "Invalid phone number or OTP", status: 400 });
    }

    if (worker.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired", status: 400 });
    }

    if (worker.otp.attempts >= 5) {
      return res.status(400).json({ message: "Max OTP attempts exceeded", status: 400 });
    }

    if (worker.otp.code != otp) {
      worker.otp.attempts += 1;
      await worker.save();
      return res.status(400).json({ message: "Invalid OTP", status: 400 });
    }

    // Find free plan (Free Trial with 0 price)
    const freePlan = await Plan.findOne({ 
      $or: [
        { planName: "Free" },
        { planName: "Free Trial" },
        { "price.amount": 0 }
      ]
    });

    if (!freePlan) {
      return res.status(500).json({ message: "Free plan not found, contact support", status: 500 });
    }

    // Create subscription for worker
    const createSubscription = new Subscription({
      userId: worker._id,
      planId: freePlan._id,
      userType: "Worker",
      viewsAllowed: freePlan.viewsAllowed,
      viewsUsed: 0,
      startDate: new Date(),
      status: "active"
    });

    await createSubscription.save();

    worker.subscription = createSubscription._id;
    worker.otpVerified = true;
    worker.otp = undefined;

    await worker.save();

    const token = jwt.sign({ id: worker._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('workertoken', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction
    });

    return res.status(200).json({
      message: "OTP verified successfully",
      status: 200,
      token
    });

  } catch (error) {
    console.log("Error on verify worker OTP:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const resendWorkerOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required", status: 400 });
    }

    const worker = await Worker.findOne({ phone });
    if (!worker) {
      return res.status(404).json({ message: "Worker not found", status: 404 });
    }

    // Prevent frequent resends (cooldown 1 min)
    if (worker.otp && worker.otp.lastSentAt && (new Date() - worker.otp.lastSentAt < 60 * 1000)) {
      return res.status(429).json({
        message: "OTP already sent. Please wait 1 minute before requesting again.",
        status: 429
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("Resent Worker OTP is:", otp);

    // Send OTP via SMS using 2factor.in
    const smsResult = await sendOtpSms(phone, otp);

    if (!smsResult.success) {
      return res.status(500).json({
        message: "Failed to send OTP to phone number",
        status: 500,
        error: smsResult.message
      });
    }

    // Update OTP in worker document
    worker.otp = {
      code: otp.toString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
      lastSentAt: new Date()
    };
    await worker.save();

    return res.status(200).json({
      message: "OTP resent successfully to your phone number",
      status: 200
    });
  } catch (error) {
    console.error("Error in resendWorkerOtp:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const loginWorker = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone number and password are required", status: 400 });
    }

    // Find worker by phone
    const worker = await Worker.findOne({ phone });
    if (!worker) {
      return res.status(401).json({ message: "Invalid phone number or password", status: 401 });
    }

    // Check if OTP is verified
    if (!worker.otpVerified) {
      return res.status(403).json({ message: "Please verify your phone number first", status: 403 });
    }

    // Check password (Note: You should use bcrypt to hash passwords in production)
    if (worker.password !== password) {
      return res.status(401).json({ message: "Invalid phone number or password", status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign({ id: worker._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set cookie with appropriate settings for development
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('workertoken', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction
    });

    return res.status(200).json({
      message: "Login successful",
      status: 200,
      token,
      worker: {
        id: worker._id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        workType: worker.workType,
        location: worker.location
      }
    });

  } catch (error) {
    console.error("Error in loginWorker:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const getWorkerProfile = async (req, res) => {
  try {
    const worker = await Worker.findById(req.worker._id)
      .populate('subscription')
      .select('-password -otp');

    if (!worker) {
      return res.status(404).json({ message: "Worker not found", status: 404 });
    }

    return res.status(200).json({
      status: 200,
      worker
    });

  } catch (error) {
    console.error("Error in getWorkerProfile:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const updateWorkerProfile = async (req, res) => {
  try {
    const workerId = req.worker._id;
    const { name, email, age, workType, location, yearsOfExperience } = req.body;

    // Find worker
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found", status: 404 });
    }

    // Update fields if provided
    if (name) worker.name = name;
    if (email !== undefined) worker.email = email;
    if (age !== undefined) worker.age = age;
    if (workType) worker.workType = workType;
    if (location !== undefined) worker.location = location;
    if (yearsOfExperience !== undefined) worker.yearsOfExperience = yearsOfExperience;

    await worker.save();

    // Return updated worker without sensitive info
    const updatedWorker = await Worker.findById(workerId).select('-password -otp');

    return res.status(200).json({
      message: "Profile updated successfully",
      status: 200,
      worker: updatedWorker
    });

  } catch (error) {
    console.error("Error in updateWorkerProfile:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// ============= EXISTING APIs =============

export const submitWorkerProfile = async (req, res) => {
  try {
    const { name, contactNumber, email, age, workType, yearsOfExperience, location } = req.body;
    // files: workPhotos (array), idProof (single)
    const workPhotos = (req.files && req.files.workPhotos) ? req.files.workPhotos.map(f => f.path) : [];
    const idProof = (req.files && req.files.idProof && req.files.idProof[0]) ? req.files.idProof[0].path : undefined;

    // basic validation
    if (!name || !contactNumber || !workType) return res.status(400).json({ error: "name, contactNumber and workType are required" });

    // If user is authenticated, attach userId. For now check req.body.userId
    const userId = req.body.userId;

    const worker = new Worker({
      userId,
      name,
      contactNumber,
      email,
      age,
      workType,
      yearsOfExperience,
      location,
      workPhotos,
      idProof,
      status: "pending"
    });

    await worker.save();
    return res.status(201).json({ message: "Profile submitted", workerId: worker._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).select('-password -otp');
    if (!worker) return res.status(404).json({ error: 'Not found' });
    return res.json(worker);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const listApprovedWorkers = async (req, res) => {
  try {
    const workers = await Worker.find({ status: 'approved' })
      .select('-password -otp')
      .limit(50);
    return res.json(workers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const WorkerApplyToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const workerId = req.worker._id; // From auth middleware

    const post = await ClientPost.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check if worker has already applied
    if (post.workerApplications.includes(workerId)) {
      return res.status(400).json({ error: 'You have already applied to this post' });
    }

    post.workerApplications.push(workerId);
    await post.save();

    // Add to worker's applied jobs
    const worker = await Worker.findById(workerId);
    if (!worker.appliedJobs.includes(postId)) {
      worker.appliedJobs.push(postId);
      await worker.save();
    }

    return res.status(200).json({ message: 'Application submitted successfully' });

  } catch (error) {
    console.log("error worker applying to post", error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ============= WORKER POST APIs =============

export const createWorkerPost = async (req, res) => {
  try {
    const workerId = req.worker._id; // From auth middleware
    const { title, description, skills, availability, expectedSalary } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required", status: 400 });
    }

    // Handle multiple image uploads
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResponse = await imagekit.upload({
            file: file.buffer.toString('base64'),
            fileName: `worker_post_${workerId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.mimetype.split('/')[1]}`,
            folder: '/worker_posts',
            useUniqueFileName: true
          });
          imageUrls.push(uploadResponse.url);
        } catch (uploadError) {
          console.error("Error uploading image to ImageKit:", uploadError);
        }
      }
    }

    // Create new post
    const newPost = new WorkerPost({
      worker: workerId,
      title,
      description,
      images: imageUrls,
      skills,
      availability,
      expectedSalary
    });

    await newPost.save();

    return res.status(201).json({ 
      message: "Post created successfully", 
      post: newPost,
      status: 201 
    });

  } catch (error) {
    console.log("Error creating worker post:", error);
    return res.status(500).json({ message: "Server error", status: 500 });
  }
};

export const getWorkerPosts = async (req, res) => {
  try {
    const workerId = req.worker._id; // From auth middleware

    const posts = await WorkerPost.find({ worker: workerId })
      .sort({ createdAt: -1 }); // Most recent first

    return res.status(200).json({ 
      posts,
      status: 200 
    });

  } catch (error) {
    console.log("Error fetching worker posts:", error);
    return res.status(500).json({ message: "Server error", status: 500 });
  }
};

export const deleteWorkerPost = async (req, res) => {
  try {
    const workerId = req.worker._id; // From auth middleware
    const { postId } = req.params;

    // Find the post
    const post = await WorkerPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found", status: 404 });
    }

    // Check if the post belongs to the worker
    if (post.worker.toString() !== workerId.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this post", status: 403 });
    }

    await WorkerPost.findByIdAndDelete(postId);

    return res.status(200).json({ 
      message: "Post deleted successfully",
      status: 200 
    });

  } catch (error) {
    console.log("Error deleting worker post:", error);
    return res.status(500).json({ message: "Server error", status: 500 });
  }
};

export const getAllWorkerPosts = async (req, res) => {
  try {
    // Get all active worker posts with worker details
    const posts = await WorkerPost.find({ status: 'active' })
      .populate('worker', 'name phone email location workType yearsOfExperience profilePicture')
      .sort({ createdAt: -1 });

    return res.status(200).json({ 
      posts,
      status: 200 
    });

  } catch (error) {
    console.log("Error fetching all worker posts:", error);
    return res.status(500).json({ message: "Server error", status: 500 });
  }
};

// 📍 Update Worker Location (Latitude/Longitude)
export const updateWorkerLocation = async (req, res) => {
  try {
    const workerId = req.worker._id;
    const { latitude, longitude } = req.body;

    // Validation
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: "Latitude and longitude are required" 
      });
    }

    // Validate coordinates range
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ 
        error: "Latitude must be between -90 and 90" 
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: "Longitude must be between -180 and 180" 
      });
    }

    // Update worker location
    const worker = await Worker.findByIdAndUpdate(
      workerId,
      {
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    console.log(`📍 Worker ${worker.name} location updated: ${latitude}, ${longitude}`);

    return res.status(200).json({
      message: "Location updated successfully",
      coordinates: worker.coordinates
    });

  } catch (error) {
    console.error("Error updating worker location:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// 📸 Upload Worker Profile Picture using ImageKit
export const uploadWorkerProfilePicture = async (req, res) => {
  try {
    const workerId = req.worker._id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: `worker_${workerId}_${Date.now()}.${req.file.mimetype.split('/')[1]}`,
      folder: '/profile_pictures/workers',
      useUniqueFileName: true
    });

    // Update worker profile picture URL in database
    const worker = await Worker.findByIdAndUpdate(
      workerId,
      { profilePicture: uploadResponse.url },
      { new: true }
    ).select('-password -otp');

    console.log(`📸 Worker ${worker.name} profile picture updated`);

    return res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: uploadResponse.url,
      worker: worker
    });

  } catch (error) {
    console.error("Error uploading worker profile picture:", error);
    return res.status(500).json({ error: "Failed to upload profile picture" });
  }
};






