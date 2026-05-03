const authService = require("../services/authService");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const User = require("../models/User");
const crypto = require("crypto");
const { sendPasswordResetEmail, sendVerificationEmail } = require("../services/emailService");

/**
 * Authentication Controller
 * Handles HTTP requests and responses for authentication
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const result = await authService.register({
    firstName,
    lastName,
    email,
    password,
  });

  // Don't return tokens on registration - user must login separately
  res.status(201).json({
    success: true,
    message: "Account created successfully. Please log in to continue.",
    data: {
      user: result.user,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshToken(refreshToken);

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: result,
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { refreshToken } = req.body;

  const result = await authService.logout(userId, refreshToken);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await authService.getProfile(userId);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName } = req.body;

  const result = await authService.updateProfile(userId, {
    firstName,
    lastName,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  const result = await authService.changePassword(
    userId,
    currentPassword,
    newPassword,
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address via token in URL
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // Step 1: Try to find a user with this token (ignore expiry for now)
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
  });

  // Step 2: If no user found, the token was already used or is invalid
  if (!user) {
    // Check if any user was already verified with this token (token cleared after use)
    // We can't know which user it was, so give a helpful generic message
    throw new AppError(
      "This verification link has already been used or is invalid. If you already verified your email, you're all set!",
      400,
    );
  }

  // Step 3: If user is already verified (edge case: concurrent requests)
  if (user.isEmailVerified) {
    // Clean up leftover token
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Your email is already verified!",
    });
  }

  // Step 4: Check if the token has expired
  if (user.emailVerificationExpires < Date.now()) {
    // Clear the expired token
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(
      "This verification link has expired. Please request a new one from your profile.",
      400,
    );
  }

  // Step 5: Valid token — verify the user
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Email verified successfully!",
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Failed to send password reset email. Please try again later.", 500);
  }

  res.status(200).json({
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
  });
});

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token from email
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // Step 1: Try to find a user with this token (ignore expiry for now)
  const user = await User.findOne({
    passwordResetToken: hashedToken,
  });

  // Step 2: If no user found, the token was already used or is invalid
  if (!user) {
    throw new AppError(
      "This password reset link has already been used or is invalid. Please request a new one.",
      400,
    );
  }

  // Step 3: Check if the token has expired
  if (user.passwordResetExpires < Date.now()) {
    // Clear the expired token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(
      "This password reset link has expired. Please request a new one.",
      400,
    );
  }

  // Step 4: Valid token — reset the password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Clear all refresh tokens for security
  user.refreshTokens = [];
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password has been reset successfully. Please log in with your new password.",
  });
});

/**
 * @route   POST /api/auth/request-verification
 * @desc    Request a new email verification link (for logged-in user)
 * @access  Private
 */
const requestVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // If already verified, don't throw error, just inform them
  if (user.isEmailVerified) {
    return res.status(200).json({
      success: true,
      message: "Your email is already verified.",
    });
  }

  const token = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationEmail(user, token);
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Failed to send verification email. Please try again later.", 500);
  }

  res.status(200).json({
    success: true,
    message: "Verification email sent. Please check your inbox.",
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  forgotPassword,
  resetPassword,
  requestVerification,
};
