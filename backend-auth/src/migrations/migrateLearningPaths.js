/**
 * Migration Script: Move savedLearningPaths from User to LearningPath collection
 * 
 * This script migrates existing learning path data from the User.savedLearningPaths
 * embedded array to the new separate LearningPath collection for better performance.
 * 
 * Usage:
 *   node src/migrations/migrateLearningPaths.js
 * 
 * The script is idempotent - it can be run multiple times safely.
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const LearningPath = require("../models/LearningPath");
require("dotenv").config();

async function migrateLearningPaths() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/learning-platform";
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");

    // Find all users with saved learning paths
    const users = await User.find({ savedLearningPaths: { $exists: true, $ne: [] } });
    
    console.log(`\nFound ${users.length} users with saved learning paths`);

    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const user of users) {
      if (!user.savedLearningPaths || user.savedLearningPaths.length === 0) {
        continue;
      }

      console.log(`\nProcessing user: ${user.email} (${user.savedLearningPaths.length} paths)`);

      for (const path of user.savedLearningPaths) {
        try {
          // Check if this path already exists in LearningPath collection
          const existingPath = await LearningPath.findOne({
            userId: user._id,
            pathId: path.pathId,
          });

          if (existingPath) {
            console.log(`  ⊘ Skipping path "${path.pathName}" - already migrated`);
            totalSkipped++;
            continue;
          }

          // Create new LearningPath document
          const newPath = new LearningPath({
            userId: user._id,
            pathId: path.pathId,
            pathName: path.pathName,
            pathType: path.pathType,
            targetSkill: path.targetSkill,
            courses: path.courses || [],
            metadata: path.metadata || {},
            enrollment: path.enrollment || {
              isEnrolled: false,
              courseProgress: [],
            },
            createdAt: path.createdAt || new Date(),
          });

          await newPath.save();
          console.log(`  ✓ Migrated path "${path.pathName}"`);
          totalMigrated++;
        } catch (error) {
          console.error(`  ✗ Error migrating path "${path.pathName}":`, error.message);
          totalErrors++;
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Migration Summary:");
    console.log(`  ✓ Migrated: ${totalMigrated} learning paths`);
    console.log(`  ⊘ Skipped:  ${totalSkipped} (already existed)`);
    console.log(`  ✗ Errors:   ${totalErrors}`);
    console.log("=".repeat(60));

    if (totalMigrated > 0) {
      console.log("\n⚠️  IMPORTANT: The savedLearningPaths data is still in User documents.");
      console.log("   After verifying the migration, you can remove it by running:");
      console.log("   node src/migrations/cleanupUserLearningPaths.js");
    }

  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n✓ Database connection closed");
  }
}

// Self-invoking async function
(async () => {
  console.log("=".repeat(60));
  console.log("Learning Paths Migration Script");
  console.log("=".repeat(60));
  
  await migrateLearningPaths();
  
  console.log("\n✓ Migration completed successfully!");
  process.exit(0);
})();
