const authService = require("../services/authService");
const { asyncHandler } = require("../middleware/errorHandler");

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

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
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

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};
