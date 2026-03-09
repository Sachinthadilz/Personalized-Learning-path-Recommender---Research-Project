const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const learningPathRoutes = require("./routes/learningPathRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const profileRoutes = require("./routes/profileRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

/**
 * Create Express application
 */
const app = express();

/**
 * Security Middleware
 */
// Set security headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use("/api/", limiter);

/**
 * Body Parser Middleware
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Logging Middleware
 */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/**
 * Health Check Route
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * API Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/learning-paths", learningPathRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/profile", profileRoutes);

/**
 * Root Route
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to UP Knowledge Graph Authentication API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      learningPaths: "/api/learning-paths",
    },
    documentation: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      logout: "POST /api/auth/logout",
      refreshToken: "POST /api/auth/refresh-token",
      profile: "GET /api/auth/profile",
      updateProfile: "PUT /api/auth/profile",
      changePassword: "PUT /api/auth/change-password",
      verify: "GET /api/auth/verify",
      saveLearningPath: "POST /api/learning-paths",
      getLearningPaths: "GET /api/learning-paths",
      getLearningPath: "GET /api/learning-paths/:pathId",
      updateLearningPath: "PATCH /api/learning-paths/:pathId",
      deleteLearningPath: "DELETE /api/learning-paths/:pathId",
    },
  });
});

/**
 * Error Handling Middleware
 * Must be after all routes
 */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
