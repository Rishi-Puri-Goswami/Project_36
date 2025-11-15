import { Worker } from "../models/worker_model.js";
import { ClientPost } from "../models/client_post_model.js";
import { Payment } from "../models/payment_model.js";
import { Plan } from "../models/planes_model.js";
import { Client } from "../models/client_models.js";
import { Subscription } from "../models/subscription_model.js";
import { Admin } from "../models/admin_model.js";
import { WorkerPost } from "../models/worker_post_model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// ==================== ADMIN AUTHENTICATION ====================

/**
 * Admin Login with Secret Key
 * POST /api/admin/auth/login
 * Body: { email, secretKey }
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, secretKey } = req.body;

    // Validate input
    if (!email || !secretKey) {
      return res.status(400).json({ 
        error: 'Email and secret key are required' 
      });
    }

    // Find admin by email and secretKey
    const admin = await Admin.findOne({ email, secretKey });

    if (!admin) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ 
        error: 'Account is deactivated. Contact super admin.' 
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email,
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success with token
    return res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });

  } catch (error) {
    console.error('Error in adminLogin:', error);
    return res.status(500).json({ 
      error: 'Server error during login',
      details: error.message 
    });
  }
};

/**
 * Get Current Admin Profile
 * GET /api/admin/auth/me
 * Requires: Admin Auth Token
 */
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;

    const admin = await Admin.findById(adminId).select('-secretKey');

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    return res.status(200).json({
      message: 'Profile fetched successfully',
      admin
    });

  } catch (error) {
    console.error('Error in getAdminProfile:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching profile',
      details: error.message 
    });
  }
};

/**
 * Create New Admin (Super Admin Only)
 * POST /api/admin/auth/create-admin
 * Body: { name, email, secretKey, role }
 */
export const createAdmin = async (req, res) => {
  try {
    const { name, email, secretKey, role } = req.body;

    // Only super-admin can create new admins
    if (req.admin.role !== 'super-admin') {
      return res.status(403).json({ 
        error: 'Only super admin can create new admins' 
      });
    }

    // Validate input
    if (!name || !email || !secretKey) {
      return res.status(400).json({ 
        error: 'Name, email and secret key are required' 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [{ email }, { secretKey }] 
    });

    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'Admin with this email or secret key already exists' 
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      name,
      email,
      secretKey,
      role: role || 'admin',
      createdBy: req.admin.id
    });

    await newAdmin.save();

    return res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });

  } catch (error) {
    console.error('Error in createAdmin:', error);
    return res.status(500).json({ 
      error: 'Server error while creating admin',
      details: error.message 
    });
  }
};

/**
 * Verify Admin Token (for protected routes)
 * GET /api/admin/auth/verify
 */
export const verifyAdminToken = async (req, res) => {
  try {
    return res.status(200).json({
      message: 'Token is valid',
      admin: {
        id: req.admin.id,
        email: req.admin.email,
        role: req.admin.role
      }
    });
  } catch (error) {
    console.error('Error in verifyAdminToken:', error);
    return res.status(500).json({ 
      error: 'Server error while verifying token',
      details: error.message 
    });
  }
};

// ==================== ORIGINAL ADMIN CONTROLLER FUNCTIONS ====================

export const listPendingWorkers = async (req, res) => {
  try {
    const pending = await Worker.find({ status: 'pending' }).limit(100);
    return res.json(pending);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const approveWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ error: 'Not found' });
    worker.status = 'approved';
    await worker.save();
    return res.json({ message: 'Worker approved' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const rejectWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ error: 'Not found' });
    worker.status = 'rejected';
    worker.adminNote = reason || '';
    await worker.save();
    return res.json({ message: 'Worker rejected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const listClientPosts = async (req, res) => {
  try {
  const posts = await ClientPost.find().populate('clientId', 'name companyName');
    return res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const listPendingPosts = async (req, res) => {
  try {
  const posts = await ClientPost.find({ isApproved: false }).populate('clientId', 'name companyName');
    return res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const approvePost = async (req, res) => {
  try {
    const { id } = req.params;
  const post = await ClientPost.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.isApproved = true;
    await post.save();
    return res.json({ message: 'Post approved' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const rejectPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
  const post = await ClientPost.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.isApproved = false;
    post.adminNote = reason || '';
    await post.save();
    return res.json({ message: 'Post rejected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const createplan = async (req, res) => {
  try {
    const { planName, viewsAllowed, price } = req.body;

    // Validation
    if (!planName || !viewsAllowed || !price) {
      return res.status(400).json({ 
        error: 'planName, viewsAllowed, and price are required' 
      });
    }

    // Validate planName enum
    const validPlanNames = ["Free", "Starter", "Pro"];
    if (!validPlanNames.includes(planName)) {
      return res.status(400).json({ 
        error: `planName must be one of: ${validPlanNames.join(', ')}` 
      });
    }

    // Check if plan already exists
    const existingPlan = await Plan.findOne({ planName });
    if (existingPlan) {
      return res.status(400).json({ 
        error: `Plan with name '${planName}' already exists` 
      });
    }

    // Validate price structure
    if (!price.amount || typeof price.amount !== 'number') {
      return res.status(400).json({ 
        error: 'price.amount must be a number' 
      });
    }

    // Create new plan
    const plan = new Plan({
      planName,
      viewsAllowed,
      price: {
        amount: price.amount,
        currency: price.currency || 'INR'
      }
    });

    await plan.save();

    return res.status(201).json({ 
      message: 'Plan created successfully', 
      plan 
    });

  } catch (err) {
    console.error('Error in createplan:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ==================== ADMIN DASHBOARD OVERVIEW ====================

/**
 * Get Dashboard Overview Statistics
 * Returns: Total users, jobs, revenue, subscriptions, recent registrations, popular work types, locations, payment stats
 */
export const getDashboardOverview = async (req, res) => {
  try {
    // 1. Total Users Count (Clients + Workers)
    const totalClients = await Client.countDocuments();
    const totalWorkers = await Worker.countDocuments();
    const totalUsers = totalClients + totalWorkers;

    // 2. Total Jobs Posted
    const totalJobs = await ClientPost.countDocuments();

    // 3. Total Revenue from Subscriptions (use price.amount and SUCCESS status)
    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'SUCCESS'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price.amount' }
        }
      }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // 4. Active Subscriptions Count
    const activeSubscriptions = await Subscription.countDocuments({ 
      status: 'active' 
    });

    // 5. Recent Registrations (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentClients = await Client.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentWorkers = await Worker.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentRegistrations = {
      total: recentClients + recentWorkers,
      clients: recentClients,
      workers: recentWorkers
    };

    // 6. Popular Work Types
    const popularWorkTypes = await Worker.aggregate([
      {
        $group: {
          _id: '$workType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          workType: '$_id',
          count: 1
        }
      }
    ]);

    // 7. Top Locations
    const topLocations = await Worker.aggregate([
      {
        $match: {
          location: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          location: '$_id',
          count: 1
        }
      }
    ]);

    // 8. Payment Statistics
    const paymentStats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$price.amount' }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          totalAmount: 1
        }
      }
    ]);

    // Additional: Recent Payments (Last 10)
    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .select('razorpayOrderId price status createdAt paymentId');

    // Return comprehensive dashboard data
    return res.status(200).json({
      message: 'Dashboard overview fetched successfully',
      data: {
        totalUsers: {
          total: totalUsers,
          clients: totalClients,
          workers: totalWorkers
        },
        totalJobs,
        totalRevenue,
        activeSubscriptions,
        recentRegistrations,
        popularWorkTypes,
        topLocations,
        paymentStatistics: {
          byStatus: paymentStats,
          recentPayments
        }
      }
    });

  } catch (error) {
    console.error('Error in getDashboardOverview:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching dashboard overview',
      details: error.message 
    });
  }
};

/**
 * Get User Growth Analytics
 * Returns daily/weekly/monthly user registration data
 */
export const getUserGrowthAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // daily, weekly, monthly

    let groupBy;
    let dateRange = new Date();

    switch (period) {
      case 'daily':
        dateRange.setDate(dateRange.getDate() - 30); // Last 30 days
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'weekly':
        dateRange.setDate(dateRange.getDate() - 90); // Last 90 days
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'monthly':
      default:
        dateRange.setFullYear(dateRange.getFullYear() - 1); // Last 12 months
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }

    // Client growth
    const clientGrowth = await Client.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Worker growth
    const workerGrowth = await Worker.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    return res.status(200).json({
      message: 'User growth analytics fetched successfully',
      period,
      data: {
        clients: clientGrowth,
        workers: workerGrowth
      }
    });

  } catch (error) {
    console.error('Error in getUserGrowthAnalytics:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching user growth analytics',
      details: error.message 
    });
  }
};

/**
 * Get Revenue Analytics
 * Returns daily/weekly/monthly revenue data
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // daily, weekly, monthly

    let groupBy;
    let dateRange = new Date();

    switch (period) {
      case 'daily':
        dateRange.setDate(dateRange.getDate() - 30);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'weekly':
        dateRange.setDate(dateRange.getDate() - 90);
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'monthly':
      default:
        dateRange.setFullYear(dateRange.getFullYear() - 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }

    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'SUCCESS',
          createdAt: { $gte: dateRange }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$price.amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    return res.status(200).json({
      message: 'Revenue analytics fetched successfully',
      period,
      data: revenueData
    });

  } catch (error) {
    console.error('Error in getRevenueAnalytics:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching revenue analytics',
      details: error.message 
    });
  }
};

// ==================== CLIENT MANAGEMENT ====================

/**
 * Get All Clients with Search and Filter
 * Query params: search, status, page, limit
 */
export const getAllClients = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    // Build filter query
    const filter = {};
    
    // Search by name, email, company, or phone
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status (active/blocked)
    if (status) {
      filter.status = status;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get clients with pagination
    const clients = await Client.find(filter)
      .select('-password -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Client.countDocuments(filter);
    
    // Get subscription status for each client
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const subscription = await Subscription.findOne({ 
          userId: client._id, 
          userType: 'Client' 
        });
        
        const jobPostsCount = await ClientPost.countDocuments({ 
          clientId: client._id 
        });
        
        return {
          ...client.toObject(),
          subscription: subscription ? {
            planName: subscription.planName,
            status: subscription.status,
            creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed
          } : null,
          jobPostsCount
        };
      })
    );
    
    return res.status(200).json({
      message: 'Clients fetched successfully',
      clients: clientsWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error in getAllClients:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching clients',
      details: error.message 
    });
  }
};

/**
 * Get Single Client Details
 */
export const getClientDetails = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Get client
    const client = await Client.findById(clientId).select('-password -otp -otpExpiry');
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Get subscription
    const subscription = await Subscription.findOne({ 
      userId: clientId, 
      userType: 'Client' 
    }).populate('planId');
    
    // Get job posts
    const jobPosts = await ClientPost.find({ clientId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get payment history
    const payments = await Payment.find({ userId: clientId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return res.status(200).json({
      message: 'Client details fetched successfully',
      client: {
        ...client.toObject(),
        subscription,
        jobPosts,
        payments,
        stats: {
          totalJobPosts: await ClientPost.countDocuments({ clientId }),
          totalPayments: await Payment.countDocuments({ userId: clientId }),
          totalSpent: await Payment.aggregate([
            { $match: { userId: client._id, status: 'SUCCESS' } },
            { $group: { _id: null, total: { $sum: '$price.amount' } } }
          ]).then(result => result[0]?.total || 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Error in getClientDetails:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching client details',
      details: error.message 
    });
  }
};

/**
 * Get Client's Job Posts
 */
export const getClientJobPosts = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const jobPosts = await ClientPost.find({ clientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('workerApplications', 'name email phone');
    
    const total = await ClientPost.countDocuments({ clientId });
    
    return res.status(200).json({
      message: 'Job posts fetched successfully',
      jobPosts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error in getClientJobPosts:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching job posts',
      details: error.message 
    });
  }
};

/**
 * Get Client's Payment History
 */
export const getClientPaymentHistory = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await Payment.find({ userId: clientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('planId', 'planName viewsAllowed price');
    
    const total = await Payment.countDocuments({ userId: clientId });
    
    // Calculate total spent
    const totalSpent = await Payment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(clientId), status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$price.amount' } } }
    ]);
    
    return res.status(200).json({
      message: 'Payment history fetched successfully',
      payments,
      totalSpent: totalSpent[0]?.total || 0,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error in getClientPaymentHistory:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching payment history',
      details: error.message 
    });
  }
};

/**
 * Get single payment details
 * GET /api/admin/payments/:paymentId
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });

    const payment = await Payment.findById(paymentId)
      .populate('userId', 'name email')
      .populate('planId', 'planName price');

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    return res.status(200).json({ payment });
  } catch (error) {
    console.error('Error in getPaymentDetails:', error);
    return res.status(500).json({ error: 'Server error while fetching payment details', details: error.message });
  }
};

/**
 * Get Client's Subscription Status
 */
export const getClientSubscription = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const subscription = await Subscription.findOne({ 
      userId: clientId, 
      userType: 'Client' 
    }).populate('planId');
    
    if (!subscription) {
      return res.status(404).json({ 
        message: 'No subscription found for this client',
        subscription: null 
      });
    }
    
    return res.status(200).json({
      message: 'Subscription fetched successfully',
      subscription: {
        ...subscription.toObject(),
        creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed,
        creditsUsed: subscription.viewsUsed
      }
    });
    
  } catch (error) {
    console.error('Error in getClientSubscription:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching subscription',
      details: error.message 
    });
  }
};

/**
 * Block/Unblock Client Account
 */
export const toggleClientStatus = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status } = req.body; // 'active' or 'blocked'
    
    if (!status || !['active', 'blocked'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be "active" or "blocked"' 
      });
    }
    
    const client = await Client.findByIdAndUpdate(
      clientId,
      { status },
      { new: true }
    ).select('-password -otp -otpExpiry');
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    return res.status(200).json({
      message: `Client ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
      client
    });
    
  } catch (error) {
    console.error('Error in toggleClientStatus:', error);
    return res.status(500).json({ 
      error: 'Server error while updating client status',
      details: error.message 
    });
  }
};

/**
 * Delete Client Account
 */
export const deleteClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Delete client
    const client = await Client.findByIdAndDelete(clientId);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Also delete related data
    await Subscription.deleteMany({ userId: clientId, userType: 'Client' });
    await ClientPost.deleteMany({ clientId });
    // Note: We're keeping Payment records for accounting purposes
    
    return res.status(200).json({
      message: 'Client deleted successfully',
      deletedClient: {
        id: client._id,
        name: client.name,
        email: client.email
      }
    });
    
  } catch (error) {
    console.error('Error in deleteClient:', error);
    return res.status(500).json({ 
      error: 'Server error while deleting client',
      details: error.message 
    });
  }
};

/**
 * Reset Client Credits
 */
export const resetClientCredits = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { credits } = req.body;
    
    if (typeof credits !== 'number' || credits < 0) {
      return res.status(400).json({ 
        error: 'Invalid credits value. Must be a non-negative number' 
      });
    }
    
    // Find client's subscription
    const subscription = await Subscription.findOne({ 
      userId: clientId, 
      userType: 'Client' 
    });
    
    if (!subscription) {
      return res.status(404).json({ 
        error: 'No subscription found for this client' 
      });
    }
    
    // Update credits (viewsAllowed)
    subscription.viewsAllowed = credits;
    subscription.viewsUsed = 0; // Reset usage to 0
    await subscription.save();
    
    return res.status(200).json({
      message: 'Client credits reset successfully',
      subscription: {
        planName: subscription.planName,
        creditsAllowed: subscription.viewsAllowed,
        creditsUsed: subscription.viewsUsed,
        creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed
      }
    });
    
  } catch (error) {
    console.error('Error in resetClientCredits:', error);
    return res.status(500).json({ 
      error: 'Server error while resetting credits',
      details: error.message 
    });
  }
};

/**
 * Block Client Account
 */
export const blockClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { reason } = req.body;
    
    const client = await Client.findByIdAndUpdate(
      clientId,
      { 
        status: 'blocked',
        blockReason: reason || 'Blocked by admin'
      },
      { new: true }
    ).select('-password -otp -otpExpiry');
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    return res.status(200).json({
      message: 'Client blocked successfully',
      client
    });
    
  } catch (error) {
    console.error('Error in blockClient:', error);
    return res.status(500).json({ 
      error: 'Server error while blocking client',
      details: error.message 
    });
  }
};

/**
 * Unblock Client Account
 */
export const unblockClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const client = await Client.findByIdAndUpdate(
      clientId,
      { 
        status: 'active',
        $unset: { blockReason: 1 }
      },
      { new: true }
    ).select('-password -otp -otpExpiry');
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    return res.status(200).json({
      message: 'Client unblocked successfully',
      client
    });
    
  } catch (error) {
    console.error('Error in unblockClient:', error);
    return res.status(500).json({ 
      error: 'Server error while unblocking client',
      details: error.message 
    });
  }
};


// ============================================
// 👷 WORKER MANAGEMENT APIS
// ============================================

/**
 * Get All Workers (with Search & Filter)
 */
export const getAllWorkers = async (req, res) => {
  try {
    const { search, status, workType, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = {};
    
    // Search by name, email, phone, location
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status (pending, approved, rejected, blocked)
    if (status) {
      query.status = status;
    }
    
    // Filter by work type
    if (workType) {
      query.workType = { $regex: workType, $options: 'i' };
    }
    
    const skip = (page - 1) * limit;
    
    // Get workers with application count
    const workers = await Worker.find(query)
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Add application count for each worker
    const workersWithStats = await Promise.all(
      workers.map(async (worker) => {
        const applicationCount = await ClientPost.countDocuments({
          workerApplications: worker._id
        });
        
        return {
          ...worker,
          applicationCount
        };
      })
    );
    
    const total = await Worker.countDocuments(query);
    
    return res.status(200).json({
      message: 'Workers fetched successfully',
      workers: workersWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in getAllWorkers:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching workers',
      details: error.message 
    });
  }
};

/**
 * Get Worker Details
 */
export const getWorkerDetails = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    // Get worker details
    const worker = await Worker.findById(workerId)
      .select('-password -otp')
      .lean();
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    // Get worker's job applications (recent 10)
    const applications = await ClientPost.find({
      workerApplications: workerId
    })
      .populate('clientId', 'name companyName email phone')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Get total applications count
    const totalApplications = await ClientPost.countDocuments({
      workerApplications: workerId
    });
    
    // Get subscription if any
    const subscription = await Subscription.findOne({
      userId: workerId,
      userType: 'Worker'
    }).lean();
    
    return res.status(200).json({
      message: 'Worker details fetched successfully',
      worker: {
        ...worker,
        applications,
        subscription,
        stats: {
          totalApplications
        }
      }
    });
    
  } catch (error) {
    console.error('Error in getWorkerDetails:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching worker details',
      details: error.message 
    });
  }
};

/**
 * Get Worker's Job Applications (Paginated)
 */
export const getWorkerApplications = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Get applications
    const applications = await ClientPost.find({
      workerApplications: workerId
    })
      .populate('clientId', 'name companyName email phone location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await ClientPost.countDocuments({
      workerApplications: workerId
    });
    
    return res.status(200).json({
      message: 'Worker applications fetched successfully',
      applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in getWorkerApplications:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching applications',
      details: error.message 
    });
  }
};

/**
 * Verify/Approve Worker Profile
 */
export const verifyWorkerProfile = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status, adminNote } = req.body; // status: 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be "approved" or "rejected"' 
      });
    }
    
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    worker.status = status;
    if (adminNote) {
      worker.adminNote = adminNote;
    }
    await worker.save();
    
    return res.status(200).json({
      message: `Worker profile ${status} successfully`,
      worker: {
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        status: worker.status,
        adminNote: worker.adminNote
      }
    });
    
  } catch (error) {
    console.error('Error in verifyWorkerProfile:', error);
    return res.status(500).json({ 
      error: 'Server error while verifying worker',
      details: error.message 
    });
  }
};

/**
 * Block/Unblock Worker Account
 */
export const toggleWorkerStatus = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status, reason } = req.body; // status: 'approved' or 'blocked'
    
    if (!['approved', 'blocked'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be "approved" or "blocked"' 
      });
    }
    
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    worker.status = status;
    if (reason) {
      worker.adminNote = reason;
    }
    await worker.save();
    
    return res.status(200).json({
      message: `Worker ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
      worker: {
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        status: worker.status,
        adminNote: worker.adminNote
      }
    });
    
  } catch (error) {
    console.error('Error in toggleWorkerStatus:', error);
    return res.status(500).json({ 
      error: 'Server error while updating worker status',
      details: error.message 
    });
  }
};

/**
 * Delete Worker Account
 */
export const deleteWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    // Delete worker's subscriptions
    await Subscription.deleteMany({ 
      userId: workerId, 
      userType: 'Worker' 
    });
    
    // Remove worker from all job applications
    await ClientPost.updateMany(
      { workerApplications: workerId },
      { $pull: { workerApplications: workerId } }
    );
    
    // Delete the worker
    await Worker.findByIdAndDelete(workerId);
    
    return res.status(200).json({
      message: 'Worker deleted successfully',
      deletedWorker: {
        id: worker._id,
        name: worker.name,
        email: worker.email
      }
    });
    
  } catch (error) {
    console.error('Error in deleteWorker:', error);
    return res.status(500).json({ 
      error: 'Server error while deleting worker',
      details: error.message 
    });
  }
};

// Block worker account
export const blockWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Block reason is required' });
    }
    
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    if (worker.accountStatus === 'blocked') {
      return res.status(400).json({ error: 'Worker is already blocked' });
    }
    
    worker.accountStatus = 'blocked';
    worker.blockReason = reason;
    await worker.save();
    
    return res.status(200).json({
      message: 'Worker blocked successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        accountStatus: worker.accountStatus,
        blockReason: worker.blockReason
      }
    });
    
  } catch (error) {
    console.error('Error in blockWorker:', error);
    return res.status(500).json({ 
      error: 'Server error while blocking worker',
      details: error.message 
    });
  }
};

// Unblock worker account
export const unblockWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    if (worker.accountStatus === 'active') {
      return res.status(400).json({ error: 'Worker is not blocked' });
    }
    
    worker.accountStatus = 'active';
    worker.blockReason = undefined;
    await worker.save();
    
    return res.status(200).json({
      message: 'Worker unblocked successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        accountStatus: worker.accountStatus
      }
    });
    
  } catch (error) {
    console.error('Error in unblockWorker:', error);
    return res.status(500).json({ 
      error: 'Server error while unblocking worker',
      details: error.message 
    });
  }
};

// Feature worker (highlight in search)
export const featureWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { days = 7 } = req.body; // Default 7 days
    
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    if (worker.isFeatured && worker.featuredUntil && worker.featuredUntil > new Date()) {
      return res.status(400).json({ 
        error: 'Worker is already featured',
        featuredUntil: worker.featuredUntil
      });
    }
    
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + parseInt(days));
    
    worker.isFeatured = true;
    worker.featuredUntil = featuredUntil;
    await worker.save();
    
    return res.status(200).json({
      message: 'Worker featured successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        isFeatured: worker.isFeatured,
        featuredUntil: worker.featuredUntil
      }
    });
    
  } catch (error) {
    console.error('Error in featureWorker:', error);
    return res.status(500).json({ 
      error: 'Server error while featuring worker',
      details: error.message 
    });
  }
};

// Unfeature worker
export const unfeatureWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    if (!worker.isFeatured) {
      return res.status(400).json({ error: 'Worker is not featured' });
    }
    
    worker.isFeatured = false;
    worker.featuredUntil = undefined;
    await worker.save();
    
    return res.status(200).json({
      message: 'Worker unfeatured successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        isFeatured: worker.isFeatured
      }
    });
    
  } catch (error) {
    console.error('Error in unfeatureWorker:', error);
    return res.status(500).json({ 
      error: 'Server error while unfeaturing worker',
      details: error.message 
    });
  }
};

/**
 * Get All Job Posts (with Search & Filter) - For Admin to Monitor
 */
export const getAllJobPosts = async (req, res) => {
  try {
    const { search, workType, status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Search by work type, location, description
    if (search) {
      query.$or = [
        { workType: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by work type
    if (workType) {
      query.workType = { $regex: workType, $options: 'i' };
    }
    
    // Filter by active/expired status
    if (status === 'active') {
      query.expiryDate = { $gt: new Date() };
    } else if (status === 'expired') {
      query.expiryDate = { $lte: new Date() };
    }
    
    const skip = (page - 1) * limit;
    
    const jobPosts = await ClientPost.find(query)
      .populate('clientId', 'name companyName email phone')
      .populate('workerApplications', 'name email phone workType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await ClientPost.countDocuments(query);
    
    return res.status(200).json({
      message: 'Job posts fetched successfully',
      jobPosts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in getAllJobPosts:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching job posts',
      details: error.message 
    });
  }
};

/**
 * Block/Delete Inappropriate Job Post
 */
export const deleteJobPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    
    const jobPost = await ClientPost.findById(postId)
      .populate('clientId', 'name email');
    
    if (!jobPost) {
      return res.status(404).json({ error: 'Job post not found' });
    }
    
    // Delete the job post
    await ClientPost.findByIdAndDelete(postId);
    
    return res.status(200).json({
      message: 'Job post deleted successfully',
      deletedPost: {
        id: jobPost._id,
        workType: jobPost.workType,
        clientName: jobPost.clientId?.name,
        reason: reason || 'Inappropriate content'
      }
    });
    
  } catch (error) {
    console.error('Error in deleteJobPost:', error);
    return res.status(500).json({ 
      error: 'Server error while deleting job post',
      details: error.message 
    });
  }
};

/**
 * Toggle Featured Status for Job Post
 */
export const toggleJobPostFeatured = async (req, res) => {
  try {
    const { postId } = req.params;
    const { isFeatured } = req.body;
    
    const jobPost = await ClientPost.findById(postId);
    
    if (!jobPost) {
      return res.status(404).json({ error: 'Job post not found' });
    }
    
    jobPost.isFeatured = isFeatured;
    await jobPost.save();
    
    return res.status(200).json({
      message: `Job post ${isFeatured ? 'marked as' : 'removed from'} featured successfully`,
      jobPost: {
        id: jobPost._id,
        workType: jobPost.workType,
        isFeatured: jobPost.isFeatured
      }
    });
    
  } catch (error) {
    console.error('Error in toggleJobPostFeatured:', error);
    return res.status(500).json({ 
      error: 'Server error while updating featured status',
      details: error.message 
    });
  }
};

// ==================== SUBSCRIPTION & PLANS MANAGEMENT ====================

/**
 * Get All Subscription Plans
 */
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    
    // Get purchase count for each plan
    const plansWithStats = await Promise.all(plans.map(async (plan) => {
      const purchaseCount = await Payment.countDocuments({ 
        planId: plan._id, 
        status: 'SUCCESS' 
      });
      
      const activeSubscriptions = await Subscription.countDocuments({
        planId: plan._id,
        status: 'active'
      });
      
      return {
        ...plan.toObject(),
        purchaseCount,
        activeSubscriptions
      };
    }));
    
    return res.status(200).json({
      plans: plansWithStats,
      totalPlans: plans.length
    });
    
  } catch (error) {
    console.error('Error in getAllPlans:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching plans',
      details: error.message 
    });
  }
};

/**
 * Get Single Plan Details
 */
export const getPlanDetails = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await Plan.findById(planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Get detailed stats
    const totalPurchases = await Payment.countDocuments({ 
      planId: plan._id, 
      status: 'SUCCESS' 
    });
    
    const totalRevenue = await Payment.aggregate([
      { $match: { planId: plan._id, status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$price.amount' } } }
    ]);
    
    const activeSubscriptions = await Subscription.countDocuments({
      planId: plan._id,
      status: 'active'
    });
    
    const expiredSubscriptions = await Subscription.countDocuments({
      planId: plan._id,
      status: 'expired'
    });
    
    return res.status(200).json({
      plan,
      stats: {
        totalPurchases,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeSubscriptions,
        expiredSubscriptions
      }
    });
    
  } catch (error) {
    console.error('Error in getPlanDetails:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching plan details',
      details: error.message 
    });
  }
};

/**
 * Update Plan Details
 */
export const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { planName, viewsAllowed, price, description, planType, duration } = req.body;
    
    const plan = await Plan.findById(planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Check if new planName already exists (if planName is being changed)
    if (planName && planName !== plan.planName) {
      const existingPlan = await Plan.findOne({ planName });
      if (existingPlan) {
        return res.status(400).json({ 
          error: `Plan with name '${planName}' already exists` 
        });
      }
    }
    
    // Update fields
    if (planName) plan.planName = planName;
    if (viewsAllowed !== undefined) plan.viewsAllowed = viewsAllowed;
    if (description !== undefined) plan.description = description;
    if (planType) plan.planType = planType;
    if (duration !== undefined) plan.duration = duration;
    
    if (price) {
      if (price.amount !== undefined) plan.price.amount = price.amount;
      if (price.currency) plan.price.currency = price.currency;
    }
    
    await plan.save();
    
    return res.status(200).json({
      message: 'Plan updated successfully',
      plan
    });
    
  } catch (error) {
    console.error('Error in updatePlan:', error);
    return res.status(500).json({ 
      error: 'Server error while updating plan',
      details: error.message 
    });
  }
};

/**
 * Delete Plan
 */
export const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await Plan.findById(planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Check if plan has active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({
      planId: plan._id,
      status: 'active'
    });
    
    if (activeSubscriptions > 0) {
      return res.status(400).json({ 
        error: `Cannot delete plan with ${activeSubscriptions} active subscriptions`,
        activeSubscriptions 
      });
    }
    
    // Delete the plan
    await Plan.findByIdAndDelete(planId);
    
    return res.status(200).json({
      message: 'Plan deleted successfully',
      deletedPlan: {
        id: plan._id,
        planName: plan.planName,
        price: plan.price.amount
      }
    });
    
  } catch (error) {
    console.error('Error in deletePlan:', error);
    return res.status(500).json({ 
      error: 'Server error while deleting plan',
      details: error.message 
    });
  }
};

/**
 * Get Plan Purchase History
 */
export const getPlanPurchaseHistory = async (req, res) => {
  try {
    const { planId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate, minAmount, maxAmount } = req.query;

    let query = { planId };

    if (status) {
      // Use case-insensitive match so stored status casing doesn't matter
      query.status = new RegExp(`^${status}$`, 'i');
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        if (isNaN(s.getTime())) return res.status(400).json({ error: 'Invalid startDate' });
        query.createdAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        if (isNaN(e.getTime())) return res.status(400).json({ error: 'Invalid endDate' });
        // include whole day for convenience if time not provided
        query.createdAt.$lte = e;
      }
    }

    // Amount range filter (price.amount)
    if (minAmount !== undefined || maxAmount !== undefined) {
      const amtFilter = {};
      if (minAmount !== undefined) {
        const minA = Number(minAmount);
        if (isNaN(minA)) return res.status(400).json({ error: 'Invalid minAmount' });
        amtFilter.$gte = minA;
      }
      if (maxAmount !== undefined) {
        const maxA = Number(maxAmount);
        if (isNaN(maxA)) return res.status(400).json({ error: 'Invalid maxAmount' });
        amtFilter.$lte = maxA;
      }
      query['price.amount'] = amtFilter;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const purchases = await Payment.find(query)
      .populate('userId', 'name email')
      .populate('planId', 'planName price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPurchases = await Payment.countDocuments(query);

    return res.status(200).json({
      purchases,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPurchases / parseInt(limit)),
      totalPurchases
    });

  } catch (error) {
    console.error('Error in getPlanPurchaseHistory:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching purchase history',
      details: error.message 
    });
  }
};

/**
 * Get All Purchase History (All Plans)
 */
export const getAllPurchaseHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, planId, startDate, endDate, minAmount, maxAmount } = req.query;

    let query = {};

    if (status) {
      // Use case-insensitive match so stored status casing doesn't matter
      query.status = new RegExp(`^${status}$`, 'i');
    }

    if (planId) {
      query.planId = planId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        if (isNaN(s.getTime())) return res.status(400).json({ error: 'Invalid startDate' });
        query.createdAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        if (isNaN(e.getTime())) return res.status(400).json({ error: 'Invalid endDate' });
        query.createdAt.$lte = e;
      }
    }

    // Amount range filter (price.amount)
    if (minAmount !== undefined || maxAmount !== undefined) {
      const amtFilter = {};
      if (minAmount !== undefined) {
        const minA = Number(minAmount);
        if (isNaN(minA)) return res.status(400).json({ error: 'Invalid minAmount' });
        amtFilter.$gte = minA;
      }
      if (maxAmount !== undefined) {
        const maxA = Number(maxAmount);
        if (isNaN(maxA)) return res.status(400).json({ error: 'Invalid maxAmount' });
        amtFilter.$lte = maxA;
      }
      query['price.amount'] = amtFilter;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const purchases = await Payment.find(query)
      .populate('userId', 'name email')
      .populate('planId', 'planName price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPurchases = await Payment.countDocuments(query);

    // For total revenue aggregation, ensure we only sum successful payments
    // Spread query first then enforce status:'SUCCESS' so user-provided status
    // doesn't accidentally override the success-only revenue calculation.
    const aggMatch = { ...query, status: 'SUCCESS' };

    const totalRevenue = await Payment.aggregate([
      { $match: aggMatch },
      { $group: { _id: null, total: { $sum: '$price.amount' } } }
    ]);

    return res.status(200).json({
      purchases,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPurchases / parseInt(limit)),
      totalPurchases,
      totalRevenue: totalRevenue[0]?.total || 0
    });

  } catch (error) {
    console.error('Error in getAllPurchaseHistory:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching purchase history',
      details: error.message 
    });
  }
};

/**
 * Get Most Popular Plans Analytics
 */
export const getMostPopularPlans = async (req, res) => {
  try {
    // Get all plans with purchase stats
    const plansAnalytics = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      {
        $group: {
          _id: '$planId',
          totalPurchases: { $sum: 1 },
          totalRevenue: { $sum: '$price.amount' },
          lastPurchase: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'plans',
          localField: '_id',
          foreignField: '_id',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $lookup: {
          from: 'subscriptions',
          let: { planId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$planId', '$$planId'] } } },
            {
              $group: {
                _id: null,
                active: {
                  $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                expired: {
                  $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
                }
              }
            }
          ],
          as: 'subscriptionStats'
        }
      },
      {
        $project: {
          planId: '$_id',
          planName: '$planDetails.planName',
          price: '$planDetails.price',
          totalPurchases: 1,
          totalRevenue: 1,
          lastPurchase: 1,
          activeSubscriptions: { 
            $ifNull: [{ $arrayElemAt: ['$subscriptionStats.active', 0] }, 0] 
          },
          expiredSubscriptions: { 
            $ifNull: [{ $arrayElemAt: ['$subscriptionStats.expired', 0] }, 0] 
          }
        }
      },
      { $sort: { totalPurchases: -1 } }
    ]);
    
    // Calculate conversion rate and popularity score
    const totalUsers = await Client.countDocuments();
    
    const analyticsWithMetrics = plansAnalytics.map(plan => ({
      ...plan,
      conversionRate: totalUsers > 0 ? ((plan.totalPurchases / totalUsers) * 100).toFixed(2) : 0,
      popularityScore: (plan.totalPurchases * 0.5) + (plan.activeSubscriptions * 0.3) + (plan.totalRevenue / 1000 * 0.2)
    }));
    
    // Sort by popularity score
    analyticsWithMetrics.sort((a, b) => b.popularityScore - a.popularityScore);
    
    return res.status(200).json({
      popularPlans: analyticsWithMetrics,
      totalPlans: analyticsWithMetrics.length
    });
    
  } catch (error) {
    console.error('Error in getMostPopularPlans:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching popular plans analytics',
      details: error.message 
    });
  }
};

/**
 * Get Plan Revenue Analytics
 */
export const getPlanRevenueAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query; // day, week, month, year
    
    let dateFilter = new Date();
    
    switch(timeframe) {
      case 'day':
        dateFilter.setDate(dateFilter.getDate() - 1);
        break;
      case 'week':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case 'month':
        dateFilter.setMonth(dateFilter.getMonth() - 1);
        break;
      case 'year':
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        break;
      default:
        dateFilter.setMonth(dateFilter.getMonth() - 1);
    }
    
    const revenueByPlan = await Payment.aggregate([
      { 
        $match: { 
          status: 'SUCCESS',
          createdAt: { $gte: dateFilter }
        } 
      },
      {
        $group: {
          _id: '$planId',
          revenue: { $sum: '$price.amount' },
          purchases: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'plans',
          localField: '_id',
          foreignField: '_id',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $project: {
          planName: '$planDetails.planName',
          revenue: 1,
          purchases: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    const totalRevenue = revenueByPlan.reduce((sum, plan) => sum + plan.revenue, 0);
    const totalPurchases = revenueByPlan.reduce((sum, plan) => sum + plan.purchases, 0);
    
    return res.status(200).json({
      timeframe,
      revenueByPlan,
      totalRevenue,
      totalPurchases,
      averageOrderValue: totalPurchases > 0 ? (totalRevenue / totalPurchases).toFixed(2) : 0
    });
    
  } catch (error) {
    console.error('Error in getPlanRevenueAnalytics:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching revenue analytics',
      details: error.message 
    });
  }
};

// ==================== WORKER POST MANAGEMENT ====================

/**
 * Get All Worker Posts (with Search & Filter)
 */
export const getAllWorkerPosts = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Search by title, description, skills
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status (active/inactive)
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await WorkerPost.find(query)
      .populate('worker', 'name email phone workType location profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await WorkerPost.countDocuments(query);
    
    return res.status(200).json({
      message: 'Worker posts fetched successfully',
      posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error in getAllWorkerPosts:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching worker posts',
      details: error.message 
    });
  }
};

/**
 * Get Worker Post Details
 */
export const getWorkerPostDetails = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await WorkerPost.findById(postId)
      .populate('worker', 'name email phone workType location profilePicture experience rating')
      .lean();
    
    if (!post) {
      return res.status(404).json({ error: 'Worker post not found' });
    }
    
    return res.status(200).json({
      message: 'Worker post details fetched successfully',
      post
    });
    
  } catch (error) {
    console.error('Error in getWorkerPostDetails:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching post details',
      details: error.message 
    });
  }
};

/**
 * Block/Unblock Worker Post
 */
export const toggleWorkerPostStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body; // 'active' or 'inactive'
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be "active" or "inactive"' 
      });
    }
    
    const post = await WorkerPost.findByIdAndUpdate(
      postId,
      { status },
      { new: true }
    ).populate('worker', 'name email');
    
    if (!post) {
      return res.status(404).json({ error: 'Worker post not found' });
    }
    
    return res.status(200).json({
      message: `Worker post ${status === 'inactive' ? 'blocked' : 'unblocked'} successfully`,
      post
    });
    
  } catch (error) {
    console.error('Error in toggleWorkerPostStatus:', error);
    return res.status(500).json({ 
      error: 'Server error while updating post status',
      details: error.message 
    });
  }
};

/**
 * Delete Worker Post
 */
export const deleteWorkerPostAdmin = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await WorkerPost.findById(postId)
      .populate('worker', 'name email');
    
    if (!post) {
      return res.status(404).json({ error: 'Worker post not found' });
    }
    
    // Delete the post
    await WorkerPost.findByIdAndDelete(postId);
    
    return res.status(200).json({
      message: 'Worker post deleted successfully',
      deletedPost: {
        id: post._id,
        title: post.title,
        workerName: post.worker?.name,
        workerEmail: post.worker?.email
      }
    });
    
  } catch (error) {
    console.error('Error in deleteWorkerPostAdmin:', error);
    return res.status(500).json({ 
      error: 'Server error while deleting worker post',
      details: error.message 
    });
  }
};

/**
 * Update Admin Profile
 * PUT /api/admin/auth/profile
 * Body: { name }
 */
export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { name } = req.body;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Name is required and must be at least 2 characters long' 
      });
    }

    // Update admin profile
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { name: name.trim() },
      { new: true, select: '-secretKey' }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      admin: {
        id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        lastLogin: updatedAdmin.lastLogin
      }
    });

  } catch (error) {
    console.error('Error in updateAdminProfile:', error);
    return res.status(500).json({ 
      error: 'Server error while updating profile',
      details: error.message 
    });
  }
};

/**
 * Change Admin Password (Secret Key)
 * PUT /api/admin/auth/change-password
 * Body: { currentSecretKey, newSecretKey }
 */
export const changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { currentSecretKey, newSecretKey } = req.body;

    // Validate input
    if (!currentSecretKey || !newSecretKey) {
      return res.status(400).json({ 
        error: 'Current secret key and new secret key are required' 
      });
    }

    if (newSecretKey.length < 6) {
      return res.status(400).json({ 
        error: 'New secret key must be at least 6 characters long' 
      });
    }

    // Find admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current secret key
    if (admin.secretKey !== currentSecretKey) {
      return res.status(401).json({ 
        error: 'Current secret key is incorrect' 
      });
    }

    // Check if new secret key is different from current
    if (currentSecretKey === newSecretKey) {
      return res.status(400).json({ 
        error: 'New secret key must be different from current secret key' 
      });
    }

    // Check if new secret key is already used by another admin
    const existingAdmin = await Admin.findOne({ 
      secretKey: newSecretKey,
      _id: { $ne: adminId }
    });

    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'This secret key is already in use by another admin' 
      });
    }

    // Update secret key
    admin.secretKey = newSecretKey;
    await admin.save();

    return res.status(200).json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error in changeAdminPassword:', error);
    return res.status(500).json({ 
      error: 'Server error while changing password',
      details: error.message 
    });
  }
};



