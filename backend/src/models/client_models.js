import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: String,
  email: { type: String, unique: true, required: true },
  password: String,
  role: { type: String, default: "Client", required: true },
  phone:{ type: String, unique: true, required: true },
  address: String,
  otpVerified: { type: Boolean, default: false },
  otp: { code: String  , expiresAt : Date , attempts : { type : Number , default : 0 }, lastSentAt: Date },
  profilePicture: String,
  numberOfPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClientPost" }],
  Subscription: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Subscription"
  },
  isApproved: { type: Boolean, default: false }

}, { timestamps: true });

export const Client = mongoose.model("Client", ClientSchema);

