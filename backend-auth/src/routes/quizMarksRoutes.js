const express = require("express");
const router = express.Router();
const { getQuizMarks } = require("../controllers/quizMarksController");
const { authenticate } = require("../middleware/auth");

// GET /api/quiz-marks  – requires a valid JWT
router.get("/", authenticate, getQuizMarks);

module.exports = router;
