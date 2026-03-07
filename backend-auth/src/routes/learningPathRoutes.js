const express = require("express");
const router = express.Router();
const learningPathController = require("../controllers/learningPathController");
const { authenticate } = require("../middleware/auth");

/**
 * Learning Path Routes
 * All routes require authentication
 */

// Save a new learning path
router.post("/", authenticate, learningPathController.saveLearningPath);

// Get all saved learning paths
router.get("/", authenticate, learningPathController.getSavedLearningPaths);

// Get a specific learning path
router.get(
  "/:pathId",
  authenticate,
  learningPathController.getSavedLearningPath,
);

// Update learning path name
router.patch(
  "/:pathId",
  authenticate,
  learningPathController.updateLearningPathName,
);

// Delete a learning path
router.delete(
  "/:pathId",
  authenticate,
  learningPathController.deleteLearningPath,
);

module.exports = router;
