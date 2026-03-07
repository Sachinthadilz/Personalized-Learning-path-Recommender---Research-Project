const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");

// All admin routes require a valid JWT AND the "admin" role
router.use(authenticate, authorize("admin"));

/**
 * @route   GET /api/admin/me
 * @desc    Get current admin profile
 */
router.get("/me", adminController.getCurrentAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Platform-wide user statistics
 */
router.get("/stats", adminController.getStats);

/**
 * @route   GET /api/admin/users
 * @desc    List all users  (supports ?page=1&limit=20&search=)
 */
router.get("/users", adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get a single user
 */
router.get("/users/:id", adminController.getUserById);

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Change user role  { "role": "admin" | "moderator" | "user" }
 */
router.patch("/users/:id/role", adminController.updateUserRole);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Activate / deactivate account  { "isActive": true | false }
 */
router.patch("/users/:id/status", adminController.updateUserStatus);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Permanently delete a user
 */
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
