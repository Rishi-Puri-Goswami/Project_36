import mongoose from "mongoose";
import { Plan } from "./models/planes_model.js";
import dotenv from "dotenv";

dotenv.config();

const seedPlans = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if plans already exist
    const existingPlans = await Plan.find({});
    
    if (existingPlans.length > 0) {
      console.log("Plans already exist in database:");
      existingPlans.forEach(plan => {
        console.log(`- ${plan.planName}: ${plan.viewsAllowed} views, ₹${plan.price.amount}`);
      });
      
      const userInput = await new Promise((resolve) => {
        process.stdout.write("\nDo you want to recreate plans? (yes/no): ");
        process.stdin.once('data', (data) => {
          resolve(data.toString().trim().toLowerCase());
        });
      });

      if (userInput !== 'yes') {
        console.log("Seed cancelled.");
        process.exit(0);
      }

      // Delete existing plans
      await Plan.deleteMany({});
      console.log("Deleted existing plans");
    }

    // Create plans based on PROFILE VIEW CREDITS model
    // Clients can see workers but need credits to view details
    const plans = [
      {
        planName: "Free Trial",
        duration: 0, // No time limit, credit-based
        viewsAllowed: 10, // 10 worker profile views
        price: {
          amount: 0,
          currency: "INR"
        },
        planType: "free_trial",
        description: "Free trial - View 10 worker profiles with full details"
      },
      {
        planName: "20 Profile Views",
        duration: 0,
        viewsAllowed: 20,
        price: {
          amount: 100,
          currency: "INR"
        },
        planType: "credit_pack",
        description: "₹100 for 20 worker profile views with contact details"
      },
      {
        planName: "40 Profile Views",
        duration: 0,
        viewsAllowed: 40,
        price: {
          amount: 200,
          currency: "INR"
        },
        planType: "credit_pack",
        description: "₹200 for 40 worker profile views - Popular choice"
      },
      {
        planName: "80 Profile Views",
        duration: 0,
        viewsAllowed: 80,
        price: {
          amount: 500,
          currency: "INR"
        },
        planType: "credit_pack",
        description: "₹500 for 80 worker profile views - Best value"
      },
      {
        planName: "150 Profile Views",
        duration: 0,
        viewsAllowed: 150,
        price: {
          amount: 1000,
          currency: "INR"
        },
        planType: "credit_pack",
        description: "₹1000 for 150 worker profile views - Premium pack"
      }
    ];

    const createdPlans = await Plan.insertMany(plans);
    
    console.log("\n✅ Plans seeded successfully:");
    createdPlans.forEach(plan => {
      console.log(`- ${plan.planName}: ${plan.viewsAllowed} profile views, ₹${plan.price.amount}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding plans:", error);
    process.exit(1);
  }
};

seedPlans();
