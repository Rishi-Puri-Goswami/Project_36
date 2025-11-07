import { Worker } from "../models/worker_model.js";
import { ClientPost } from "../models/client_post_model.js";
import { Payment } from "../models/payment_model.js";
import { Plan } from "../models/planes_model.js";

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


