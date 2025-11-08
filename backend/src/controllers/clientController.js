import { ClientPost } from "../models/client_post_model.js";
import { Payment } from "../models/payment_model.js";
import { Client } from "../models/client_models.js";
import { Worker } from "../models/worker_model.js";
import jwt from "jsonwebtoken";
import { Subscription } from "../models/subscription_model.js";
import  razorpay  from "../config/razorpay.js";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { Plan } from "../models/planes_model.js";
import { sendOtpSms } from "../utils/smsService.js";

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

        const freePlan = await Plan.findOne({ planName: "Free" });

        if (!freePlan) {
            return res.status(500).json({ message: "Free plan not found, contact support", status: 500 });
        }

        const createSubscription = new Subscription({
            userId: clint._id,
            planId : freePlan._id,
            userType: "Client",
            viewsAllowed: freePlan.viewsAllowed,
            viewsUsed: 0,
            startDate: new Date(),
            status: "active"
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

    // Check password (Note: You should use bcrypt to hash passwords in production)
    if (client.password !== password) {
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
        profilePicture: client.profilePicture
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


export const workerApplication = async (req, res) => {
  try {

    const {postId} = req.params ;

    if(!postId){
        return res.status(400).json({error : "postId is required"});
    }

    const post = await ClientPost.findById(postId).populate('workerApplications');
    if(!post){
        return res.status(404).json({error : "post not found"});
    }


    const applications = post.workerApplications;

    return res.status(200).json({message : "applications fetched successfully" , applications });
    


  } catch (err) {
    console.error(err);
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
    const { workType, numberOfWorkers, location, salaryRange, description, contactNumber, validityDays } = req.body;

    // Get client ID from JWT token
    const clientId = req.clint._id;

    if (!workType || !location || !description) {
      return res.status(400).json({ message: "Work type, location, and description are required" });
    }

    // Create new job post
    const jobPost = new ClientPost({
      clientId,
      workType,
      numberOfWorkers: numberOfWorkers || 1,
      location,
      salaryRange,
      description,
      contactNumber,
      validityDays: validityDays || 15,
      paidVisibility: false
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
    const { workType, numberOfWorkers, location, salaryRange, description, contactNumber, validityDays } = req.body;

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
export const getAllAvailableJobs = async (req, res) => {
  try {
    const { workType, location, salaryRange, search } = req.query;

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

    const jobs = await ClientPost.find(filter)
      .populate('clientId', 'name companyName email phone')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ 
      message: "Jobs fetched successfully", 
      jobs 
    });

  } catch (error) {
    console.error("Error in getAllAvailableJobs controller:", error);
    return res.status(500).json({ error: "Server error in fetching jobs" });
  }
};

// Get all available workers for clients (public route for searching workers)
export const getAllAvailableWorkers = async (req, res) => {
  try {
    const { workType, location, search } = req.query;

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

    const workers = await Worker.find(filter)
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ 
      message: "Workers fetched successfully", 
      workers 
    });

  } catch (error) {
    console.error("Error in getAllAvailableWorkers controller:", error);
    return res.status(500).json({ error: "Server error in fetching workers" });
  }
};





