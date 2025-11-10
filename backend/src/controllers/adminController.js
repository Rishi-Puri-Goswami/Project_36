import { Worker } from "../models/worker_model.js";
import { ClientPost } from "../models/client_post_model.js";
import { Payment } from "../models/payment_model.js";
import { Plan } from "../models/planes_model.js";
import { Client } from "../models/client_models.js";
import { Subscription } from "../models/subscription_model.js";

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

    // 3. Total Revenue from Subscriptions
    const revenueData = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed' 
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
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
          totalAmount: { $sum: '$amount' }
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
      .select('orderId amount status createdAt');

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
          status: 'completed',
          createdAt: { $gte: dateRange }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amount' },
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



