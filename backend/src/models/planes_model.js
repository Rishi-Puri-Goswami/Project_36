import mongoose from "mongoose";

const PlanSchema = new mongoose.Schema({
  planName: {
    type: String,
    enum: ["Free", "Starter", "Pro"],
    required: true,
    unique: true
  },

  viewsAllowed: {
    type: Number,
    required: true
  },

  price: {
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" }
  }

}, { timestamps: true });

export const Plan = mongoose.model("Plan", PlanSchema);

