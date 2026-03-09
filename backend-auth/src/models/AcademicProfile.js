const mongoose = require("mongoose");

/**
 * Sub-schema: a weak subject entered by the user (academic profile)
 */
const weakSubjectSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    grade: { type: String, enum: ["A", "B", "C", "D", "E", "F"], default: "F" },
    marks: { type: Number, min: 0, max: 100, required: true },
  },
  { _id: false }
);

/**
 * Sub-schema: a single university module chosen by the user
 */
const moduleSchema = new mongoose.Schema(
  {
    moduleId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Module name is required"],
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, "Credit value is required"],
      min: [1, "Credits must be at least 1"],
      max: [30, "Credits cannot exceed 30"],
    },
  },
  { _id: false }
);

/**
 * AcademicProfile schema — one document per user
 * Stores the user's university and chosen modules.
 * Kept separate from User so User stays lightweight.
 */
const academicProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    university: {
      type: String,
      required: [true, "University name is required"],
      trim: true,
    },
    degree: {
      type: String,
      trim: true,
      default: "",
    },
    yearOfStudy: {
      type: Number,
      min: 1,
      max: 8,
      default: 1,
    },
    modules: {
      type: [moduleSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "At least one module is required",
      },
    },
    weakSubjects: {
      type: [weakSubjectSchema],
      default: [],
    },
    onboardingCompleted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One profile per user
academicProfileSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("AcademicProfile", academicProfileSchema);
