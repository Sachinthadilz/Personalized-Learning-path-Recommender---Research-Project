const mongoose = require("mongoose");

/**
 * Mongoose schema for student activity events.
 *
 * Mirrors the FastAPI `ActivityLogEntry` Pydantic model so documents
 * forwarded from the Python backend are stored without transformation.
 */
const activityLogSchema = new mongoose.Schema(
  {
    log_id: {
      type: String,
      index: true,
    },
    student_id: {
      type: String,
      ref: "User",
      required: [true, "student_id is required"],
      index: true,
    },
    course_id: {
      type: String,
      required: [true, "course_id is required"],
      index: true,
    },
    event_type: {
      type: String,
      required: [true, "event_type is required"],
      enum: [
        "click",
        "video_play",
        "video_pause",
        "video_complete",
        "resource_download",
        "resource_view",
        "forum_post",
        "forum_view",
        "assessment_start",
        "assessment_submit",
        "quiz_attempt",
        "login",
        "logout",
      ],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    duration: {
      type: Number,
      default: null,
    },
    page_url: {
      type: String,
      default: null,
    },
    session_id: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for the most common query: "all events for a student, newest first"
activityLogSchema.index({ student_id: 1, timestamp: -1 });

// Explicit collection name so it matches the Motor reader in FastAPI
module.exports = mongoose.model("ActivityLog", activityLogSchema, "activity_logs");
