const { verifyAccessToken } = require("../config/jwt");
const { AppError, asyncHandler } = require("./errorHandler");
const User = require("../models/User");

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    throw new AppError(
      "You are not logged in. Please log in to access this resource",
      401,
    );
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError(
        "The user belonging to this token no longer exists",
        401,
      );
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError("Your account has been deactivated", 403);
    }

    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid token. Please log in again", 401);
    } else if (error.name === "TokenExpiredError") {
      throw new AppError("Your token has expired. Please log in again", 401);
    }
    throw error;
  }
});

/**
 * Authorization Middleware
 * Restricts access to specific roles
 * @param  {...String} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403,
      );
    }
    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't throw error if missing
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);

      if (user && user.isActive) {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }
    } catch (error) {
      // Silently fail for optional auth
      console.log("Optional auth failed:", error.message);
    }
  }

  next();
});

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
