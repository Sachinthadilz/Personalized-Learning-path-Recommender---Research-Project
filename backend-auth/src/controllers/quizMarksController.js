const User = require("../models/User");
const AdaptiveSession = require("../models/AdaptiveSession");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * GET /api/quiz-marks
 *
 * Returns two sets of quiz marks for the authenticated user:
 *
 * 1. courseQuizMarks  – from User.savedLearningPaths enrollment quiz results
 *    (populated when the user completes a course and submits the AI quiz)
 *
 * 2. progressQuizMarks – from AdaptiveSession.quizHistory
 *    (populated by the progress-tracking / adaptive learning feature)
 */
exports.getQuizMarks = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // ── 1. Course quiz marks (User model) ──────────────────────────────────
  const user = await User.findById(userId).select("savedLearningPaths");

  const courseQuizMarks = [];

  if (user) {
    for (const path of user.savedLearningPaths) {
      const enrollment = path.enrollment;
      if (!enrollment || !enrollment.isEnrolled) continue;

      for (const cp of enrollment.courseProgress) {
        if (!cp.quizResult || cp.quizResult.score == null) continue;

        // Resolve course name from the courses array
        const course = path.courses.find((c) => c.id === cp.courseId);

        courseQuizMarks.push({
          pathId: path.pathId,
          pathName: path.pathName,
          courseId: cp.courseId,
          courseName: course ? course.name : cp.courseId,
          score: cp.quizResult.score,
          totalQuestions: cp.quizResult.totalQuestions,
          percentage: cp.quizResult.percentage,
          completedAt: cp.quizResult.completedAt,
        });
      }
    }
  }

  // ── 2. Progress-tracking quiz marks (AdaptiveSession model) ────────────
  const session = await AdaptiveSession.findOne({ user: userId })
    .select("quizHistory weeklySubjects")
    .lean();

  const progressQuizMarks = [];

  if (session && Array.isArray(session.quizHistory)) {
    // Build a subject name lookup from weeklySubjects (id === name for this schema)
    const subjectMap = {};
    if (Array.isArray(session.weeklySubjects)) {
      for (const s of session.weeklySubjects) {
        subjectMap[s.name] = s.name; // subjectId stored as subject name
      }
    }

    for (const qr of session.quizHistory) {
      progressQuizMarks.push({
        subjectId: qr.subjectId,
        subjectName: subjectMap[qr.subjectId] || qr.subjectId,
        score: qr.score,
        total: qr.total,
        percentage: qr.total > 0 ? Math.round((qr.score / qr.total) * 100) : 0,
        band: qr.band,
        takenAt: qr.takenAt,
      });
    }

    // Newest first
    progressQuizMarks.sort(
      (a, b) => new Date(b.takenAt) - new Date(a.takenAt)
    );
  }

  // ── Summary stats ───────────────────────────────────────────────────────
  const allPercentages = [
    ...courseQuizMarks.map((q) => q.percentage),
    ...progressQuizMarks.map((q) => q.percentage),
  ].filter((p) => p != null);

  const overallAverage =
    allPercentages.length > 0
      ? Math.round(
          allPercentages.reduce((sum, p) => sum + p, 0) / allPercentages.length
        )
      : null;

  res.status(200).json({
    success: true,
    data: {
      courseQuizMarks,
      progressQuizMarks,
      summary: {
        totalCourseQuizzes: courseQuizMarks.length,
        totalProgressQuizzes: progressQuizMarks.length,
        overallAverage,
      },
    },
  });
});
