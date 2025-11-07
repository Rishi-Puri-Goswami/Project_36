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

    // Create plans
    const plans = [
      {
        planName: "Free",
        viewsAllowed: 10,
        price: {
          amount: 0,
          currency: "INR"
        }
      },
      {
        planName: "Starter",
        viewsAllowed: 50,
        price: {
          amount: 499,
          currency: "INR"
        }
      },
      {
        planName: "Pro",
        viewsAllowed: 200,
        price: {
          amount: 1499,
          currency: "INR"
        }
      }
    ];

    const createdPlans = await Plan.insertMany(plans);
    
    console.log("\n✅ Plans seeded successfully:");
    createdPlans.forEach(plan => {
      console.log(`- ${plan.planName}: ${plan.viewsAllowed} views, ₹${plan.price.amount}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding plans:", error);
    process.exit(1);
  }
};

seedPlans();
