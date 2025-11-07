import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls
  password: String,
  phone: { type: String, unique: true, required: true },
  age: Number,
  workType: { type: String, required: true },
  yearsOfExperience: { type: Number, default: 0 },
  location: String,
  workPhotos: { type: [String], default: [] },
  idProof: String,
  skills: [String],
  bio: String,
  profilePicture: String,
  otpVerified: { type: Boolean, default: false },
  otp: { 
    code: String, 
    expiresAt: Date, 
    attempts: { type: Number, default: 0 }, 
    lastSentAt: Date 
  },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" }, // Auto-approve workers
  adminNote: String,
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClientPost" }]
}, { timestamps: true });

export const Worker = mongoose.model("Worker", workerSchema);

