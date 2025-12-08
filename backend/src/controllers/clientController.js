import { ClientPost } from "../models/client_post_model.js";
import { Payment } from "../models/payment_model.js";
import { Client } from "../models/client_models.js";
import { Worker } from "../models/worker_model.js";
import { WorkerPost } from "../models/worker_post_model.js";
import jwt from "jsonwebtoken";
import { Subscription } from "../models/subscription_model.js";
import  razorpay  from "../config/razorpay.js";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { Plan } from "../models/planes_model.js";
import { sendOtpSms } from "../utils/smsService.js";
import bcrypt from "bcrypt";
import imagekit from "../config/imagekit.js";

export const registerClint = async (req , res )=>{

    try {
        
        const {name , companyName , email , password , role , phone , address , profilePicture } = req.body ;


        if(!name || !email || !password || !role || !phone){  
            return res.status(400).json({message : "All fields are required", status : 400});
        }

        // Check if client already exists with this phone number
        const existingClintByPhone = await Client.findOne({phone});
        if(existingClintByPhone){
            return res.status(400).json({message : "Client already exists with this phone number" , status : 400});
        }

        // Check if client already exists with this email
        const existingClintByEmail = await Client.findOne({email});
        if(existingClintByEmail){
            return res.status(400).json({message : "Client already exists with this email" , status : 400});
        }

        // Generate 6 digit random otp 
        const otp = Math.floor(100000 + Math.random() * 900000);
        console.log("Generated OTP is:", otp);
        
        if(!otp){
            return res.status(500).json({message : "Error in generating OTP" , status : 500});
        }

        // Send OTP via SMS using 2factor.in
        const smsResult = await sendOtpSms(phone, otp);
        
        if(!smsResult.success){
            return res.status(500).json({
                message : "Failed to send OTP to phone number", 
                status : 500,
                error: smsResult.message
            });
        }

        const newClient = new Client({
            name,
            companyName,
            email,
            password,
            role,
            phone,
        
            otp: {
                code : otp.toString(), 
                expiresAt : new Date(Date.now() + 10*60*1000), // OTP valid for 10 minutes
                attempts: 0,
                lastSentAt: new Date()
            },
            otpVerified: false
        });

        await newClient.save();

        return res.status(201).json({
            message : "OTP sent to your phone number for verification", 
            status : 201,
            phone: phone
        });

    } catch (error) {
        console.log("Error on register client:", error);
        return res.status(500).json({message : "Internal server error" , status : 500});
    }

}

export const verifyClintOtp = async (req , res )=>{

    try {
        
        const { phone , otp } = req.body ;
        if(!phone || !otp){
            return res.status(400).json({message : "Phone number and OTP required" , status : 400});
        }

        const clint = await Client.findOne({phone});

        if(!clint){
            return res.status(400).json({message : "Invalid phone number or OTP" , status : 400});
        }

        if (clint.otp.expiresAt < new Date()) {
            return res.status(400).json({ message: "OTP expired", status: 400 });
        }

        if (clint.otp.attempts >= 5) {
            return res.status(400).json({ message: "Max OTP attempts exceeded", status: 400 });
        }

        if(clint.otp.code != otp){
            clint.otp.attempts += 1;
            await clint.save();
            return res.status(400).json({message : "Invalid OTP" , status : 400});
        }

        const freePlan = await Plan.findOne({ planName: "Free Trial" });

        if (!freePlan) {
            return res.status(500).json({ message: "Free Trial plan not found, contact support", status: 500 });
        }

        // Create subscription with 10 free profile views
        const createSubscription = new Subscription({
            userId: clint._id,
            planId : freePlan._id,
            userType: "Client",
            planName: freePlan.planName,
            viewsAllowed: freePlan.viewsAllowed, // 10 free views
            viewsUsed: 0,
            startDate: new Date(),
            expiryDate: null, // Credit-based, no expiry
            status: "active",
            price: {
                amount: 0,
                currency: "INR"
            }
        });

        await createSubscription.save();

        clint.Subscription = createSubscription._id ;
        clint.otpVerified = true;
        clint.otp = undefined ;

        await clint.save();

        const token = jwt.sign({ id: clint._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('clinttoken', token, { 
            httpOnly : true ,
            maxAge : 1*24*60*60*1000 ,
            sameSite : isProduction ? "none" : "lax",
            secure: isProduction 
        });

        return res.status(200).json({
            message : "OTP verified successfully" , 
            status : 200 , 
            token 
        });

    } catch (error) {
        console.log("Error on verify client OTP:", error);
        return res.status(500).json({message : "Internal server error" , status : 500});
    }

}

export const resendClientOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required", status: 400 });
    }

    const client = await Client.findOne({ phone });
    if (!client) {
      return res.status(404).json({ message: "Client not found", status: 404 });
    }

    // Prevent frequent resends (cooldown 1 min)
    if (client.otp && client.otp.lastSentAt && (new Date() - client.otp.lastSentAt < 60 * 1000)) {
      return res.status(429).json({ 
        message: "OTP already sent. Please wait 1 minute before requesting again.", 
        status: 429 
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("Resent OTP is:", otp);

    // Send OTP via SMS using 2factor.in
    const smsResult = await sendOtpSms(phone, otp);
    
    if(!smsResult.success){
      return res.status(500).json({
        message : "Failed to send OTP to phone number", 
        status : 500,
        error: smsResult.message
      });
    }

    // Update OTP in client document
    client.otp = {
      code: otp.toString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
      lastSentAt: new Date()
    };
    await client.save();

    return res.status(200).json({ 
      message: "OTP resent successfully to your phone number", 
      status: 200 
    });
  } catch (error) {
    console.error("Error in resendClientOtp:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

// ===================== FORGOT PASSWORD (Client) =====================
export const sendClientForgotOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number is required", status: 400 });

    const client = await Client.findOne({ phone });
    if (!client) return res.status(404).json({ message: "Client not found", status: 404 });

    // Prevent frequent resends (cooldown 1 minute)
    if (client.otp && client.otp.lastSentAt && (new Date() - client.otp.lastSentAt < 60 * 1000)) {
      return res.status(429).json({ message: "OTP already sent. Please wait 1 minute before requesting again.", status: 429 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("Forgot-password OTP for client:", otp);

    const smsResult = await sendOtpSms(phone, otp);
    if (!smsResult.success) {
      return res.status(500).json({ message: "Failed to send OTP to phone number", status: 500, error: smsResult.message });
    }

    client.otp = {
      code: otp.toString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
      lastSentAt: new Date()
    };
    await client.save();

    return res.status(200).json({ message: "OTP sent successfully", status: 200 });
  } catch (error) {
    console.error("Error in sendClientForgotOtp:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const verifyClientForgotOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP required", status: 400 });

    const client = await Client.findOne({ phone });
    if (!client) return res.status(404).json({ message: "Client not found", status: 404 });

    if (!client.otp || !client.otp.code) {
      return res.status(400).json({ message: "No OTP requested for this number", status: 400 });
    }

    if (client.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired", status: 400 });
    }

    if (client.otp.attempts >= 5) {
      return res.status(400).json({ message: "Max OTP attempts exceeded", status: 400 });
    }

    if (client.otp.code !== otp.toString()) {
      client.otp.attempts += 1;
      await client.save();
      return res.status(400).json({ message: "Invalid OTP", status: 400 });
    }

    return res.status(200).json({ message: "OTP verified", status: 200 });
  } catch (error) {
    console.error("Error in verifyClientForgotOtp:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const resetClientPasswordWithOtp = async (req, res) => {
  try {
    const { phone, otp, newPassword, confirmPassword } = req.body;

    if (!phone || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Phone, OTP, new password and confirm password are required", status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match", status: 400 });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long", status: 400 });
    }

    const client = await Client.findOne({ phone });
    if (!client) return res.status(404).json({ message: "Client not found", status: 404 });

    if (!client.otp || !client.otp.code) {
      return res.status(400).json({ message: "No OTP requested for this number", status: 400 });
    }

    if (client.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired", status: 400 });
    }

    if (client.otp.attempts >= 5) {
      return res.status(400).json({ message: "Max OTP attempts exceeded", status: 400 });
    }

    if (client.otp.code !== otp.toString()) {
      client.otp.attempts += 1;
      await client.save();
      return res.status(400).json({ message: "Invalid OTP", status: 400 });
    }

    // Hash new password and save
    const saltRounds = 10;
    const hashed = await bcrypt.hash(newPassword, saltRounds);
    client.password = hashed;
    // clear otp so it can't be reused
    client.otp = undefined;
    await client.save();

    return res.status(200).json({ message: "Password reset successfully", status: 200 });
  } catch (error) {
    console.error("Error in resetClientPasswordWithOtp:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const loginClint = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required", status: 400 });
    }

    // Find client by email
    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(401).json({ message: "Invalid email or password", status: 401 });
    }

    // Check if OTP is verified
    if (!client.otpVerified) {
      return res.status(403).json({ message: "Please verify your phone number first", status: 403 });
    }

    // Check password using bcrypt (handle both hashed and plain text passwords during transition)
    let isPasswordValid = false;
    if (client.password && (client.password.startsWith('$2a$') || client.password.startsWith('$2b$') || client.password.startsWith('$2y$'))) {
      // Password is hashed, use bcrypt.compare
      isPasswordValid = await bcrypt.compare(password, client.password);
    } else {
      // Password is plain text, do direct comparison (for backward compatibility)
      isPasswordValid = (client.password === password);

      // If login succeeds with plain text, hash the password for future logins
      if (isPasswordValid) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        client.password = hashedPassword;
        await client.save();
        console.log(`🔐 Client ${client.name} password automatically hashed during login`);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password", status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign({ id: client._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set cookie with appropriate settings for development
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('clinttoken', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction
    });

    return res.status(200).json({
      message: "Login successful",
      status: 200,
      token,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        companyName: client.companyName,
        phone: client.phone
      }
    });

  } catch (error) {
    console.error("Error in login client:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const verifyAuth = async (req, res) => {
  try {
    const token = req.cookies?.clinttoken;
    
    if (!token) {
      return res.status(401).json({ message: "Not authenticated", status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await Client.findById(decoded.id).select('-password -otp');
    
    if (!client) {
      return res.status(401).json({ message: "Client not found", status: 401 });
    }

    return res.status(200).json({
      message: "Authenticated",
      status: 200,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        companyName: client.companyName,
        phone: client.phone,
        role: client.role,
        otpVerified: client.otpVerified
      }
    });

  } catch (error) {
    console.error("Error in verify auth:", error);
    return res.status(401).json({ message: "Invalid token", status: 401 });
  }
};

export const getProfile = async (req, res) => {
  try {
    const token = req.cookies?.clinttoken;
    
    if (!token) {
      return res.status(401).json({ message: "Not authenticated", status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await Client.findById(decoded.id).select('-password -otp');
    
    if (!client) {
      return res.status(404).json({ message: "Client not found", status: 404 });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      status: 200,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        companyName: client.companyName,
        phone: client.phone,
        address: client.address,
        role: client.role,
        otpVerified: client.otpVerified,
        profilePicture: client.profilePicture,
        coverPhoto: client.coverPhoto
      }
    });

  } catch (error) {
    console.error("Error in get profile:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const logoutClint = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('clinttoken', {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction
    });

    return res.status(200).json({
      message: "Logout successful",
      status: 200
    });

  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ message: "Internal server error", status: 500 });
  }
};

export const createClientPost = async (req, res) => {
  try {

    const { clientId, workType, numberOfWorkers, location, salaryRange, description , contactNumber } = req.body;
    if (!clientId || !workType) return res.status(400).json({ error: 'clientId and workType are required' });

    // Start as not visible to workers; payment required for visibility

  const post = new ClientPost({
      clientId,
      workType,
      numberOfWorkers,
      location,
      salaryRange,
      description,
      contactNumber,
      paidVisibility: false,
      validityDays: 0,
      isApproved: false
    });

    await post.save();

    return res.status(201).json({ message: 'Post created and pending admin approval. Use payment endpoint after approval.', postId: post._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const payForPostVisibility = async (req, res) => {
  try {
    const { postId, clientId, durationDays, amount, gateway, gatewayPaymentId } = req.body;
    if (!postId || !clientId || !durationDays || !amount) return res.status(400).json({ error: 'postId, clientId, durationDays and amount required' });

  const post = await ClientPost.findById(postId);
    if (!post) return res.status(404).json({ error: 'post not found' });
    if (!post.isApproved) return res.status(400).json({ error: 'post must be approved by admin before payment' });

    // create payment record (gateway integration to be implemented)
    const payment = new Payment({ userId: clientId, amount, gateway, gatewayPaymentId, status: 'success' });
    await payment.save();

    // attach payment and set visibility and expiry
    post.payments = post.payments || [];
    post.payments.push(payment._id);
    post.paidVisibility = true;
    post.validityDays = durationDays;
    post.expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await post.save();

    return res.json({ message: 'Payment recorded, post is visible to workers until expiry', expiryDate: post.expiryDate });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const renewPost = async (req, res) => {
  try {
    const { postId, clientId, durationDays, amount, gateway, gatewayPaymentId } = req.body;
    if (!postId || !clientId || !durationDays || !amount) return res.status(400).json({ error: 'postId, clientId, durationDays and amount required' });

  const post = await ClientPost.findById(postId);
    if (!post) return res.status(404).json({ error: 'post not found' });

    const payment = new Payment({ userId: clientId, amount, gateway, gatewayPaymentId, status: 'success' });
    await payment.save();

    post.payments = post.payments || [];
    post.payments.push(payment._id);
    post.paidVisibility = true;
    // if already active with expiry in future, extend it
    const base = (post.expiryDate && post.expiryDate > Date.now()) ? post.expiryDate : new Date();
    post.expiryDate = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);
    post.validityDays = durationDays;
    await post.save();

    return res.json({ message: 'Post renewed', expiryDate: post.expiryDate });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const listClientPostsForAdmin = async (req, res) => {
  try {
  const posts = await ClientPost.find().populate('clientId', 'name companyName email');
    return res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};


/**
 * 📋 Get Worker Applications for a Job Post
 * Returns LIMITED worker info (name, work type, experience, profile picture)
 * Does NOT show contact details (phone, email) until unlocked
 */
export const workerApplication = async (req, res) => {
  try {
    const { postId } = req.params;
    const clientId = req.user._id; // Get from auth middleware

    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    // Verify post belongs to this client
    const post = await ClientPost.findById(postId).populate('workerApplications');
    if (!post) {
      return res.status(404).json({ error: "post not found" });
    }

    if (post.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({ error: "Unauthorized - This is not your job post" });
    }

    // Get client's subscription to check unlocked workers
    const subscription = await Subscription.findOne({
      userId: clientId,
      userType: 'Client',
      status: 'active'
    });

    const now = new Date();
    const unlockedWorkerIds = subscription 
      ? subscription.unlockedWorkers
          .filter(unlock => unlock.expiresAt > now)
          .map(unlock => unlock.workerId.toString())
      : [];

    // Return LIMITED worker info (hide contact details until unlocked)
    const applications = post.workerApplications.map(worker => {
      const isUnlocked = unlockedWorkerIds.includes(worker._id.toString());
      const unlockInfo = subscription?.unlockedWorkers.find(
        u => u.workerId.toString() === worker._id.toString() && u.expiresAt > now
      );

      return {
        _id: worker._id,
        name: worker.name,
        workType: worker.workType,
        yearsOfExperience: worker.yearsOfExperience,
        location: worker.location,
        profilePicture: worker.profilePicture,
        skills: worker.skills,
        bio: worker.bio,
        age: worker.age,
        
        // 🔒 Contact details only if unlocked
        isUnlocked: isUnlocked,
        ...(isUnlocked && {
          phone: worker.phone,
          email: worker.email,
          workPhotos: worker.workPhotos,
          idProof: worker.idProof,
          coordinates: worker.coordinates,
          unlockExpiresAt: unlockInfo?.expiresAt,
          timeRemaining: Math.ceil((unlockInfo?.expiresAt - now) / (1000 * 60 * 60)) + ' hours'
        })
      };
    });

    return res.status(200).json({
      message: "applications fetched successfully",
      applications,
      subscription: subscription ? {
        viewsAllowed: subscription.viewsAllowed,
        viewsUsed: subscription.viewsUsed,
        creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed
      } : null,
      totalApplications: applications.length,
      unlockedCount: applications.filter(a => a.isUnlocked).length
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * 🔓 Unlock Worker Profile - Deduct 1 Credit for 24-hour Access
 * When client clicks "View Profile", this endpoint:
 * 1. Checks if worker is already unlocked and not expired (free access)
 * 2. If expired or never unlocked, deducts 1 credit
 * 3. Grants 24-hour access to worker profile
 */
export const unlockWorkerProfile = async (req, res) => {
  try {
    const { workerId } = req.params;
    const clientId = req.user._id;

    // Validate worker exists
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Get client's active subscription
    const subscription = await Subscription.findOne({
      userId: clientId,
      userType: 'Client',
      status: 'active'
    });

    if (!subscription) {
      return res.status(403).json({ 
        error: 'No active subscription found',
        message: 'Please purchase a plan to view worker profiles'
      });
    }

    // Check if worker is already unlocked and not expired
    const now = new Date();
    const existingUnlock = subscription.unlockedWorkers.find(
      unlock => unlock.workerId.toString() === workerId && unlock.expiresAt > now
    );

    if (existingUnlock) {
      // Worker already unlocked and still valid - no credit deduction
      const timeRemaining = Math.ceil((existingUnlock.expiresAt - now) / (1000 * 60 * 60)); // hours
      
      return res.status(200).json({
        success: true,
        message: 'Worker profile already unlocked',
        alreadyUnlocked: true,
        worker: {
          _id: worker._id,
          name: worker.name,
          email: worker.email,
          phone: worker.phone,
          age: worker.age,
          workType: worker.workType,
          yearsOfExperience: worker.yearsOfExperience,
          location: worker.location,
          coordinates: worker.coordinates,
          skills: worker.skills,
          bio: worker.bio,
          profilePicture: worker.profilePicture,
          workPhotos: worker.workPhotos,
          idProof: worker.idProof
        },
        unlockInfo: {
          unlockedAt: existingUnlock.unlockedAt,
          expiresAt: existingUnlock.expiresAt,
          timeRemaining: `${timeRemaining} hours`
        },
        subscription: {
          viewsAllowed: subscription.viewsAllowed,
          viewsUsed: subscription.viewsUsed,
          creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed
        }
      });
    }

    // Check if client has enough credits
    const creditsRemaining = subscription.viewsAllowed - subscription.viewsUsed;
    if (creditsRemaining <= 0) {
      return res.status(403).json({
        error: 'Insufficient credits',
        message: 'You have no credits left. Please purchase more credits to view worker profiles.',
        creditsRemaining: 0
      });
    }

    // Deduct 1 credit
    subscription.viewsUsed += 1;

    // Add worker to viewedWorkers if not already there
    if (!subscription.viewedWorkers.includes(workerId)) {
      subscription.viewedWorkers.push(workerId);
    }

    // Remove expired unlocks for this worker
    subscription.unlockedWorkers = subscription.unlockedWorkers.filter(
      unlock => !(unlock.workerId.toString() === workerId && unlock.expiresAt <= now)
    );

    // Add new unlock with 24-hour expiry
    const unlockedAt = new Date();
    const expiresAt = new Date(unlockedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    subscription.unlockedWorkers.push({
      workerId: workerId,
      unlockedAt: unlockedAt,
      expiresAt: expiresAt
    });

    await subscription.save();

    return res.status(200).json({
      success: true,
      message: 'Worker profile unlocked successfully! 1 credit deducted.',
      creditDeducted: true,
      worker: {
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        age: worker.age,
        workType: worker.workType,
        yearsOfExperience: worker.yearsOfExperience,
        location: worker.location,
        coordinates: worker.coordinates,
        skills: worker.skills,
        bio: worker.bio,
        profilePicture: worker.profilePicture,
        workPhotos: worker.workPhotos,
        idProof: worker.idProof
      },
      unlockInfo: {
        unlockedAt: unlockedAt,
        expiresAt: expiresAt,
        validFor: '24 hours'
      },
      subscription: {
        viewsAllowed: subscription.viewsAllowed,
        viewsUsed: subscription.viewsUsed,
        creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed
      }
    });

  } catch (err) {
    console.error('Error in unlockWorkerProfile:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * 📋 Get Client's Unlocked Workers
 * Returns list of workers client has unlocked with expiry status
 */
export const getUnlockedWorkers = async (req, res) => {
  try {
    const clientId = req.user._id;

    const subscription = await Subscription.findOne({
      userId: clientId,
      userType: 'Client',
      status: 'active'
    }).populate('unlockedWorkers.workerId', 'name email phone workType location profilePicture');

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const now = new Date();

    // Separate active and expired unlocks
    const unlockedWorkers = subscription.unlockedWorkers.map(unlock => {
      const isExpired = unlock.expiresAt <= now;
      const timeRemaining = isExpired ? 0 : Math.ceil((unlock.expiresAt - now) / (1000 * 60 * 60));

      return {
        worker: unlock.workerId,
        unlockedAt: unlock.unlockedAt,
        expiresAt: unlock.expiresAt,
        isExpired,
        timeRemaining: isExpired ? 'Expired' : `${timeRemaining} hours`
      };
    });

    return res.status(200).json({
      success: true,
      unlockedWorkers,
      subscription: {
        viewsAllowed: subscription.viewsAllowed,
        viewsUsed: subscription.viewsUsed,
        creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed
      }
    });

  } catch (err) {
    console.error('Error in getUnlockedWorkers:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const payment = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user._id;

    const planDetails = await Plan.findById(planId);
    if (!planDetails) return res.status(404).json({ error: 'Plan not found' });
    

    const price = planDetails.price;


    const order = await razorpay.orders.create({
      amount: price.amount * 100,
      currency: price.currency,
      receipt: `receipt_${Date.now()}`
    });


    const payment = new Payment({
      planId: planDetails._id,
      userId,
      razorpayOrderId: order.id,
      paymentId: "",
      price: { amount: price.amount, currency: price.currency },
      status: "PENDING"
    });


    await payment.save();

    res.status(200).json({ message :"Payment initiated successfully",success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


export const paymentVerification = async (req, res) => {
try {
  
  const {razorpayOrderId , paymentId , signature } = req.body ;
  if(!razorpayOrderId || !paymentId || !signature){
    return res.status(400).json({ error: "All fields are required" });
  }

  const isValid = validatePaymentVerification(
    {
      order_id : razorpayOrderId,
      payment_id : paymentId
    },
    signature,
    process.env.RAZORPAY_KEY_SECRET
  );


  if(!isValid){
    return res.status(400).json({ error: "Invalid payment signature" });
  }

  const payment = await Payment.findOne({ razorpayOrderId: razorpayOrderId });
  if(!payment){
    return res.status(404).json({ error: "Payment record not found" });
  } 

  payment.paymentId = paymentId ;
  payment.signature = signature ;
  payment.status = "SUCCESS" ;

  await payment.save();


  const Clint = await Client.findById(payment.userId);
  if(!Clint){
    return res.status(404).json({ error: "Clint not found for this payment" });
  }


  const planDetails = await Plan.findById(payment.planId);
  if(!planDetails){
    return res.status(404).json({ error: "Plan not found for this payment" });
  }

  const subscription = await Subscription.findOne({ userId: Clint._id , userType : "Client" });
  
  if(!subscription){
    return res.status(404).json({ error: "Subscription not found for this client" });
  }

  subscription.planId = planDetails._id ;
  subscription.planName = planDetails.planName ;
  subscription.price = { amount : planDetails.price.amount , currency : planDetails.price.currency } ;
  // add views allowed from plan to subscription
  subscription.viewsAllowed += planDetails.viewsAllowed;
  subscription.startDate = new Date() ;
  subscription.status = "active" ;
  await subscription.save();


  return res.status(200).json({ message: "Payment verified successfully" });

} catch (error) {
  console.error("error in payment verification controller" , error);
  return res.status(500).json({ error: "Server error in payment verification" });
}

}

// Create a new job post
export const createJobPost = async (req, res) => {
  try {
    const {
      workType,
      numberOfWorkers,
      location,
      salaryRange,
      description,
      contactNumber,
      validityDays,
      // New fields
      department,
      employmentType,
      shift,
      experienceMinYears,
      education,
      degreeSpecialization,
      gender,
      companyName,
      companyAddress,
      companyWebsite,
      additionalInfo
    } = req.body;

    // Get client ID from JWT token
    const clientId = req.clint._id;

    if (!workType || !location || !description) {
      return res.status(400).json({ message: "Work type, location, and description are required" });
    }

    // Create new job post with expanded fields
    const jobPost = new ClientPost({
      clientId,
      workType,
      numberOfWorkers: numberOfWorkers || 1,
      location,
      salaryRange,
      description,
      contactNumber,
      validityDays: validityDays || 15,
      paidVisibility: false,
      department,
      employmentType,
      shift,
      experienceMinYears: experienceMinYears ? Number(experienceMinYears) : undefined,
      education,
      degreeSpecialization,
      gender,
      companyName,
      companyAddress,
      companyWebsite,
      additionalInfo
    });

    await jobPost.save();

    return res.status(201).json({ 
      message: "Job posted successfully", 
      jobPost 
    });

  } catch (error) {
    console.error("Error in createJobPost controller:", error);
    return res.status(500).json({ error: "Server error in creating job post" });
  }
};

// Get all job posts by the logged-in client
export const getMyJobPosts = async (req, res) => {
  try {
    const clientId = req.clint._id;

    const jobPosts = await ClientPost.find({ clientId })
      .sort({ createdAt: -1 })
      .populate('workerApplications', 'name email phone');

    return res.status(200).json({ 
      message: "Job posts fetched successfully", 
      jobPosts 
    });

  } catch (error) {
    console.error("Error in getMyJobPosts controller:", error);
    return res.status(500).json({ error: "Server error in fetching job posts" });
  }
};

// Get a single job post by ID
export const getJobPostById = async (req, res) => {
  try {
    const { jobId } = req.params;
    const clientId = req.clint._id;

    const jobPost = await ClientPost.findOne({ _id: jobId, clientId })
      .populate('workerApplications', 'name email phone');

    if (!jobPost) {
      return res.status(404).json({ message: "Job post not found" });
    }

    return res.status(200).json({ 
      message: "Job post fetched successfully", 
      jobPost 
    });

  } catch (error) {
    console.error("Error in getJobPostById controller:", error);
    return res.status(500).json({ error: "Server error in fetching job post" });
  }
};

// Update a job post
export const updateJobPost = async (req, res) => {
  try {
    const { jobId } = req.params;
    const clientId = req.clint._id;
    const {
      workType,
      numberOfWorkers,
      location,
      salaryRange,
      description,
      contactNumber,
      validityDays,
      // New fields
      department,
      employmentType,
      shift,
      experienceMinYears,
      education,
      degreeSpecialization,
      gender,
      companyName,
      companyAddress,
      companyWebsite,
      additionalInfo
    } = req.body;

    const jobPost = await ClientPost.findOne({ _id: jobId, clientId });

    if (!jobPost) {
      return res.status(404).json({ message: "Job post not found" });
    }

    // Update fields
    if (workType) jobPost.workType = workType;
    if (numberOfWorkers) jobPost.numberOfWorkers = numberOfWorkers;
    if (location) jobPost.location = location;
    if (salaryRange) jobPost.salaryRange = salaryRange;
    if (description) jobPost.description = description;
    if (contactNumber) jobPost.contactNumber = contactNumber;
    if (validityDays) jobPost.validityDays = validityDays;

    // Update new fields if provided
    if (department !== undefined) jobPost.department = department;
    if (employmentType !== undefined) jobPost.employmentType = employmentType;
    if (shift !== undefined) jobPost.shift = shift;
    if (experienceMinYears !== undefined) jobPost.experienceMinYears = experienceMinYears ? Number(experienceMinYears) : undefined;
    if (education !== undefined) jobPost.education = education;
    if (degreeSpecialization !== undefined) jobPost.degreeSpecialization = degreeSpecialization;
    if (gender !== undefined) jobPost.gender = gender;
    if (companyName !== undefined) jobPost.companyName = companyName;
    if (companyAddress !== undefined) jobPost.companyAddress = companyAddress;
    if (companyWebsite !== undefined) jobPost.companyWebsite = companyWebsite;
    if (additionalInfo !== undefined) jobPost.additionalInfo = additionalInfo;

    await jobPost.save();

    return res.status(200).json({ 
      message: "Job post updated successfully", 
      jobPost 
    });

  } catch (error) {
    console.error("Error in updateJobPost controller:", error);
    return res.status(500).json({ error: "Server error in updating job post" });
  }
};

// Delete a job post
export const deleteJobPost = async (req, res) => {
  try {
    const { jobId } = req.params;
    const clientId = req.clint._id;

    const jobPost = await ClientPost.findOneAndDelete({ _id: jobId, clientId });

    if (!jobPost) {
      return res.status(404).json({ message: "Job post not found" });
    }

    return res.status(200).json({ 
      message: "Job post deleted successfully" 
    });

  } catch (error) {
    console.error("Error in deleteJobPost controller:", error);
    return res.status(500).json({ error: "Server error in deleting job post" });
  }
};

// Get all available jobs for workers (public route)
// Only shows jobs from clients with ACTIVE subscriptions
export const getAllAvailableJobs = async (req, res) => {
  try {
    const { workType, location, salaryRange, search, latitude, longitude, radius = 30 } = req.query;

    // Build filter query
    const filter = {
      expiryDate: { $gte: new Date() } // Only active jobs
    };

    if (workType && workType !== 'all') {
      filter.workType = workType;
    }

    if (location && location.trim() !== '') {
      filter.location = { $regex: location, $options: 'i' }; // Case-insensitive search
    }

    if (salaryRange && salaryRange !== 'all') {
      filter.salaryRange = salaryRange;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { workType: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch all matching jobs
    let jobs = await ClientPost.find(filter)
      .populate('clientId', 'name companyName email phone coordinates')
      .sort({ createdAt: -1 })
      .limit(100);

    // Filter out jobs where client doesn't exist
    let validJobs = jobs.filter(job => job.clientId);

    // 📍 Filter by distance if latitude/longitude provided (30km radius)
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      const maxDistance = parseFloat(radius); // km

      validJobs = validJobs.filter(job => {
        const client = job.clientId;
        
        if (!client.coordinates || !client.coordinates.latitude || !client.coordinates.longitude) {
          return false; // Skip jobs from clients without location
        }

        const distance = calculateDistance(
          userLat,
          userLon,
          client.coordinates.latitude,
          client.coordinates.longitude
        );

        // Add distance to job object for frontend display
        job._doc.distance = Math.round(distance * 10) / 10; // Round to 1 decimal

        return distance <= maxDistance;
      });

      // Sort by distance (nearest first)
      validJobs.sort((a, b) => a._doc.distance - b._doc.distance);

      console.log(`📍 Found ${validJobs.length} jobs within ${maxDistance}km radius`);
    } else {
      console.log(`📋 Found ${validJobs.length} valid jobs for workers`);
    }

    return res.status(200).json({ 
      message: "Jobs fetched successfully", 
      jobs: validJobs,
      total: validJobs.length,
      ...(latitude && longitude && { searchRadius: `${radius}km` })
    });

  } catch (error) {
    console.error("Error in getAllAvailableJobs controller:", error);
    return res.status(500).json({ error: "Server error in fetching jobs" });
  }
};

// Get all available workers for clients (public route for searching workers)
export const getAllAvailableWorkers = async (req, res) => {
  try {
    const { workType, location, search, latitude, longitude, radius = 30 } = req.query;

    // Build filter query
    const filter = {};

    if (workType && workType !== 'all' && workType.trim() !== '') {
      filter.workType = { $regex: workType, $options: 'i' }; // Case-insensitive
    }

    if (location && location.trim() !== '') {
      filter.location = { $regex: location, $options: 'i' }; // Case-insensitive search
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { workType: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }

    let workers = await Worker.find(filter)
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .limit(100);

    // Get post count for each worker
    const workersWithPostCount = await Promise.all(
      workers.map(async (worker) => {
        const postCount = await WorkerPost.countDocuments({ worker: worker._id });
        return {
          ...worker._doc,
          postCount
        };
      })
    );

    workers = workersWithPostCount;

    // 📍 Filter by distance if latitude/longitude provided (30km radius)
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      const maxDistance = parseFloat(radius); // km

      workers = workers.filter(worker => {
        if (!worker.coordinates || !worker.coordinates.latitude || !worker.coordinates.longitude) {
          return false; // Skip workers without location
        }

        const distance = calculateDistance(
          userLat,
          userLon,
          worker.coordinates.latitude,
          worker.coordinates.longitude
        );

        // Add distance to worker object for frontend display
        worker.distance = Math.round(distance * 10) / 10; // Round to 1 decimal

        return distance <= maxDistance;
      });

      // Sort by distance (nearest first)
      workers.sort((a, b) => a.distance - b.distance);

      console.log(`📍 Found ${workers.length} workers within ${maxDistance}km radius`);
    }

    return res.status(200).json({ 
      message: "Workers fetched successfully", 
      workers,
      total: workers.length,
      ...(latitude && longitude && { searchRadius: `${radius}km` })
    });

  } catch (error) {
    console.error("Error in getAllAvailableWorkers controller:", error);
    return res.status(500).json({ error: "Server error in fetching workers" });
  }
};

/**
 * 🔍 Search Workers with Their Posts
 * Returns workers along with their posts (limited preview)
 * Shows worker profile + list of posts (title, preview images only)
 * Client must unlock each post to see full details
 */
export const searchWorkersWithPosts = async (req, res) => {
  try {
    const { workType, location, search, latitude, longitude, radius = 30 } = req.query;
    const clientId = req.clint?._id; // Optional - get if authenticated

    // Build filter query for workers
    const filter = { 
      accountStatus: 'active', // Only show active workers (not blocked)
      status: 'approved' // Only show approved workers
    };

    if (workType && workType !== 'all' && workType.trim() !== '') {
      filter.workType = { $regex: workType, $options: 'i' };
    }

    if (location && location.trim() !== '') {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { workType: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch workers
    let workers = await Worker.find(filter)
      .select('name workType location skills bio profilePicture yearsOfExperience age coordinates')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`📋 Found ${workers.length} workers matching criteria`);

    // Get client's viewed posts (if authenticated)
    let viewedPostIds = [];
    if (clientId) {
      const subscription = await Subscription.findOne({
        userId: clientId,
        userType: 'Client'
      });
      viewedPostIds = subscription?.viewedWorkerPosts?.map(id => id.toString()) || [];
      console.log(`🔓 Client has unlocked ${viewedPostIds.length} posts`);
    }

    // Fetch posts for each worker
    const workersWithPosts = await Promise.all(
      workers.map(async (worker) => {
        // Get active worker posts (max 10 recent posts)
        const posts = await WorkerPost.find({ 
          worker: worker._id, 
          status: 'active' 
        })
          .select('title description images skills availability expectedSalary createdAt')
          .sort({ createdAt: -1 })
          .limit(10);

        // Mark which posts client has already viewed (unlocked)
        const postsWithUnlockStatus = posts.map(post => {
          const isUnlocked = viewedPostIds.includes(post._id.toString());
          
          return {
            _id: post._id,
            title: post.title,
            // Show limited preview for locked posts
            description: isUnlocked ? post.description : post.description.substring(0, 100) + '...',
            previewImage: post.images[0] || null, // First image only for preview
            imageCount: post.images.length,
            skills: post.skills,
            availability: post.availability,
            expectedSalary: post.expectedSalary,
            createdAt: post.createdAt,
            isUnlocked: isUnlocked,
            // Only show full images if unlocked
            images: isUnlocked ? post.images : []
          };
        });

        return {
          worker: {
            _id: worker._id,
            name: worker.name,
            workType: worker.workType,
            location: worker.location,
            skills: worker.skills,
            bio: worker.bio,
            profilePicture: worker.profilePicture,
            yearsOfExperience: worker.yearsOfExperience,
            age: worker.age,
            coordinates: worker.coordinates
          },
          posts: postsWithUnlockStatus,
          postCount: postsWithUnlockStatus.length
        };
      })
    );

    // Filter by distance if coordinates provided
    let filteredWorkers = workersWithPosts;
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      const maxDistance = parseFloat(radius);

      filteredWorkers = workersWithPosts.filter(item => {
        const coords = item.worker.coordinates;
        if (!coords || !coords.latitude || !coords.longitude) {
          return false;
        }

        const distance = calculateDistance(
          userLat,
          userLon,
          coords.latitude,
          coords.longitude
        );

        item.distance = Math.round(distance * 10) / 10;
        return distance <= maxDistance;
      });

      // Sort by distance
      filteredWorkers.sort((a, b) => a.distance - b.distance);
    }

    // Only return workers who have at least one post
    const workersWithActivePosts = filteredWorkers.filter(item => item.postCount > 0);

    console.log(`📸 Returning ${workersWithActivePosts.length} workers with active posts`);

    return res.status(200).json({
      message: "Workers with posts fetched successfully",
      workers: workersWithActivePosts,
      total: workersWithActivePosts.length,
      ...(latitude && longitude && { searchRadius: `${radius}km` })
    });

  } catch (error) {
    console.error("Error in searchWorkersWithPosts:", error);
    return res.status(500).json({ error: "Server error in fetching workers with posts" });
  }
};

/**
 * 🔓 Unlock Worker Post - Deduct 1 Credit to View Full Post Details
 * When client clicks "View Full Post", this endpoint:
 * 1. Checks if post is already unlocked (free access)
 * 2. If not unlocked, deducts 1 credit
 * 3. Returns full post details (all images, full description)
 */
export const unlockWorkerPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const clientId = req.clint._id;

    // Validate post exists
    const post = await WorkerPost.findById(postId).populate('worker', 'name email phone workType location skills bio profilePicture yearsOfExperience age');
    if (!post) {
      return res.status(404).json({ error: 'Worker post not found' });
    }

    if (post.status !== 'active') {
      return res.status(403).json({ error: 'This post is not active' });
    }

    // Get client's active subscription
    const subscription = await Subscription.findOne({
      userId: clientId,
      userType: 'Client',
      status: 'active'
    });

    if (!subscription) {
      return res.status(403).json({
        error: 'No active subscription found',
        message: 'Please purchase a plan to view worker posts'
      });
    }

    // Check if post is already unlocked
    const alreadyViewed = subscription.viewedWorkerPosts?.some(
      id => id.toString() === postId.toString()
    );

    if (alreadyViewed) {
      // Post already unlocked - return full details without deducting credit
      return res.status(200).json({
        success: true,
        message: 'Worker post already unlocked',
        alreadyUnlocked: true,
        post: {
          _id: post._id,
          title: post.title,
          description: post.description,
          images: post.images,
          skills: post.skills,
          availability: post.availability,
          expectedSalary: post.expectedSalary,
          createdAt: post.createdAt,
          worker: post.worker
        },
        subscription: {
          viewsAllowed: subscription.viewsAllowed,
          viewsUsed: subscription.viewsUsed,
          creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed
        }
      });
    }

    // Check if client has enough credits
    const creditsRemaining = subscription.viewsAllowed - subscription.viewsUsed;
    if (creditsRemaining <= 0) {
      return res.status(403).json({
        error: 'Insufficient credits',
        message: 'You have no credits left. Please purchase more credits to view worker posts.',
        creditsRemaining: 0
      });
    }

    // Deduct 1 credit
    subscription.viewsUsed += 1;

    // Add post to viewedWorkerPosts
    if (!subscription.viewedWorkerPosts) {
      subscription.viewedWorkerPosts = [];
    }
    subscription.viewedWorkerPosts.push(postId);

    // Also add worker to viewedWorkers if not already there
    if (!subscription.viewedWorkers.includes(post.worker._id)) {
      subscription.viewedWorkers.push(post.worker._id);
    }

    await subscription.save();

    console.log(`🔓 Client ${clientId} unlocked worker post ${postId} - Credit deducted`);

    return res.status(200).json({
      success: true,
      message: 'Worker post unlocked successfully! 1 credit deducted.',
      creditDeducted: true,
      post: {
        _id: post._id,
        title: post.title,
        description: post.description,
        images: post.images,
        skills: post.skills,
        availability: post.availability,
        expectedSalary: post.expectedSalary,
        createdAt: post.createdAt,
        worker: post.worker
      },
      subscription: {
        viewsAllowed: subscription.viewsAllowed,
        viewsUsed: subscription.viewsUsed,
        creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed
      }
    });

  } catch (err) {
    console.error('Error in unlockWorkerPost:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// 📍 Helper function: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Returns distance in kilometers
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Get client subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const clientId = req.clint._id;

    const subscription = await Subscription.findOne({ 
      userId: clientId, 
      userType: "Client" 
    }).populate('planId');

    if (!subscription) {
      return res.status(404).json({ 
        message: "No subscription found", 
        status: 404 
      });
    }

    // Calculate remaining credits
    const creditsRemaining = subscription.viewsAllowed - subscription.viewsUsed;
    const hasCredits = creditsRemaining > 0;

    return res.status(200).json({ 
      message: "Subscription status fetched successfully", 
      subscription: {
        planName: subscription.planName,
        status: subscription.status,
        viewsAllowed: subscription.viewsAllowed,
        viewsUsed: subscription.viewsUsed,
        creditsRemaining: creditsRemaining,
        hasCredits: hasCredits,
        price: subscription.price,
        viewedWorkers: subscription.viewedWorkers || []
      }
    });

  } catch (error) {
    console.error("Error in getSubscriptionStatus:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get all available plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({}).sort({ 'price.amount': 1 });

    return res.status(200).json({ 
      message: "Plans fetched successfully", 
      plans 
    });

  } catch (error) {
    console.error("Error in getAllPlans:", error);
    return res.status(500).json({ error: "Server error in fetching plans" });
  }
};

// Create Razorpay order for subscription
export const createSubscriptionOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const clientId = req.clint._id;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (plan.price.amount === 0) {
      return res.status(400).json({ error: "Cannot purchase free trial plan" });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.price.amount * 100, // Convert to paise
      currency: plan.price.currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        clientId: clientId.toString(),
        planId: planId.toString(),
        planName: plan.planName
      }
    });

    // Create payment record
    const payment = new Payment({
      planId: plan._id,
      userId: clientId,
      razorpayOrderId: order.id,
      paymentId: "",
      price: { 
        amount: plan.price.amount, 
        currency: plan.price.currency 
      },
      status: "PENDING"
    });

    await payment.save();

    return res.status(200).json({ 
      message: "Order created successfully",
      success: true, 
      order,
      planDetails: {
        name: plan.planName,
        duration: plan.duration,
        amount: plan.price.amount
      }
    });

  } catch (error) {
    console.error("Error in createSubscriptionOrder:", error);
    return res.status(500).json({ error: "Server error in creating order" });
  }
};

// Verify subscription payment and activate
export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpayOrderId, paymentId, signature } = req.body;
    const clientId = req.clint._id;

    console.log('=== PAYMENT VERIFICATION ===');
    console.log('Order ID:', razorpayOrderId);
    console.log('Payment ID:', paymentId);
    console.log('Client ID:', clientId);

    if (!razorpayOrderId || !paymentId || !signature) {
      console.error('Missing payment fields:', { razorpayOrderId, paymentId, signature });
      return res.status(400).json({ error: "All payment fields are required" });
    }

    // Verify payment signature
    const isValid = validatePaymentVerification(
      {
        order_id: razorpayOrderId,
        payment_id: paymentId
      },
      signature,
      process.env.RAZORPAY_KEY_SECRET
    );

    console.log('Signature valid?', isValid);

    if (!isValid) {
      console.error('Invalid payment signature');
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    // Update payment record
    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = "SUCCESS";
    await payment.save();

    // Get plan details
    const plan = await Plan.findById(payment.planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Find or create subscription
    let subscription = await Subscription.findOne({ 
      userId: clientId, 
      userType: "Client" 
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Add credits to subscription (cumulative)
    subscription.planId = plan._id;
    subscription.planName = plan.planName;
    subscription.price = { 
      amount: plan.price.amount, 
      currency: plan.price.currency 
    };
    // ADD new credits to existing credits
    subscription.viewsAllowed += plan.viewsAllowed;
    subscription.startDate = new Date();
    subscription.status = "active";
    await subscription.save();

    const newCredits = plan.viewsAllowed;
    const totalCredits = subscription.viewsAllowed - subscription.viewsUsed;

    return res.status(200).json({ 
      message: "Payment verified and credits added successfully",
      subscription: {
        planName: subscription.planName,
        creditsAdded: newCredits,
        totalCredits: totalCredits,
        viewsAllowed: subscription.viewsAllowed,
        viewsUsed: subscription.viewsUsed,
        status: subscription.status
      }
    });

  } catch (error) {
    console.error("Error in verifySubscriptionPayment:", error);
    return res.status(500).json({ error: "Server error in payment verification" });
  }
};

// Check if client has credits to view worker profiles
export const checkSubscriptionAccess = async (req, res) => {
  try {
    const clientId = req.clint._id;

    const subscription = await Subscription.findOne({ 
      userId: clientId, 
      userType: "Client" 
    });

    if (!subscription) {
      return res.status(403).json({ 
        hasAccess: false,
        creditsRemaining: 0,
        message: "No subscription found" 
      });
    }

    // Calculate remaining credits
    const creditsRemaining = subscription.viewsAllowed - subscription.viewsUsed;
    const hasCredits = creditsRemaining > 0;

    if (!hasCredits) {
      return res.status(200).json({ 
        hasAccess: false,
        creditsRemaining: 0,
        viewsUsed: subscription.viewsUsed,
        viewsAllowed: subscription.viewsAllowed,
        message: "You have used all your profile view credits. Please purchase more to continue."
      });
    }

    // Has credits available
    return res.status(200).json({ 
      hasAccess: true,
      creditsRemaining: creditsRemaining,
      viewsUsed: subscription.viewsUsed,
      viewsAllowed: subscription.viewsAllowed,
      message: "Credits available",
      subscription: {
        planName: subscription.planName,
        creditsRemaining: creditsRemaining
      }
    });

  } catch (error) {
    console.error("Error in checkSubscriptionAccess:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// View worker profile details (consumes 1 credit)
export const viewWorkerProfile = async (req, res) => {
  try {
    const { workerId } = req.params;
    const clientId = req.clint._id;

    // Check subscription
    const subscription = await Subscription.findOne({ 
      userId: clientId, 
      userType: "Client" 
    });

    if (!subscription) {
      return res.status(403).json({ 
        error: "No subscription found. Please purchase a plan to view worker profiles." 
      });
    }

    // Get worker details first
    const worker = await Worker.findById(workerId).select('-password -otp');
    
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Get worker posts
    const workerPosts = await WorkerPost.find({ worker: workerId })
      .sort({ createdAt: -1 })
      .select('title description images skills availability expectedSalary createdAt');

    // Check if this worker was already viewed (remains unlocked)
    const alreadyViewed = subscription.viewedWorkers.some(
      id => id.toString() === workerId.toString()
    );

    if (alreadyViewed) {
      // Worker already viewed - return profile without consuming credit
      return res.status(200).json({ 
        message: "Worker profile fetched successfully (already viewed)",
        worker: worker,
        posts: workerPosts,
        creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed,
        creditsUsed: 0,
        alreadyViewed: true
      });
    }

    // New worker view - check if credits available
    const creditsRemaining = subscription.viewsAllowed - subscription.viewsUsed;
    
    if (creditsRemaining <= 0) {
      return res.status(403).json({ 
        error: "No credits remaining. Please purchase more to view worker profiles.",
        creditsRemaining: 0,
        viewsUsed: subscription.viewsUsed,
        viewsAllowed: subscription.viewsAllowed
      });
    }

    // Consume 1 credit and add to viewed workers
    subscription.viewsUsed += 1;
    subscription.viewedWorkers.push(workerId);
    await subscription.save();

    return res.status(200).json({ 
      message: "Worker profile fetched successfully",
      worker: worker,
      posts: workerPosts,
      creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed,
      creditsUsed: 1,
      alreadyViewed: false
    });

  } catch (error) {
    console.error("Error in viewWorkerProfile:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// 📍 Update Client Location (Latitude/Longitude)
export const updateClientLocation = async (req, res) => {
  try {
    const clientId = req.clint._id;
    const { latitude, longitude } = req.body;

    // Validation
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: "Latitude and longitude are required" 
      });
    }

    // Validate coordinates range
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ 
        error: "Latitude must be between -90 and 90" 
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: "Longitude must be between -180 and 180" 
      });
    }

    // Update client location
    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    console.log(`📍 Client ${client.name} location updated: ${latitude}, ${longitude}`);

    return res.status(200).json({
      message: "Location updated successfully",
      coordinates: client.coordinates
    });

  } catch (error) {
    console.error("Error updating client location:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// 📸 Upload Client Profile Picture using ImageKit
export const uploadClientProfilePicture = async (req, res) => {
  try {
    const clientId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: `client_${clientId}_${Date.now()}.${req.file.mimetype.split('/')[1]}`,
      folder: '/profile_pictures/clients',
      useUniqueFileName: true
    });

    // Update client profile picture URL in database
    const client = await Client.findByIdAndUpdate(
      clientId,
      { profilePicture: uploadResponse.url },
      { new: true }
    ).select('-password');

    console.log(`📸 Client ${client.name} profile picture updated`);

    return res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: uploadResponse.url,
      client: client
    });

  } catch (error) {
    console.error("Error uploading client profile picture:", error);
    return res.status(500).json({ error: "Failed to upload profile picture" });
  }
};

// 🔑 Get ImageKit Authentication Parameters for Client
export const getImageKitAuthParams = async (req, res) => {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return res.status(200).json(authenticationParameters);
  } catch (error) {
    console.error("Error getting ImageKit auth params:", error);
    return res.status(500).json({ error: "Failed to get authentication parameters" });
  }
};

// 🖼️ Upload Client Cover Photo using ImageKit
export const uploadClientCoverPhoto = async (req, res) => {
  try {
    const clientId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: `client_cover_${clientId}_${Date.now()}.${req.file.mimetype.split('/')[1]}`,
      folder: '/cover_photos/clients',
      useUniqueFileName: true
    });

    // Update client cover photo URL in database
    const client = await Client.findByIdAndUpdate(
      clientId,
      { coverPhoto: uploadResponse.url },
      { new: true }
    ).select('-password');

    console.log(`🖼️ Client ${client.name} cover photo updated`);

    return res.status(200).json({
      message: "Cover photo uploaded successfully",
      coverPhoto: uploadResponse.url,
      client: client
    });

  } catch (error) {
    console.error("Error uploading client cover photo:", error);
    return res.status(500).json({ error: "Failed to upload cover photo" });
  }
};










