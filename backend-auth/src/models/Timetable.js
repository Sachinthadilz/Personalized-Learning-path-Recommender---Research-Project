const mongoose = require("mongoose");

/**
 * Sub-schema: a single subject allocation within a day
 */
const allocationSchema = new mongoose.Schema(
  {
    subject_id: { type: String, required: true },
    subject_name: { type: String, required: true },
    planned_hours: { type: Number, required: true },
    completed_hours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["planned", "in_progress", "completed", "missed"],
      default: "planned",
    },
  },
  { _id: false }
);

/**
 * Sub-schema: one day of the timetable
 */
const dailyTimetableSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },       // "YYYY-MM-DD"
    day_of_week: { type: String, required: true },
    total_hours_available: { type: Number, required: true },
    allocations: [allocationSchema],
    total_planned: { type: Number, default: 0 },
    total_completed: { type: Number, default: 0 },
    is_locked: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Main Timetable schema — one document per user timetable session
 */
const timetableSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    student_id: { type: String, required: true },
    name: { type: String, default: "Student" },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    subjects: { type: Array, default: [] },
    days: [dailyTimetableSchema],
  },
  {
    timestamps: true,
  }
);

// One timetable per user (can regenerate — replaces existing)
timetableSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("Timetable", timetableSchema);
