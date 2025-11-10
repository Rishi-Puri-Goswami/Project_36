import mongoose from "mongoose";

const PlanSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
    unique: true
  },

  duration: {
    type: Number, // in days (0 for credit-based plans)
    default: 0
  },

  viewsAllowed: {
    type: Number, // Number of worker profiles client can view in detail
    required: true
  },

  price: {
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" }
  },

  description: {
    type: String,
    default: ""
  },

  planType: {
    type: String,
    enum: ["free_trial", "credit_pack"],
    default: "credit_pack"
  }

}, { timestamps: true });

export const Plan = mongoose.model("Plan", PlanSchema);

