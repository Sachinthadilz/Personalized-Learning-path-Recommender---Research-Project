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
 * GET /logs/timeline/:student_id
 *
 * Daily activity aggregation for timeline charts.
 * Returns array of {date, events, total_duration} objects sorted ascending.
 * Query params: course_id, start_date, end_date (optional)
 */
router.get("/timeline/:student_id", async (req, res) => {
  try {
    const { student_id } = req.params;
    const { course_id, start_date, end_date } = req.query;

    // Build match filter
    // Exclude authentication pages but include learning content
    const match = { 
      student_id,
      $and: [
        {
          $or: [
            { "metadata.page_title": { $exists: false } },
            { "metadata.page_title": { $not: { $regex: /login|sign.*up|landing|register|authentication/i } } }
          ]
        }
      ]
    };
    if (course_id) {
      match.course_id = course_id;
    }

    // Add date range filter if provided
    if (start_date || end_date) {
      match.timestamp = {};
      if (start_date) {
        match.timestamp.$gte = new Date(start_date);
      }
      if (end_date) {
        const endDateTime = new Date(end_date);
        endDateTime.setHours(23, 59, 59, 999);
        match.timestamp.$lte = endDateTime;
      }
    }

    // MongoDB aggregation pipeline for daily buckets
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          events: { $sum: 1 },
          total_duration: {
            $sum: { $ifNull: ["$duration", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          events: 1,
          total_duration: 1,
        },
      },
    ];

    const timeline = await ActivityLog.aggregate(pipeline);
    return res.json(timeline);
  } catch (err) {
    console.error("GET /logs/timeline/:student_id error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /logs/engagement-features/:student_id
 *
 * Compute ML engagement features using MongoDB aggregation.
 * Query params: course_id (optional - if omitted, compute across all courses)
 * Returns:
 *   total_clicks, days_active, max_daily_clicks, mean_daily_clicks,
 *   early_clicks, num_assessments
 */
router.get("/engagement-features/:student_id", async (req, res) => {
  try {
    const { student_id } = req.params;
    const { course_id } = req.query;

    // Build base match filter
    // Exclude authentication pages but include learning content
    const match = { 
      student_id,
      $and: [
        {
          $or: [
            { "metadata.page_title": { $exists: false } },
            { "metadata.page_title": { $not: { $regex: /login|sign.*up|landing|register|authentication/i } } }
          ]
        }
      ]
    };
    if (course_id) {
      match.course_id = course_id;
    }

    // Define event type categories
    const clickTypes = [
      "click",
      "video_play",
      "video_pause",
      "video_complete",
      "resource_download",
      "resource_view",
      "forum_post",
      "forum_view",
      "assessment_start",
      "assessment_submit",
      "quiz_attempt",
    ];
    const assessmentTypes = ["assessment_submit", "quiz_attempt"];

    // ---- 1. Basic metrics: total_clicks, num_assessments, first_event ----
    const basicPipeline = [
      { $match: match },
      {
        $facet: {
          clicks: [
            { $match: { event_type: { $in: clickTypes } } },
            { $count: "total" },
          ],
          assessments: [
            { $match: { event_type: { $in: assessmentTypes } } },
            { $count: "total" },
          ],
          first_event: [
            { $match: { event_type: { $in: clickTypes } } },
            { $sort: { timestamp: 1 } },
            { $limit: 1 },
            { $project: { timestamp: 1 } },
          ],
        },
      },
    ];

    const basicResults = await ActivityLog.aggregate(basicPipeline);
    const basic = basicResults[0] || {};

    const totalClicks =
      basic.clicks && basic.clicks[0] ? basic.clicks[0].total : 0;
    const numAssessments =
      basic.assessments && basic.assessments[0]
        ? basic.assessments[0].total
        : 0;
    const firstEventTime =
      basic.first_event && basic.first_event[0]
        ? basic.first_event[0].timestamp
        : null;

    // ---- 2. Days active (distinct days with clicks) ----
    const daysActivePipeline = [
      { $match: { ...match, event_type: { $in: clickTypes } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
        },
      },
      { $count: "days" },
    ];

    const daysResult = await ActivityLog.aggregate(daysActivePipeline);
    const daysActive = daysResult[0] ? daysResult[0].days : 0;

    // ---- 3. Max daily clicks ----
    const maxDailyPipeline = [
      { $match: { ...match, event_type: { $in: clickTypes } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ];

    const maxResult = await ActivityLog.aggregate(maxDailyPipeline);
    const maxDailyClicks = maxResult[0] ? maxResult[0].count : 0;

    // ---- 4. Early clicks (first 14 days after first event) ----
    let earlyClicks = 0;
    if (firstEventTime) {
      const cutoff = new Date(firstEventTime);
      cutoff.setDate(cutoff.getDate() + 14);

      const earlyClicksPipeline = [
        {
          $match: {
            ...match,
            event_type: { $in: clickTypes },
            timestamp: { $lte: cutoff },
          },
        },
        { $count: "total" },
      ];

      const earlyResult = await ActivityLog.aggregate(earlyClicksPipeline);
      earlyClicks = earlyResult[0] ? earlyResult[0].total : 0;
    }

    // ---- 5. Mean daily clicks ----
    const meanDailyClicks =
      daysActive > 0 ? Math.round((totalClicks / daysActive) * 10) / 10 : 0.0;

    // ---- 6. Return features ----
    return res.json({
      student_id,
      total_clicks: totalClicks,
      days_active: daysActive,
      max_daily_clicks: maxDailyClicks,
      mean_daily_clicks: meanDailyClicks,
      early_clicks: earlyClicks,
      num_assessments: numAssessments,
    });
  } catch (err) {
    console.error(
      "GET /logs/engagement-features/:student_id error:",
      err.message,
    );
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /logs/:student_id
 *
 * Delete all activity logs for a student.
 * Query params: course_id (optional - if provided, only delete logs for that course)
 */
router.delete("/:student_id", async (req, res) => {
  try {
    const filter = { student_id: req.params.student_id };
    if (req.query.course_id) {
      filter.course_id = req.query.course_id;
    }

    const result = await ActivityLog.deleteMany(filter);
    return res.json({
      success: true,
      deleted: result.deletedCount,
    });
  } catch (err) {
    console.error("DELETE /logs/:student_id error:", err.message);
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
