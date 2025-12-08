import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: String,
  email: { type: String, unique: true, required: true },
  password: String,
  role: { type: String, default: "Client", required: true },
  phone:{ type: String, unique: true, required: true },
  address: String,
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  blockReason: String,
  // 📍 Geolocation for nearby search (30km radius)
  coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  },
  otpVerified: { type: Boolean, default: false },
  otp: { code: String  , expiresAt : Date , attempts : { type : Number , default : 0 }, lastSentAt: Date },
  profilePicture: String,
  coverPhoto: String,
  numberOfPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClientPost" }],
  Subscription: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Subscription"
  },
  isApproved: { type: Boolean, default: false }

}, { timestamps: true });

export const Client = mongoose.model("Client", ClientSchema);

