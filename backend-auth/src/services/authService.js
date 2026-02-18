const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../config/jwt");
const { AppError } = require("../middleware/errorHandler");

/**
 * Authentication Service
 * Contains business logic for authentication operations
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User and tokens
   */
  async register(userData) {
    const { firstName, lastName, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    // Generate tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to user
    await user.addRefreshToken(refreshToken);

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Promise<Object>} User and tokens
   */
  async login(email, password) {
    // Find user with password field
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError("Your account has been deactivated", 403);
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new AppError("Invalid email or password", 401);
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    await user.addRefreshToken(refreshToken);

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        lastLogin: user.lastLogin,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   * @param {String} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check if refresh token is valid and stored
      const isRefreshTokenValid = user.refreshTokens.some(
        (rt) => rt.token === refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new AppError("Invalid refresh token", 401);
      }

      // Generate new access token
      const tokenPayload = {
        id: user._id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(tokenPayload);

      return {
        accessToken,
      };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError(
          "Refresh token has expired. Please log in again",
          401,
        );
      }
      throw error;
    }
  }

  /**
   * Logout user
   * @param {String} userId - User ID
   * @param {String} refreshToken - Refresh token
   * @returns {Promise<void>}
   */
  async logout(userId, refreshToken) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Remove refresh token
    if (refreshToken) {
      await user.removeRefreshToken(refreshToken);
    }

    return { message: "Logout successful" };
  }

  /**
   * Get user profile
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(userId, updateData) {
    const { firstName, lastName } = updateData;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Change password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear all refresh tokens for security
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });

    return { message: "Password changed successfully. Please log in again." };
  }
}

module.exports = new AuthService();
