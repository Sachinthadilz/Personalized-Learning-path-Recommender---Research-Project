const User = require("../models/User");
const LearningPath = require("../models/LearningPath");
const { v4: uuidv4 } = require("uuid");

/**
 * Save a new learning path for the authenticated user
 */
exports.saveLearningPath = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathName, pathType, targetSkill, courses, metadata } = req.body;

    // Validation
    if (
      !pathName ||
      !pathType ||
      !targetSkill ||
      !courses ||
      courses.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: pathName, pathType, targetSkill, courses",
      });
    }

    if (!["ai_search", "ai_generator", "manual"].includes(pathType)) {
      return res.status(400).json({
        success: false,
        message: "pathType must be 'ai_search', 'ai_generator', or 'manual'",
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate unique path ID
    const pathId = uuidv4();

    // Create new learning path document
    const newPath = await LearningPath.create({
      userId,
      pathId,
      pathName,
      pathType,
      targetSkill,
      courses,
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      message: "Learning path saved successfully",
      data: {
        pathId,
        savedPath: newPath,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all saved learning paths for the authenticated user
 */
exports.getSavedLearningPaths = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const learningPaths = await LearningPath.findByUser(userId);

    res.json({
      success: true,
      data: {
        learningPaths: learningPaths || [],
        count: learningPaths?.length || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific saved learning path by ID
 */
exports.getSavedLearningPath = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathId } = req.params;

    const learningPath = await LearningPath.findByUserAndPath(userId, pathId);

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: "Learning path not found",
      });
    }

    res.json({
      success: true,
      data: learningPath,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a saved learning path
 */
exports.deleteLearningPath = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathId } = req.params;

    const result = await LearningPath.findOneAndDelete({ userId, pathId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Learning path not found",
      });
    }

    res.json({
      success: true,
      message: "Learning path deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a saved learning path name
 */
exports.updateLearningPathName = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathId } = req.params;
    const { pathName } = req.body;

    if (!pathName) {
      return res.status(400).json({
        success: false,
        message: "pathName is required",
      });
    }

    const learningPath = await LearningPath.findOneAndUpdate(
      { userId, pathId },
      { pathName },
      { new: true, runValidators: true },
    );

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: "Learning path not found",
      });
    }

    res.json({
      success: true,
      message: "Learning path name updated successfully",
      data: learningPath,
    });
  } catch (error) {
    next(error);
  }
};