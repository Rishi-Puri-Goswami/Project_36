import { BusinessOwner, Business } from "../models/business_model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendOtpSms } from "../utils/smsService.js";
import imagekit from "../config/imagekit.js";

// ==================== AUTHENTICATION ====================


// Register Business Owner
export const registerBusinessOwner = async (req, res) => {
  try {
    const { fullName, email, phone, password, village, district, state, pincode } = req.body;

    // Validation
    if (!fullName || !email || !phone || !password || !village || !district || !state || !pincode) {
      return res.status(400).json({ message: "All fields are required", status: 400 });
    }

    // Check if already exists
    const existingByPhone = await BusinessOwner.findOne({ phone });
    if (existingByPhone) {
      return res.status(400).json({ message: "Phone number already registered", status: 400 });
    }

    const existingByEmail = await BusinessOwner.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: "Email already registered", status: 400 });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("Generated OTP for Business Owner:", otp);

    // Send OTP via SMS
    const smsResult = await sendOtpSms(phone, otp);
    if (!smsResult.success) {
      return res.status(500).json({
        message: "Failed to send OTP",
        status: 500,
        error: smsResult.message
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new business owner
    const newOwner = new BusinessOwner({
      fullName,
      email,
      phone,
      password: hashedPassword,
      village,
      district,
      state,
      pincode,
      otp: {
        code: otp.toString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        lastSentAt: new Date()
      },
      otpVerified: false
    });

    await newOwner.save();

    return res.status(201).json({
      message: "OTP sent to your phone number for verification",
      status: 201,
      phone: phone
    });

  } catch (error) {
    console.error("Error registering business owner:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Verify OTP
export const verifyBusinessOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP required", status: 400 });
    }

    const owner = await BusinessOwner.findOne({ phone });
    if (!owner) {
      return res.status(400).json({ message: "Invalid phone number", status: 400 });
    }

    if (owner.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired", status: 400 });
    }

    if (owner.otp.attempts >= 5) {
      return res.status(400).json({ message: "Max OTP attempts exceeded", status: 400 });
    }

    if (owner.otp.code !== otp) {
      owner.otp.attempts += 1;
      await owner.save();
      return res.status(400).json({ message: "Invalid OTP", status: 400 });
    }

    owner.otpVerified = true;
    owner.otp = undefined;
    await owner.save();

    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('businesstoken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      message: "Registration successful",
      status: 200,
      token,
      user: {
        id: owner._id,
        fullName: owner.fullName,
        email: owner.email,
        phone: owner.phone,
        village: owner.village,
        district: owner.district,
        state: owner.state,
        pincode: owner.pincode
      }
    });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Resend OTP
export const resendBusinessOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number required", status: 400 });
    }

    const owner = await BusinessOwner.findOne({ phone });
    if (!owner) {
      return res.status(400).json({ message: "Phone number not registered", status: 400 });
    }

    // Check cooldown (60 seconds)
    if (owner.otp?.lastSentAt) {
      const timeDiff = Date.now() - new Date(owner.otp.lastSentAt).getTime();
      if (timeDiff < 60000) {
        return res.status(400).json({
          message: `Please wait ${Math.ceil((60000 - timeDiff) / 1000)} seconds before resending`,
          status: 400
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("Resent OTP for Business Owner:", otp);

    const smsResult = await sendOtpSms(phone, otp);
    if (!smsResult.success) {
      return res.status(500).json({ message: "Failed to send OTP", status: 500 });
    }

    owner.otp = {
      code: otp.toString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      lastSentAt: new Date()
    };
    await owner.save();

    return res.status(200).json({ message: "OTP resent successfully", status: 200 });

  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Login
export const loginBusinessOwner = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password required", status: 400 });
    }

    const owner = await BusinessOwner.findOne({ phone });
    if (!owner) {
      return res.status(400).json({ message: "Invalid credentials", status: 400 });
    }

    if (!owner.otpVerified) {
      return res.status(400).json({ message: "Please verify your phone number first", status: 400 });
    }

    if (owner.status === 'blocked') {
      return res.status(403).json({
        message: "Your account has been blocked. Please contact support.",
        status: 403,
        blocked: true
      });
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials", status: 400 });
    }

    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('businesstoken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: "Login successful",
      status: 200,
      token,
      user: {
        id: owner._id,
        fullName: owner.fullName,
        email: owner.email,
        phone: owner.phone,
        village: owner.village,
        district: owner.district,
        state: owner.state,
        pincode: owner.pincode,
        profilePicture: owner.profilePicture
      }
    });

  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Verify Auth
export const verifyBusinessAuth = async (req, res) => {
  try {
    let token = req.cookies?.businesstoken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Not authenticated", status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner = await BusinessOwner.findById(decoded.id).select("-password -otp");

    if (!owner) {
      return res.status(401).json({ message: "User not found", status: 401 });
    }

    return res.status(200).json({
      message: "Authenticated",
      status: 200,
      user: owner
    });

  } catch (error) {
    return res.status(401).json({ message: "Invalid token", status: 401 });
  }
};

// Get Profile
export const getBusinessProfile = async (req, res) => {
  try {
    const owner = await BusinessOwner.findById(req.user._id)
      .select("-password -otp")
      .populate('businesses');

    if (!owner) {
      return res.status(404).json({ message: "User not found", status: 404 });
    }

    return res.status(200).json({
      message: "Profile fetched",
      status: 200,
      user: owner
    });

  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Logout
export const logoutBusinessOwner = async (req, res) => {
  try {
    res.clearCookie('businesstoken');
    return res.status(200).json({ message: "Logged out successfully", status: 200 });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Forgot Password - Send OTP
export const sendBusinessForgotOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number required", status: 400 });
    }

    const owner = await BusinessOwner.findOne({ phone });
    if (!owner) {
      return res.status(400).json({ message: "Phone number not registered", status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    
    const smsResult = await sendOtpSms(phone, otp);
    if (!smsResult.success) {
      return res.status(500).json({ message: "Failed to send OTP", status: 500 });
    }

    owner.otp = {
      code: otp.toString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      lastSentAt: new Date()
    };
    await owner.save();

    return res.status(200).json({ message: "OTP sent successfully", status: 200 });

  } catch (error) {
    console.error("Error sending forgot password OTP:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Forgot Password - Verify OTP
export const verifyBusinessForgotOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP required", status: 400 });
    }

    const owner = await BusinessOwner.findOne({ phone });
    if (!owner) {
      return res.status(400).json({ message: "Invalid phone number", status: 400 });
    }

    if (owner.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired", status: 400 });
    }

    if (owner.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP", status: 400 });
    }

    return res.status(200).json({
      message: "OTP verified",
      status: 200,
      verified: true
    });

  } catch (error) {
    console.error("Error verifying forgot OTP:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Reset Password
export const resetBusinessPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields required", status: 400 });
    }

    const owner = await BusinessOwner.findOne({ phone });
    if (!owner) {
      return res.status(400).json({ message: "Invalid phone number", status: 400 });
    }

    if (owner.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP", status: 400 });
    }

    owner.password = await bcrypt.hash(newPassword, 10);
    owner.otp = undefined;
    await owner.save();

    return res.status(200).json({ message: "Password reset successful", status: 200 });

  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// ==================== BUSINESS MANAGEMENT ====================

// Create Business
export const createBusiness = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      description,
      contactPhone,
      contactEmail,
      whatsappNumber,
      shopAddress,
      village,
      district,
      state,
      pincode,
      landmark,
      openingTime,
      closingTime,
      workingDays,
      tags,
      coordinates,
      businessImages
    } = req.body;

    // Validation
    if (!businessName || !businessType || !description || !contactPhone || !shopAddress || !village || !district || !state || !pincode) {
      return res.status(400).json({ message: "Required fields missing", status: 400 });
    }

    const newBusiness = new Business({
      owner: req.user._id,
      businessName,
      businessType,
      description,
      contactPhone,
      contactEmail,
      whatsappNumber,
      shopAddress,
      village,
      district,
      state,
      pincode,
      landmark,
      openingTime: openingTime || '09:00',
      closingTime: closingTime || '21:00',
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      tags: tags || [],
      coordinates: coordinates || { latitude: null, longitude: null },
      businessImages: businessImages || []
    });

    await newBusiness.save();

    // Add to owner's businesses array
    await BusinessOwner.findByIdAndUpdate(req.user._id, {
      $push: { businesses: newBusiness._id }
    });

    return res.status(201).json({
      message: "Business created successfully",
      status: 201,
      business: newBusiness
    });

  } catch (error) {
    console.error("Error creating business:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Get My Businesses
export const getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Businesses fetched",
      status: 200,
      businesses
    });

  } catch (error) {
    console.error("Error fetching businesses:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Get Single Business
export const getBusinessById = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId).populate('owner', 'fullName phone email');

    if (!business) {
      return res.status(404).json({ message: "Business not found", status: 404 });
    }

    // Increment view count if not owner
    if (!req.user || req.user._id.toString() !== business.owner._id.toString()) {
      business.viewCount += 1;
      await business.save();
    }

    return res.status(200).json({
      message: "Business fetched",
      status: 200,
      business
    });

  } catch (error) {
    console.error("Error fetching business:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Update Business
export const updateBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found", status: 404 });
    }

    // Check ownership
    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized", status: 403 });
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { $set: req.body },
      { new: true }
    );

    return res.status(200).json({
      message: "Business updated",
      status: 200,
      business: updatedBusiness
    });

  } catch (error) {
    console.error("Error updating business:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Delete Business
export const deleteBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found", status: 404 });
    }

    // Check ownership
    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized", status: 403 });
    }

    await Business.findByIdAndDelete(businessId);

    // Remove from owner's businesses array
    await BusinessOwner.findByIdAndUpdate(req.user._id, {
      $pull: { businesses: businessId }
    });

    return res.status(200).json({ message: "Business deleted", status: 200 });

  } catch (error) {
    console.error("Error deleting business:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// ==================== PUBLIC ROUTES ====================

// Get All Businesses (with pagination and search)
export const getAllBusinesses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      businessType, 
      district, 
      state,
      village,
      minRating,
      maxRating,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true, status: 'approved' };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (businessType) {
      query.businessType = businessType;
    }
    if (district) {
      query.district = { $regex: district, $options: 'i' };
    }
    if (state) {
      query.state = { $regex: state, $options: 'i' };
    }
    if (village) {
      query.village = { $regex: village, $options: 'i' };
    }
    
    // Rating filter
    if (minRating) {
      query.averageRating = { ...query.averageRating, $gte: parseFloat(minRating) };
    }
    if (maxRating) {
      query.averageRating = { ...query.averageRating, $lte: parseFloat(maxRating) };
    }
    
    // Verification filter
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    const sortOptions = {};
    if (sortBy === 'rating') {
      sortOptions.averageRating = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'reviews') {
      sortOptions.totalReviews = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'views') {
      sortOptions.viewCount = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [businesses, total] = await Promise.all([
      Business.find(query)
        .populate('owner', 'fullName')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Business.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    return res.status(200).json({
      message: "Businesses fetched",
      status: 200,
      businesses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error("Error fetching businesses:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Search Businesses
export const searchBusinesses = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters", status: 400 });
    }

    const searchRegex = new RegExp(query, 'i');

    const searchQuery = {
      isActive: true,
      status: 'approved',
      $or: [
        { businessName: searchRegex },
        { businessType: searchRegex },
        { description: searchRegex },
        { village: searchRegex },
        { district: searchRegex },
        { tags: searchRegex }
      ]
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [businesses, total] = await Promise.all([
      Business.find(searchQuery)
        .populate('owner', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Business.countDocuments(searchQuery)
    ]);

    return res.status(200).json({
      message: "Search results",
      status: 200,
      businesses,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error("Error searching businesses:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Get Business Types (for dropdown)
export const getBusinessTypes = async (req, res) => {
  try {
    const types = [
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
    ];

    return res.status(200).json({
      message: "Business types fetched",
      status: 200,
      types
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Get Filter Options (locations, etc.)
export const getFilterOptions = async (req, res) => {
  try {
    const [states, districts, villages] = await Promise.all([
      Business.distinct('state', { isActive: true, status: 'approved' }),
      Business.distinct('district', { isActive: true, status: 'approved' }),
      Business.distinct('village', { isActive: true, status: 'approved' })
    ]);

    return res.status(200).json({
      message: "Filter options fetched",
      status: 200,
      filters: {
        states: states.filter(s => s).sort(),
        districts: districts.filter(d => d).sort(),
        villages: villages.filter(v => v).sort()
      }
    });

  } catch (error) {
    console.error("Error fetching filter options:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Upload Business Images
export const uploadBusinessImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided", status: 400 });
    }

    // If businessId is provided, add to existing business
    const { businessId } = req.params;
    
    if (businessId) {
      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found", status: 404 });
      }

      if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized", status: 403 });
      }

      // Upload all images to ImageKit
      const uploadPromises = req.files.map(file => 
        imagekit.upload({
          file: file.buffer.toString('base64'),
          fileName: `business_${businessId}_${Date.now()}_${file.originalname}`,
          folder: '/business_images'
        })
      );

      const results = await Promise.all(uploadPromises);
      const imageUrls = results.map(result => result.url);

      // Add to business images
      business.businessImages.push(...imageUrls);
      await business.save();

      return res.status(200).json({
        message: "Images uploaded successfully",
        status: 200,
        images: imageUrls,
        allImages: business.businessImages
      });
    } else {
      // Just upload images and return URLs (for use during business creation)
      const uploadPromises = req.files.map(file => 
        imagekit.upload({
          file: file.buffer.toString('base64'),
          fileName: `business_${req.user._id}_${Date.now()}_${file.originalname}`,
          folder: '/business_images'
        })
      );

      const results = await Promise.all(uploadPromises);
      const imageUrls = results.map(result => result.url);

      return res.status(200).json({
        message: "Images uploaded successfully",
        status: 200,
        images: imageUrls
      });
    }

  } catch (error) {
    console.error("Error uploading images:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Upload Logo
export const uploadBusinessLogo = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found", status: 404 });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized", status: 403 });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image provided", status: 400 });
    }

    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: `logo_${businessId}_${Date.now()}`,
      folder: '/business_logos'
    });

    business.logo = result.url;
    await business.save();

    return res.status(200).json({
      message: "Logo uploaded",
      status: 200,
      logoUrl: result.url
    });

  } catch (error) {
    console.error("Error uploading logo:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Update Owner Profile
export const updateBusinessOwnerProfile = async (req, res) => {
  try {
    const { fullName, email, village, district, state, pincode } = req.body;

    const owner = await BusinessOwner.findByIdAndUpdate(
      req.user._id,
      { $set: { fullName, email, village, district, state, pincode } },
      { new: true }
    ).select("-password -otp");

    return res.status(200).json({
      message: "Profile updated",
      status: 200,
      user: owner
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Upload Profile Picture
export const uploadOwnerProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image provided", status: 400 });
    }

    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: `profile_${req.user._id}_${Date.now()}`,
      folder: '/business_owner_profiles'
    });

    await BusinessOwner.findByIdAndUpdate(req.user._id, {
      profilePicture: result.url
    });

    return res.status(200).json({
      message: "Profile picture uploaded",
      status: 200,
      imageUrl: result.url
    });

  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Get ImageKit Auth Params
export const getBusinessImageKitAuth = async (req, res) => {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    return res.status(200).json({
      status: 200,
      ...authParams
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// ==================== REVIEWS & RATINGS ====================

// Add Review to Business
export const addReview = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { rating, comment, images } = req.body;

    // Validation
    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required", status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5", status: 400 });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found", status: 404 });
    }

    // Check if user already reviewed
    const existingReview = business.reviews.find(
      review => review.reviewer.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ 
        message: "You have already reviewed this business. Please edit your existing review.", 
        status: 400 
      });
    }

    // Add review
    const newReview = {
      reviewer: req.user._id,
      reviewerName: req.user.fullName,
      rating: parseInt(rating),
      comment,
      images: images || [],
      createdAt: new Date()
    };

    business.reviews.push(newReview);

    // Calculate new average rating
    const totalRating = business.reviews.reduce((sum, review) => sum + review.rating, 0);
    business.averageRating = totalRating / business.reviews.length;
    business.totalReviews = business.reviews.length;

    await business.save();

    return res.status(201).json({
      message: "Review added successfully",
      status: 201,
      review: newReview,
      averageRating: business.averageRating,
      totalReviews: business.totalReviews
    });

  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Update Review
export const updateReview = async (req, res) => {
  try {
    const { businessId, reviewId } = req.params;
    const { rating, comment, images } = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found", status: 404 });
    }

    const review = business.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found", status: 404 });
    }

    // Check if user is the review owner
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to edit this review", status: 403 });
    }

    // Update review
    if (rating) review.rating = parseInt(rating);
    if (comment) review.comment = comment;
    if (images !== undefined) review.images = images;

    // Recalculate average rating
    const totalRating = business.reviews.reduce((sum, r) => sum + r.rating, 0);
    business.averageRating = totalRating / business.reviews.length;

    await business.save();

    return res.status(200).json({
      message: "Review updated successfully",
      status: 200,
      review,
      averageRating: business.averageRating
    });

  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Delete Review
export const deleteReview = async (req, res) => {
  try {
    const { businessId, reviewId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found", status: 404 });
    }

    const review = business.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found", status: 404 });
    }

    // Check if user is the review owner
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this review", status: 403 });
    }

    // Remove review
    business.reviews.pull(reviewId);

    // Recalculate average rating
    if (business.reviews.length > 0) {
      const totalRating = business.reviews.reduce((sum, r) => sum + r.rating, 0);
      business.averageRating = totalRating / business.reviews.length;
      business.totalReviews = business.reviews.length;
    } else {
      business.averageRating = 0;
      business.totalReviews = 0;
    }

    await business.save();

    return res.status(200).json({
      message: "Review deleted successfully",
      status: 200,
      averageRating: business.averageRating,
      totalReviews: business.totalReviews
    });

  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// Get All Reviews for a Business
export const getBusinessReviews = async (req, res) => {
  try {
    const { businessId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const business = await Business.findById(businessId)
      .populate('reviews.reviewer', 'fullName profilePicture');

    if (!business) {
      return res.status(404).json({ message: "Business not found", status: 404 });
    }

    const reviews = business.reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(skip, skip + limit);

    return res.status(200).json({
      status: 200,
      reviews,
      averageRating: business.averageRating,
      totalReviews: business.totalReviews,
      currentPage: page,
      totalPages: Math.ceil(business.reviews.length / limit)
    });

  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};


// Upload Review Images
export const uploadReviewImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided", status: 400 });
    }

    const uploadPromises = req.files.map(file => 
      imagekit.upload({
        file: file.buffer.toString('base64'),
        fileName: `review_${req.user._id}_${Date.now()}_${file.originalname}`,
        folder: '/business_reviews'
      })
    );

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.url);

    return res.status(200).json({
      message: "Images uploaded successfully",
      status: 200,
      images: imageUrls
    });

  } catch (error) {
    console.error("Error uploading review images:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
}




