const User = require("../models/User");
const QuizBank = require("../models/QuizBank");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const quizService = require("../services/quizService");

/**
 * Admin Controller
 * All routes require authenticate + authorize("admin") middleware.
 */

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Admin only
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  // Optional search by name / email
  const search = req.query.search ? req.query.search.trim() : "";
  const filter = search
    ? {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshTokens")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get a single user by ID
 * @access  Admin only
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -refreshTokens",
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({ success: true, data: user });
});

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Update a user's role
 * @access  Admin only
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const VALID_ROLES = ["user", "admin", "moderator"];
  if (!VALID_ROLES.includes(role)) {
    throw new AppError(`Role must be one of: ${VALID_ROLES.join(", ")}`, 400);
  }

  // Prevent admin from demoting themselves
  if (req.params.id === req.user.id.toString()) {
    throw new AppError("You cannot change your own role", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true },
  ).select("-password -refreshTokens");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: user,
  });
});

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Activate or deactivate a user account
 * @access  Admin only
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    throw new AppError("isActive must be a boolean", 400);
  }

  if (req.params.id === req.user.id.toString()) {
    throw new AppError("You cannot change your own account status", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true },
  ).select("-password -refreshTokens");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    message: `User account ${isActive ? "activated" : "deactivated"}`,
    data: user,
  });
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Permanently delete a user
 * @access  Admin only
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id.toString()) {
    throw new AppError("You cannot delete your own account", 400);
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform-wide user statistics
 * @access  Admin only
 */
const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, verifiedUsers, roleCounts] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isEmailVerified: true }),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);

  // Recent registrations (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const roleBreakdown = Object.fromEntries(
    roleCounts.map((r) => [r._id, r.count]),
  );

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      verifiedUsers,
      newUsersThisMonth,
      roleBreakdown,
    },
  });
});

/**
 * @route   GET /api/admin/me
 * @desc    Return the current admin user's full profile
 * @access  Admin only
 */
const getCurrentAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "-password -refreshTokens",
  );

  if (!user) {
    throw new AppError("Admin user not found", 404);
  }

  res.status(200).json({ success: true, data: user });
});

/**
 * @route   GET /api/admin/quizzes
 * @desc    List quiz bank entries with pagination and optional search
 * @access  Admin only
 */
const getQuizBank = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";

  const filter = search
    ? {
        $or: [
          { courseName: { $regex: search, $options: "i" } },
          { courseId: { $regex: search, $options: "i" } },
          { courseDescription: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [quizzes, total] = await Promise.all([
    QuizBank.find(filter)
      .select(
        "courseKey courseId courseName difficulty skills createdBy sourceModel updatedAt createdAt",
      )
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    QuizBank.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      quizzes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @route   GET /api/admin/quizzes/:quizId
 * @desc    Get full quiz details including questions
 * @access  Admin only
 */
const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await QuizBank.findById(req.params.quizId);
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  res.status(200).json({ success: true, data: quiz });
});

/**
 * @route   PATCH /api/admin/quizzes/:quizId
 * @desc    Update quiz metadata/questions manually
 * @access  Admin only
 */
const updateQuiz = asyncHandler(async (req, res) => {
  const { courseName, courseDescription, difficulty, skills, questions } =
    req.body;

  const quiz = await QuizBank.findById(req.params.quizId);
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  if (courseName !== undefined) {
    if (typeof courseName !== "string" || !courseName.trim()) {
      throw new AppError("courseName must be a non-empty string", 400);
    }
    quiz.courseName = courseName.trim();
  }

  if (courseDescription !== undefined) {
    if (typeof courseDescription !== "string") {
      throw new AppError("courseDescription must be a string", 400);
    }
    quiz.courseDescription = courseDescription;
  }

  if (difficulty !== undefined) {
    if (typeof difficulty !== "string") {
      throw new AppError("difficulty must be a string", 400);
    }
    quiz.difficulty = difficulty;
  }

  if (skills !== undefined) {
    if (!Array.isArray(skills) || skills.some((s) => typeof s !== "string")) {
      throw new AppError("skills must be an array of strings", 400);
    }
    quiz.skills = skills;
  }

  if (questions !== undefined) {
    quizService.validateQuestions(questions);
    quiz.questions = questions;
  }

  quiz.createdBy = "admin";
  quiz.lastEditedBy = req.user.id;
  await quiz.save();

  res.status(200).json({
    success: true,
    message: "Quiz updated successfully",
    data: quiz,
  });
});

/**
 * @route   DELETE /api/admin/quizzes/:quizId
 * @desc    Permanently delete a quiz bank entry
 * @access  Admin only
 */
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await QuizBank.findByIdAndDelete(req.params.quizId);
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Quiz deleted successfully",
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getStats,
  getCurrentAdmin,
  getQuizBank,
  getQuizById,
  updateQuiz,
  deleteQuiz,
};
