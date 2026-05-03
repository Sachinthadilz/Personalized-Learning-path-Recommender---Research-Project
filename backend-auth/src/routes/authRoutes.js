const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  validate,
} = require("../middleware/validation");
const { body } = require("express-validator");

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication Routes
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  authLimiter,
  registerValidation,
  validate,
  authController.register,
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 */
router.post(
  "/login",
  authLimiter,
  loginValidation,
  validate,
  authController.login,
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address via token
 * @access  Public
 */
router.get("/verify-email/:token", authLimiter, authController.verifyEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  authController.forgotPassword,
);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token from email
 * @access  Public
 */
router.post(
  "/reset-password/:token",
  authLimiter,
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  authController.resetPassword,
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  "/refresh-token",
  authLimiter,
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validate,
  authController.refreshToken,
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  "/profile",
  authenticate,
  [
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
  ],
  validate,
  authController.updateProfile,
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword,
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid (useful for frontend)
 * @access  Private
 */
router.get("/verify", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    valid: true,
    user: req.user,
  });
});

/**
 * @route   POST /api/auth/request-verification
 * @desc    Request a new email verification link
 * @access  Private
 */
router.post(
  "/request-verification",
  authLimiter,
  authenticate,
  authController.requestVerification,
);

module.exports = router;
