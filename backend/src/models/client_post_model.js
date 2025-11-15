import mongoose from "mongoose";

const ClientPostSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  workType: { type: String, required: true },
  numberOfWorkers: { type: Number, default: 1 },
  location: String,
  salaryRange: String,
  description: String,
  contactNumber: String,
  // isApproved: { type: Boolean, default: false }, // admin approval
  validityDays: { type: Number, default: 15 },
  expiryDate: Date,
  paidVisibility: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false }, // Admin can mark as featured
  workerApplications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worker" }]
}, { timestamps: true });


// set expiryDate before save
ClientPostSchema.pre("save", function(next) {
  if (!this.expiryDate && this.validityDays) {
    this.expiryDate = new Date(Date.now() + this.validityDays * 24 * 60 * 60 * 1000);
  }
  next();
});

// optional: update expiryDate on update
ClientPostSchema.pre("findOneAndUpdate", function(next) {
  const update = this.getUpdate();
  if (update.validityDays) {
    update.expiryDate = new Date(Date.now() + update.validityDays * 24 * 60 * 60 * 1000);
  }
  next();
});


export const ClientPost = mongoose.model("ClientPost", ClientPostSchema);


