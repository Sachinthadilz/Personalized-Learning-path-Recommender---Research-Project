const mongoose = require("mongoose");

const mindMapNodeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    children: [{ label: { type: String } }],
  },
  { _id: false }
);

const noteSectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    bullets: [{ type: String }],
  },
  { _id: false }
);

const weekDaySchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    slots: [{ type: String }],
  },
  { _id: false }
);

const practiceItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * StudyMaterial – one document per user+subject combination.
 * Stores Groq-generated Mind Map, Timetable, Short Notes, and Practice Set.
 * Acts as a cache: content is regenerated after CACHE_HOURS (see controller).
 */
const studyMaterialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectName: { type: String, required: true, trim: true },
    marks: { type: Number, default: null },
    grade: { type: String, default: null },
    mindMap: {
      title: { type: String },
      nodes: { type: [mindMapNodeSchema], default: [] },
    },
    timetable: { type: [weekDaySchema], default: [] },
    notes: { type: [noteSectionSchema], default: [] },
    practiceSet: { type: [practiceItemSchema], default: [] },
    quizQuestions: { type: [quizQuestionSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Fast lookup by user + subject
studyMaterialSchema.index({ user: 1, subjectName: 1 }, { unique: true });

module.exports = mongoose.model("StudyMaterial", studyMaterialSchema);
