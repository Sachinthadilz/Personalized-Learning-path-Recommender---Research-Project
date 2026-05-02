/**
 * Migration Script: Backfill QuizBank from existing LearningPath quiz results
 *
 * This script reads completed course quiz results stored in
 * LearningPath.enrollment.courseProgress[].quizResult and writes one shared quiz
 * per course into the QuizBank collection.
 *
 * Usage:
 *   node src/migrations/migrateQuizBank.js
 *   node src/migrations/migrateQuizBank.js --overwrite
 *
 * Notes:
 * - Idempotent by default (skips existing courseKey entries)
 * - Use --overwrite to replace existing QuizBank questions with migrated ones
 */

const mongoose = require("mongoose");
const LearningPath = require("../models/LearningPath");
const QuizBank = require("../models/QuizBank");
require("dotenv").config();

function buildCourseKey(course) {
  const rawId = (course?.id || "").toString().trim();
  if (rawId) return `id:${rawId}`;

  const rawName = (course?.name || "").toString().trim().toLowerCase();
  const normalizedName = rawName
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);

  if (!normalizedName) return "";
  return `name:${normalizedName}`;
}

function normalizeQuestions(questions) {
  if (!Array.isArray(questions) || questions.length !== 5) {
    return null;
  }

  const normalized = [];
  for (const q of questions) {
    if (
      !q ||
      typeof q.question !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctAnswer !== "number" ||
      q.correctAnswer < 0 ||
      q.correctAnswer > 3
    ) {
      return null;
    }

    normalized.push({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    });
  }

  return normalized;
}

async function migrateQuizBank() {
  const overwrite = process.argv.includes("--overwrite");

  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/learning-platform";
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");

    const learningPaths = await LearningPath.find({
      "enrollment.courseProgress.quizResult.questions.0": { $exists: true },
    }).select("pathId pathName courses enrollment.courseProgress");

    console.log(
      `\nFound ${learningPaths.length} learning paths with quiz results`,
    );

    const candidatesByKey = new Map();
    let scannedCourseProgress = 0;
    let invalidQuizResults = 0;

    for (const path of learningPaths) {
      const progressList = path?.enrollment?.courseProgress || [];

      for (const progress of progressList) {
        scannedCourseProgress++;

        if (!progress?.quizResult?.questions) continue;

        const course =
          (path.courses || []).find((c) => c.id === progress.courseId) || null;
        const questions = normalizeQuestions(progress.quizResult.questions);

        if (!questions) {
          invalidQuizResults++;
          continue;
        }

        const courseKey = buildCourseKey({
          id: course?.id || progress.courseId,
          name: course?.name,
        });

        if (!courseKey) {
          invalidQuizResults++;
          continue;
        }

        const completedAt = progress.quizResult.completedAt
          ? new Date(progress.quizResult.completedAt)
          : progress.completedAt
            ? new Date(progress.completedAt)
            : new Date(0);

        const candidate = {
          courseKey,
          courseId: course?.id || progress.courseId || null,
          courseName:
            course?.name || `Course ${progress.courseId || "Unknown"}`,
          courseDescription: course?.description || "",
          difficulty: course?.difficulty || "",
          skills: Array.isArray(course?.skills) ? course.skills : [],
          questions,
          createdBy: "ai",
          sourceModel: "legacy-migration",
          completedAt,
        };

        const existing = candidatesByKey.get(courseKey);
        if (!existing || candidate.completedAt > existing.completedAt) {
          candidatesByKey.set(courseKey, candidate);
        }
      }
    }

    const candidates = Array.from(candidatesByKey.values());
    console.log(
      `Collected ${candidates.length} unique course quizzes from legacy data`,
    );

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of candidates) {
      try {
        const existing = await QuizBank.findOne({ courseKey: item.courseKey });

        if (existing && !overwrite) {
          skipped++;
          continue;
        }

        if (existing && overwrite) {
          await QuizBank.updateOne(
            { courseKey: item.courseKey },
            {
              $set: {
                courseId: item.courseId,
                courseName: item.courseName,
                courseDescription: item.courseDescription,
                difficulty: item.difficulty,
                skills: item.skills,
                questions: item.questions,
                createdBy: "admin",
                sourceModel: "legacy-migration-overwrite",
                lastEditedBy: null,
              },
            },
          );
          updated++;
          continue;
        }

        await QuizBank.create({
          courseKey: item.courseKey,
          courseId: item.courseId,
          courseName: item.courseName,
          courseDescription: item.courseDescription,
          difficulty: item.difficulty,
          skills: item.skills,
          questions: item.questions,
          createdBy: item.createdBy,
          sourceModel: item.sourceModel,
        });

        inserted++;
      } catch (error) {
        errors++;
        console.error(
          `✗ Failed migrating quiz for key ${item.courseKey}:`,
          error.message,
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("QuizBank Migration Summary:");
    console.log(`  Scanned course progress: ${scannedCourseProgress}`);
    console.log(`  Invalid quiz results:    ${invalidQuizResults}`);
    console.log(`  Unique candidates:       ${candidates.length}`);
    console.log(`  Inserted:                ${inserted}`);
    console.log(`  Updated:                 ${updated}`);
    console.log(`  Skipped:                 ${skipped}`);
    console.log(`  Errors:                  ${errors}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n✗ QuizBank migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("\n✓ Database connection closed");
  }
}

(async () => {
  console.log("=".repeat(60));
  console.log("QuizBank Backfill Migration");
  console.log("=".repeat(60));
  await migrateQuizBank();
})();
