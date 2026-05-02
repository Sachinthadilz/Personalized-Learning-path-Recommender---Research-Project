/**
 * Cleanup Script: Remove savedLearningPaths from User documents
 * 
 * This script removes the old savedLearningPaths array from User documents
 * after successful migration to the LearningPath collection.
 * 
 * ⚠️  WARNING: This is a destructive operation! 
 *    Run this ONLY AFTER verifying the migration was successful.
 * 
 * Usage:
 *   node src/migrations/cleanupUserLearningPaths.js
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const LearningPath = require("../models/LearningPath");
const readline = require("readline");
require("dotenv").config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function cleanupUserLearningPaths() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/learning-platform";
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");

    // Count users with savedLearningPaths
    const usersWithPaths = await User.countDocuments({
      savedLearningPaths: { $exists: true, $ne: [] },
    });

    console.log(`\nFound ${usersWithPaths} users with savedLearningPaths data`);

    if (usersWithPaths === 0) {
      console.log("No cleanup needed - all users already cleaned up.");
      return;
    }

    // Verify migration completed
    const totalLearningPaths = await LearningPath.countDocuments();
    console.log(`Total learning paths in new collection: ${totalLearningPaths}`);

    // Ask for confirmation
    console.log("\n" + "⚠️ ".repeat(30));
    console.log("WARNING: This will permanently delete savedLearningPaths from User documents!");
    console.log("Make sure you have:");
    console.log("  1. Successfully run the migration (migrateLearningPaths.js)");
    console.log("  2. Verified all data is in the LearningPath collection");
    console.log("  3. Tested your application with the new schema");
    console.log("⚠️ ".repeat(30) + "\n");

    const answer = await askQuestion("Are you sure you want to proceed? (yes/no): ");

    if (answer.toLowerCase() !== "yes") {
      console.log("\n✓ Cleanup cancelled - no changes made");
      return;
    }

    const confirmAnswer = await askQuestion(
      "\nType 'DELETE' to confirm you want to remove savedLearningPaths: "
    );

    if (confirmAnswer !== "DELETE") {
      console.log("\n✓ Cleanup cancelled - no changes made");
      return;
    }

    console.log("\n⏳ Removing savedLearningPaths from User documents...");

    // Remove savedLearningPaths field from all users
    const result = await User.updateMany(
      { savedLearningPaths: { $exists: true } },
      { $unset: { savedLearningPaths: "" } }
    );

    console.log("\n" + "=".repeat(60));
    console.log("Cleanup Summary:");
    console.log(`  ✓ Modified: ${result.modifiedCount} user documents`);
    console.log(`  ✓ Matched:  ${result.matchedCount} user documents`);
    console.log("=".repeat(60));

    // Verify cleanup
    const remainingUsers = await User.countDocuments({
      savedLearningPaths: { $exists: true, $ne: [] },
    });

    if (remainingUsers === 0) {
      console.log("\n✓ Cleanup completed successfully!");
      console.log("  All savedLearningPaths data has been removed from User documents.");
    } else {
      console.log(`\n⚠️  Warning: ${remainingUsers} users still have savedLearningPaths data`);
    }

  } catch (error) {
    console.error("\n✗ Cleanup failed:", error);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log("\n✓ Database connection closed");
  }
}

// Self-invoking async function
(async () => {
  console.log("=".repeat(60));
  console.log("User Learning Paths Cleanup Script");
  console.log("=".repeat(60));
  
  await cleanupUserLearningPaths();
  
  process.exit(0);
})();
