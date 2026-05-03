const express = require("express");
const axios = require("axios");
const ActivityLog = require("../models/ActivityLog");

const router = express.Router();

/**
 * POST /predict/auto
 *
 * Prediction proxy endpoint that:
 * 1. Receives student_id + optional course_id from frontend
 * 2. Computes engagement features from MongoDB activity logs
 * 3. Calls Python backend /predict-learner-profile/auto with pre-computed features
 * 4. Returns the prediction result
 *
 * This decouples Python ML backend from database operations.
 */
router.post("/auto", async (req, res) => {
  try {
    const { student_id, course_id, code_module, code_presentation } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        error: "student_id is required",
      });
    }

    // Build match filter for engagement features
    // Exclude authentication pages (login/signup/landing) but include learning content
    const match = { 
      student_id,
      $and: [
        {
          $or: [
            { "metadata.page_title": { $exists: false } }, // Old events without metadata
            { "metadata.page_title": { $not: { $regex: /login|sign.*up|landing|register|authentication/i } } }
          ]
        }
      ]
    };
    if (course_id) {
      match.course_id = course_id;
    }

    // Define event type categories (same as /logs/engagement-features)
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

    // ---- 2. Days active ----
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

    // ---- 4. Early clicks (first 14 days) ----
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

    // ---- 6. Validate sufficient activity data BEFORE calling Python ----
    const hasActivity = totalClicks > 0 || daysActive > 0 || numAssessments > 0;
    
    if (!hasActivity) {
      return res.status(400).json({
        success: false,
        error: "insufficient_data",
        message: "Cannot generate learner profile prediction: no learning activity data found for this student. " +
                 "Please complete at least one learning activity (watch a video, click a resource, or submit an assessment) to enable predictions.",
        student_id,
        suggestion: "Start learning to unlock your personalized profile analysis!",
      });
    }

    // ---- 7. Call Python backend with pre-computed engagement features ----
    const pythonBackendUrl =
      process.env.PYTHON_BACKEND_URL || "http://localhost:5000";
    const pythonResponse = await axios.post(
      `${pythonBackendUrl}/predict-learner-profile/auto`,
      {
        student_id,
        course_id,
        code_module,
        code_presentation,
        // Pre-computed engagement features
        total_clicks: totalClicks,
        days_active: daysActive,
        max_daily_clicks: maxDailyClicks,
        mean_daily_clicks: meanDailyClicks,
        early_clicks: earlyClicks,
        num_assessments: numAssessments,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      },
    );

    // Return the prediction result from Python backend
    return res.json(pythonResponse.data);
  } catch (err) {
    console.error("POST /predict/auto error:", err.message);

    // Handle axios errors specifically
    if (err.response) {
      // Python backend returned an error
      return res.status(err.response.status).json({
        success: false,
        error: err.response.data.detail || err.response.data.error || err.message,
      });
    } else if (err.request) {
      // No response from Python backend
      return res.status(503).json({
        success: false,
        error: "Python ML backend is unavailable",
      });
    }

    // Other errors
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
