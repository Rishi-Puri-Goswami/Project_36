import mongoose from "mongoose";

// Business Owner Schema - for user registration
const BusinessOwnerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  village: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  blockReason: String,
  otpVerified: { type: Boolean, default: false },
  otp: { 
    code: String, 
    expiresAt: Date, 
    attempts: { type: Number, default: 0 }, 
    lastSentAt: Date 
  },
  businesses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Business" }]
}, { timestamps: true });

// Business/Store Listing Schema
const BusinessSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessOwner", required: true },
  businessName: { type: String, required: true },
  businessType: { 
    type: String, 
    required: true,
    enum: [
      'Retail Store',
      'Restaurant',
      'Grocery Store',
      'Electronics Shop',
      'Clothing Store',
      'Hardware Store',
      'Medical Store/Pharmacy',
      'Beauty Salon/Parlour',
      'Mobile Shop',
      'Furniture Store',
      'Bakery',
      'Stationery Shop',
      'Jewellery Store',
      'Auto Parts Shop',
      'Sports Shop',
      'Book Store',
      'Pet Shop',
      'Flower Shop',
      'General Store',
      'Service Center',
      'Other'
    ]
  },
  description: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: String,
  whatsappNumber: String,
  
  // Address Details
  shopAddress: { type: String, required: true },
  village: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: String,
  
  // Geolocation
  coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  
  // Business Details
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '21:00' },
  workingDays: { 
    type: [String], 
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] 
  },
  
  // Media
  businessImages: { type: [String], default: [] },
  logo: String,
  
  // Reviews & Ratings
  reviews: [{
    reviewer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "BusinessOwner",
      required: true 
    },
    reviewerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  
  // Analytics
  viewCount: { type: Number, default: 0 },
  
  // Tags for search
  tags: [String]
}, { timestamps: true });

// Add text index for search
BusinessSchema.index({ 
  businessName: 'text', 
  businessType: 'text', 
  description: 'text', 
  village: 'text', 
  district: 'text',
  tags: 'text'
});

export const BusinessOwner = mongoose.model("BusinessOwner", BusinessOwnerSchema);
export const Business = mongoose.model("Business", BusinessSchema);
