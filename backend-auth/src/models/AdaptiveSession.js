const mongoose = require("mongoose");

const subjectPerformanceSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    confidence: { type: Number, required: true, min: 1, max: 5 },
    marks:      { type: Number, min: 0, max: 100, default: null },
    grade:      { type: String, default: "" },
    isWeak:     { type: Boolean, default: false },
  },
  { _id: false }
);

const quizResultSchema = new mongoose.Schema(
  {
    subjectId: { type: String, required: true },
    score:     { type: Number, required: true, min: 0 },
    total:     { type: Number, required: true, min: 1 },
    band:      { type: String, enum: ["A", "B", "C", "D"], required: true },
    takenAt:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const adaptiveSessionSchema = new mongoose.Schema(
  {
    user:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentWeek:      { type: Number, default: 1, min: 1 },
    weeklySubjects:   { type: [subjectPerformanceSchema], default: [] },
    quizHistory:      { type: [quizResultSchema], default: [] },
    retryCount:       { type: Map, of: Number, default: {} },
    masteredSubjects: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdaptiveSession", adaptiveSessionSchema);
