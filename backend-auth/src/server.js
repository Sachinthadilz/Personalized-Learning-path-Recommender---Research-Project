require("dotenv").config();
const app = require("./app");
const connectDatabase = require("./config/database");

/**
 * Server Configuration
 */
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Validate Environment Variables
 */
const validateEnv = () => {
  const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    console.error("Missing required environment variables:");
    missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`));
    console.error("\nPlease create a .env file based on .env.example");
    process.exit(1);
  }
};

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Validate environment variables
    console.log("Validating environment variables...");
    validateEnv();

    // Connect to database
    console.log("Connecting to database...");
    await connectDatabase();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log("\n" + "=".repeat(60));
      console.log("Authentication Server Started Successfully!");
      console.log("=".repeat(60));
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Server URL: http://localhost:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log("=".repeat(60) + "\n");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! Shutting down...");
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION! Shutting down...");
      console.error(err.name, err.message);
      process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("Process terminated");
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
