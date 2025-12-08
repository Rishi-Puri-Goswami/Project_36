import mongoose from "mongoose";


const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId,  refPath: 'userType' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  userType: { type: String, enum: ["Client", "Worker"], required: true },
  planName: { type: String, default: "Free Trial" },
  price : { 
    amount : { type : Number , required : true , default : 0 },
    currency : { type : String , default : "INR" }
  },
  viewsAllowed: { type: Number, default: 10 }, // Total credits available
  viewsUsed: { type: Number, default: 0 }, // Credits consumed
  viewedWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worker" }], // Track viewed worker IDs
  
  // 🔓 Track unlocked worker profiles with 24-hour access
  unlockedWorkers: [{
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    unlockedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date } // 24 hours from unlockedAt
  }],

  // 📸 Track viewed worker posts (to avoid charging twice for same post)
  viewedWorkerPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "WorkerPost" }],
  
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date }, // Only for time-based plans
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
}, { timestamps: true });

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);


