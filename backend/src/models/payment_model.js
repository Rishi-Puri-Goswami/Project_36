import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({

  planId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Plan' },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'anytype' }, // can be Client or Worker
  paymentId: { type: String, default: "" },
  razorpayOrderId: { type: String},
  signature: { type: String },
  status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
  price : { 

    amount : { type : Number , required : true },
    currency : { type : String , default : "INR" }

  }

  

}, { timestamps: true });

export const Payment = mongoose.model("Payment", PaymentSchema);


