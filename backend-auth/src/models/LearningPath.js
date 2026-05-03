const mongoose = require("mongoose");

/**
 * Learning Path Schema
 * Separated from User schema to improve performance and scalability
 * Each learning path is stored as a separate document
 */
const learningPathSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for fast user queries
    },
    pathId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Index for fast lookups by pathId
    },
    pathName: {
      type: String,
      required: [true, "Path name is required"],
      trim: true,
      maxlength: [200, "Path name cannot exceed 200 characters"],
    },
    pathType: {
      type: String,
      enum: ["ai_search", "ai_generator", "manual"],
      required: [true, "Path type is required"],
    },
    targetSkill: {
      type: String,
      required: [true, "Target skill is required"],
      trim: true,
      maxlength: [100, "Target skill cannot exceed 100 characters"],
    },
    courses: [
      {
        id: String,
        name: String,
        description: String,
        rating: Number,
        url: String,
        university: String,
        difficulty: String,
        skills: [String],
        similarity_score: Number, // For AI search results
      },
    ],
    metadata: {
      difficulty: String,
      totalCourses: Number,
      avgRating: Number,
      estimatedDuration: String,
    },
    enrollment: {
      isEnrolled: {
        type: Boolean,
        default: false,
        index: true, // Index for filtering enrolled paths
      },
      enrolledAt: Date,
      currentCourseIndex: {
        type: Number,
        default: 0,
      },
      courseProgress: [
        {
          courseId: String,
          status: {
            type: String,
            enum: ["locked", "unlocked", "completed"],
            default: "locked",
          },
          completedAt: Date,
          quizResult: {
            score: Number,
            totalQuestions: {
              type: Number,
              default: 5,
            },
            percentage: Number,
            questions: [
              {
                question: String,
                options: [String],
                correctAnswer: Number,
                userAnswer: Number,
                isCorrect: Boolean,
              },
            ],
            completedAt: Date,
          },
        },
      ],
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Compound index for efficient user + pathId queries
learningPathSchema.index({ userId: 1, pathId: 1 });

// Index for filtering enrolled paths by user
learningPathSchema.index({ userId: 1, "enrollment.isEnrolled": 1 });

// Index for sorting by creation date
learningPathSchema.index({ userId: 1, createdAt: -1 });

/**
 * Static method to find all learning paths for a user
 * @param {String} userId - User ID
 * @param {Object} options - Query options (sort, limit, select)
 * @returns {Promise<Array>} Array of learning paths
 */
learningPathSchema.statics.findByUser = function (userId, options = {}) {
  const query = this.find({ userId });

  if (options.enrolled !== undefined) {
    query.where({ "enrollment.isEnrolled": options.enrolled });
  }

  if (options.select) {
    query.select(options.select);
  }

  if (options.sort) {
    query.sort(options.sort);
  } else {
    query.sort({ createdAt: -1 }); // Default: newest first
  }

  if (options.limit) {
    query.limit(options.limit);
  }

  return query.exec();
};

/**
 * Static method to find a specific learning path
 * @param {String} userId - User ID
 * @param {String} pathId - Path ID
 * @returns {Promise<Object>} Learning path document
 */
learningPathSchema.statics.findByUserAndPath = function (userId, pathId) {
  return this.findOne({ userId, pathId });
};

/**
 * Instance method to enroll in the learning path
 * Unlocks the first course and locks all others
 */
learningPathSchema.methods.enroll = function () {
  if (this.enrollment.isEnrolled) {
    throw new Error("Already enrolled in this path");
  }

  const courseProgress = this.courses.map((course, idx) => ({
    courseId: course.id,
    status: idx === 0 ? "unlocked" : "locked",
  }));

  this.enrollment = {
    isEnrolled: true,
    enrolledAt: new Date(),
    currentCourseIndex: 0,
    courseProgress,
  };

  return this.save();
};

/**
 * Instance method to unenroll from the learning path
 * Resets all progress
 */
learningPathSchema.methods.unenroll = function () {
  this.enrollment = {
    isEnrolled: false,
    courseProgress: [],
  };

  return this.save();
};

/**
 * Instance method to get course progress
 * @param {String} courseId - Course ID
 * @returns {Object} Course progress object
 */
learningPathSchema.methods.getCourseProgress = function (courseId) {
  if (!this.enrollment.isEnrolled) {
    throw new Error("Not enrolled in this path");
  }

  return this.enrollment.courseProgress.find((cp) => cp.courseId === courseId);
};

/**
 * Instance method to update course progress
 * @param {String} courseId - Course ID
 * @param {Object} updates - Progress updates
 */
learningPathSchema.methods.updateCourseProgress = function (courseId, updates) {
  if (!this.enrollment.isEnrolled) {
    throw new Error("Not enrolled in this path");
  }

  const progressIdx = this.enrollment.courseProgress.findIndex(
    (cp) => cp.courseId === courseId,
  );

  if (progressIdx === -1) {
    throw new Error("Course progress not found");
  }

  Object.assign(this.enrollment.courseProgress[progressIdx], updates);

  return this.save();
};

/**
 * Instance method to complete a course and unlock the next one
 * @param {String} courseId - Course ID
 * @param {Object} quizResult - Quiz result data
 */
learningPathSchema.methods.completeCourse = function (courseId, quizResult) {
  if (!this.enrollment.isEnrolled) {
    throw new Error("Not enrolled in this path");
  }

  const progressIdx = this.enrollment.courseProgress.findIndex(
    (cp) => cp.courseId === courseId,
  );

  if (progressIdx === -1) {
    throw new Error("Course progress not found");
  }

  const progress = this.enrollment.courseProgress[progressIdx];

  if (progress.status !== "unlocked") {
    throw new Error("Course is not in unlocked state");
  }

  // Mark current course as completed
  progress.status = "completed";
  progress.completedAt = new Date();
  progress.quizResult = quizResult;

  // Unlock next course if exists
  const nextIdx = progressIdx + 1;
  if (nextIdx < this.enrollment.courseProgress.length) {
    this.enrollment.courseProgress[nextIdx].status = "unlocked";
    this.enrollment.currentCourseIndex = nextIdx;
  }

  return this.save();
};

const LearningPath = mongoose.model("LearningPath", learningPathSchema);

module.exports = LearningPath;
