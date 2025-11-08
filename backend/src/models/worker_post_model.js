import mongoose from "mongoose";

const workerPostSchema = new mongoose.Schema({
  worker: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Worker", 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  skills: String,
  availability: String,
  expectedSalary: String,
  status: { 
    type: String, 
    enum: ["active", "inactive"], 
    default: "active" 
  }
}, { timestamps: true });

export const WorkerPost = mongoose.model("WorkerPost", workerPostSchema);
