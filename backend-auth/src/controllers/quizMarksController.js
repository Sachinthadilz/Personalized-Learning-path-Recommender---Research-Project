const User = require("../models/User");
const AdaptiveSession = require("../models/AdaptiveSession");
const AcademicProfile = require("../models/AcademicProfile");
const StudyMaterial = require("../models/StudyMaterial");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * GET /api/quiz-marks
 *
 * Returns quiz/assessment marks for the authenticated user from 4 sources:
 *
 * 1. courseQuizMarks   – User.savedLearningPaths enrollment quiz results
 * 2. progressQuizMarks – AdaptiveSession.quizHistory (adaptive quiz game)
 * 3. subjectMarks      – StudyMaterial.marks (marks entered when generating study material)
 *                        + AcademicProfile.weakSubjects (onboarding assessment scores)
 *                        + AdaptiveSession.weeklySubjects where marks != null
 *                        (deduplicated by subject name, priority: study_material > profile > adaptive)
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

  // ── 2. Subject assessment marks ─────────────────────────────────────────
  // Sources (in priority order, dedup by subject name):
  //   a) StudyMaterial.marks  – entered when generating study material (most direct)
  //   b) AcademicProfile.weakSubjects – onboarding weak subject scores
  //   c) AdaptiveSession.weeklySubjects – diagnosis marks where set
  const [profile, session, studyMaterials] = await Promise.all([
    AcademicProfile.findOne({ user: userId }).select("weakSubjects").lean(),
    AdaptiveSession.findOne({ user: userId }).select("quizHistory weeklySubjects").lean(),
    StudyMaterial.find({ user: userId, marks: { $ne: null } })
      .select("subjectName marks grade")
      .lean(),
  ]);

  const subjectMarks = [];
  const seenSubjects = new Set();

  // a) StudyMaterial.marks – highest priority (user explicitly entered their score)
  for (const sm of studyMaterials) {
    if (sm.marks != null && !seenSubjects.has(sm.subjectName.toLowerCase())) {
      subjectMarks.push({
        subjectName: sm.subjectName,
        marks: sm.marks,
        grade: sm.grade || null,
        isWeak: sm.marks < 50,
        difficulty: null,
        confidence: null,
        source: "study_material",
      });
      seenSubjects.add(sm.subjectName.toLowerCase());
    }
  }

  // b) AcademicProfile.weakSubjects (marks is required here)
  if (profile && Array.isArray(profile.weakSubjects)) {
    for (const s of profile.weakSubjects) {
      if (s.marks != null && !seenSubjects.has(s.name.toLowerCase())) {
        subjectMarks.push({
          subjectName: s.name,
          marks: s.marks,
          grade: s.grade || null,
          isWeak: true,
          difficulty: null,
          confidence: null,
          source: "profile",
        });
        seenSubjects.add(s.name.toLowerCase());
      }
    }
  }

  // c) AdaptiveSession.weeklySubjects (marks optional, fill gaps not covered above)
  if (session && Array.isArray(session.weeklySubjects)) {
    for (const s of session.weeklySubjects) {
      if (s.marks != null && !seenSubjects.has(s.name.toLowerCase())) {
        subjectMarks.push({
          subjectName: s.name,
          marks: s.marks,
          grade: s.grade || null,
          isWeak: s.isWeak || false,
          difficulty: s.difficulty,
          confidence: s.confidence,
          source: "adaptive",
        });
        seenSubjects.add(s.name.toLowerCase());
      }
    }
  }

  // ── 3. Progress-tracking quiz marks (AdaptiveSession.quizHistory) ────────
  const progressQuizMarks = [];
  const subjectMap = {};
  if (session && Array.isArray(session.weeklySubjects)) {
    for (const s of session.weeklySubjects) subjectMap[s.name] = s.name;
  }

  if (session && Array.isArray(session.quizHistory)) {
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
    ...subjectMarks.map((s) => s.marks),
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
      subjectMarks,
      summary: {
        totalCourseQuizzes: courseQuizMarks.length,
        totalProgressQuizzes: progressQuizMarks.length,
        totalSubjectMarks: subjectMarks.length,
        overallAverage,
      },
    },
  });
});
