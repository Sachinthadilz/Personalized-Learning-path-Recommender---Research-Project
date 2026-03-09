const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");
const { authenticate } = require("../middleware/auth");

/**
 * Enrollment & Quiz Routes
 * All routes require authentication
 */

// Enroll in a learning path
router.post(
  "/:pathId/enroll",
  authenticate,
  enrollmentController.enrollInPath,
);

// Get enrollment status
router.get(
  "/:pathId/enrollment",
  authenticate,
  enrollmentController.getEnrollmentStatus,
);

// Generate quiz for a course (when marking as completed)
router.post(
  "/:pathId/courses/:courseId/quiz",
  authenticate,
  enrollmentController.generateQuiz,
);

// Submit quiz answers
router.post(
  "/:pathId/courses/:courseId/submit-quiz",
  authenticate,
  enrollmentController.submitQuiz,
);

// Unenroll from a learning path
router.post(
  "/:pathId/unenroll",
  authenticate,
  enrollmentController.unenrollFromPath,
);

module.exports = router;
