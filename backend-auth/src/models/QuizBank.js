const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: "Each quiz question must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
  },
  { _id: false },
);

const quizBankSchema = new mongoose.Schema(
  {
    courseKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    courseId: {
      type: String,
      index: true,
      default: null,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    courseDescription: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    questions: {
      type: [quizQuestionSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 5,
        message: "A quiz must have exactly 5 questions",
      },
    },
    createdBy: {
      type: String,
      enum: ["ai", "admin"],
      default: "ai",
    },
    sourceModel: {
      type: String,
      default: "",
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

quizBankSchema.index({ courseName: "text", courseDescription: "text" });

module.exports = mongoose.model("QuizBank", quizBankSchema);
