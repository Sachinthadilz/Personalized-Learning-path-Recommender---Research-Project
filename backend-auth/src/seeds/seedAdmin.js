/**
 * Seed Script: Create Default Admin User
 *
 * This script creates a default admin user in the database.
 *
 * Usage:
 *   npm run seed:admin
 *   or
 *   node src/seeds/seedAdmin.js
 *
 * Default credentials:
 *   Email: admin@learningplatform.com
 *   Password: Admin@12345 (change this in production!)
 */

const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

async function seedAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/learning-platform";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: "admin@learningplatform.com",
    });

    if (existingAdmin) {
      console.log("Admin user already exists. Skipping seed.");
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminUser = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@learningplatform.com",
      password: "Admin@12345", // Change this in production!
      role: "admin",
      isEmailVerified: true,
      isActive: true,
    });

    await adminUser.save();
    console.log("Admin user created successfully!");
    console.log("  Email: admin@learningplatform.com");
    console.log("  Password: Admin@12345");
    console.log("\n IMPORTANT: Change the default password in production!");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding admin user:", error.message);
    process.exit(1);
  }
}

seedAdmin();
