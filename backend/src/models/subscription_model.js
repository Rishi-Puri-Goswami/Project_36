import mongoose from "mongoose";


const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId,  refPath: 'userType' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  userType: { type: String, enum: ["Client", "Worker"], required: true },
  planName: { type: String, enum: ["Free", "Starter", "Pro", "Enterprise"], default: "Free" },
  price : { 

    amount : { type : Number , required : true , default : 0 },
    currency : { type : String , default : "INR" }

  },
  viewsAllowed: { type: Number, default: 10 }, 
  viewsUsed: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  // expiryDate: Date,
  // paymentRef: String,
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
}, { timestamps: true });

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);


