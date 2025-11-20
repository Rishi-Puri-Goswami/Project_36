import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, 
  password: String,
  phone: { type: String, unique: true, required: true },
  age: Number,
  workType: { type: String, required: true },
  yearsOfExperience: { type: Number, default: 0 },
  location: String,
  // 📍 Geolocation for nearby search (30km radius)
  coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  },
  pincode: String,
  workPhotos: { type: [String], default: [] },
  idProof: String,
  skills: [String],
  bio: String,
  profilePicture: String,
  coverPhoto: String,
  otpVerified: { type: Boolean, default: false },
  otp: { 
    code: String, 
    expiresAt: Date, 
    attempts: { type: Number, default: 0 }, 
    lastSentAt: Date 
  },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" }, // Auto-approve workers
  accountStatus: { type: String, enum: ['active', 'blocked'], default: 'active' },
  blockReason: String,
  isFeatured: { type: Boolean, default: false },
  featuredUntil: Date,
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  adminNote: String,
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClientPost" }]
}, { timestamps: true });

export const Worker = mongoose.model("Worker", workerSchema);
