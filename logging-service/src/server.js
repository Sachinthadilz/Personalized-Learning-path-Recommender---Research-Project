require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDatabase = require("./config/database");
const logsRouter = require("./routes/logs");

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

// ── Routes ─────────────────────────────────────────────────────────────
app.use("/logs", logsRouter);

app.get("/", (_req, res) => {
  res.json({
    service: "Activity Logging Service",
    version: "1.0.0",
    endpoints: {
      "POST /logs": "Store an activity event",
      "GET  /logs/:student_id": "Retrieve logs for a student",
      "GET  /logs/health/check": "Liveness probe",
    },
  });
});

// ── Global error handler ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ── Start ──────────────────────────────────────────────────────────────
const start = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Logging service running on http://localhost:${PORT}`);
  });
};

start();
