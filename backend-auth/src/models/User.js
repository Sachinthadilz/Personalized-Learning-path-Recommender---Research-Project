const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema
 * Defines the structure and behavior of user documents in MongoDB
 */
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 2592000, // 30 days in seconds
        },
      },
    ],
    savedLearningPaths: [
      {
        pathId: {
          type: String,
          required: true,
        },
        pathName: {
          type: String,
          required: true,
        },
        pathType: {
          type: String,
          enum: ["ai_search", "ai_generator", "manual"],
          required: true,
        },
        targetSkill: {
          type: String,
          required: true,
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
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Pre-save middleware to hash password before saving
 */
userSchema.pre("save", async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare password with hashed password
 * @param {String} candidatePassword - Password to compare
 * @returns {Promise<Boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

/**
 * Instance method to update last login timestamp
 */
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

/**
 * Instance method to add refresh token
 * @param {String} token - Refresh token to add
 */
userSchema.methods.addRefreshToken = async function (token) {
  this.refreshTokens.push({ token });

  // Keep only the last 5 refresh tokens per user
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }

  await this.save({ validateBeforeSave: false });
};

/**
 * Instance method to remove refresh token
 * @param {String} token - Refresh token to remove
 */
userSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  await this.save({ validateBeforeSave: false });
};

/**
 * Static method to find user by email with password
 * @param {String} email - User email
 * @returns {Promise<Object>} User document with password
 */
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email }).select("+password");
};

const User = mongoose.model("User", userSchema);

module.exports = User;
