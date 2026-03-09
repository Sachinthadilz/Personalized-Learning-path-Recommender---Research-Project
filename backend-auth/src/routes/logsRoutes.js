const express = require("express");
const ActivityLog = require("../models/ActivityLog");

const router = express.Router();

/**
 * POST /logs
 *
 * Persist a single activity event forwarded from the FastAPI backend.
 * This endpoint is intentionally unauthenticated — it is called
 * server-to-server from the Python backend.
 */
router.post("/", async (req, res) => {
  try {
    const {
      log_id,
      student_id,
      course_id,
      event_type,
      timestamp,
      duration,
      metadata,
    } = req.body;

    const page_url =
      req.body.page_url || (metadata && metadata.page_url) || null;
    const session_id =
      req.body.session_id || (metadata && metadata.session_id) || null;

    const doc = await ActivityLog.create({
      log_id,
      student_id,
      course_id,
      event_type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      duration: duration ?? null,
      page_url,
      session_id,
      metadata: metadata || {},
    });

    return res.status(201).json({
      success: true,
      log_id: doc.log_id,
      _id: doc._id,
    });
  } catch (err) {
    console.error("POST /logs error:", err.message);
    return res.status(err.name === "ValidationError" ? 400 : 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /logs/:student_id
 *
 * Retrieve activity logs for a student (most-recent first).
 * Optional query params: course_id, event_type, limit (default 200).
 */
router.get("/:student_id", async (req, res) => {
  try {
    const filter = { student_id: req.params.student_id };
    if (req.query.course_id) filter.course_id = req.query.course_id;
    if (req.query.event_type) filter.event_type = req.query.event_type;

    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);

    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return res.json(logs);
  } catch (err) {
    console.error("GET /logs/:student_id error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /logs/health/check
 *
 * Liveness probe.
 */
router.get("/health/check", (_req, res) => {
  return res.json({ status: "ok" });
});

module.exports = router;
