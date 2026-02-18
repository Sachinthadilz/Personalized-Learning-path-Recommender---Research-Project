const User = require("../models/User");
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

    if (!["ai_search", "ai_generator"].includes(pathType)) {
      return res.status(400).json({
        success: false,
        message: "pathType must be 'ai_search' or 'ai_generator'",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate unique path ID
    const pathId = uuidv4();

    // Create new learning path
    const newPath = {
      pathId,
      pathName,
      pathType,
      targetSkill,
      courses,
      metadata: metadata || {},
      createdAt: new Date(),
    };

    // Add to user's saved paths
    user.savedLearningPaths.push(newPath);
    await user.save();

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

    const user = await User.findById(userId).select("savedLearningPaths");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        learningPaths: user.savedLearningPaths || [],
        count: user.savedLearningPaths?.length || 0,
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const learningPath = user.savedLearningPaths.find(
      (path) => path.pathId === pathId,
    );

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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const pathIndex = user.savedLearningPaths.findIndex(
      (path) => path.pathId === pathId,
    );

    if (pathIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Learning path not found",
      });
    }

    // Remove the path
    user.savedLearningPaths.splice(pathIndex, 1);
    await user.save();

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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const learningPath = user.savedLearningPaths.find(
      (path) => path.pathId === pathId,
    );

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: "Learning path not found",
      });
    }

    learningPath.pathName = pathName;
    await user.save();

    res.json({
      success: true,
      message: "Learning path name updated successfully",
      data: learningPath,
    });
  } catch (error) {
    next(error);
  }
};
