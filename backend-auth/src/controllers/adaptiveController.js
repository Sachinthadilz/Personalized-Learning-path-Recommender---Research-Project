const AdaptiveSession = require("../models/AdaptiveSession");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

// GET /api/adaptive/session
// Returns the authenticated user's adaptive session (or an empty default).
exports.getSession = asyncHandler(async (req, res) => {
  const session = await AdaptiveSession.findOne({ user: req.user.id }).lean();
  res.status(200).json({
    success: true,
    data: session || { weeklySubjects: [], quizHistory: [], currentWeek: 1 },
  });
});

// POST /api/adaptive/session
// Upserts weekly subject list for the authenticated user.
// Body: { weeklySubjects: SubjectPerformance[], currentWeek?: number }
exports.saveSession = asyncHandler(async (req, res) => {
  const { weeklySubjects, currentWeek } = req.body;

  if (!Array.isArray(weeklySubjects)) {
    throw new AppError("weeklySubjects must be an array", 400);
  }

  // Basic per-entry validation
  for (const s of weeklySubjects) {
    if (!s.name || typeof s.difficulty !== "number" || typeof s.confidence !== "number") {
      throw new AppError(
        "Each subject entry requires: name (string), difficulty (number 1-5), confidence (number 1-5)",
        400
      );
    }
    if (s.difficulty < 1 || s.difficulty > 5 || s.confidence < 1 || s.confidence > 5) {
      throw new AppError("difficulty and confidence must be between 1 and 5", 400);
    }
  }

  const session = await AdaptiveSession.findOneAndUpdate(
    { user: req.user.id },
    {
      weeklySubjects,
      currentWeek: typeof currentWeek === "number" && currentWeek >= 1 ? currentWeek : 1,
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: session });
});

// POST /api/adaptive/quiz-result
// Appends a single quiz result to the user's quiz history.
// Body: { subjectId: string, score: number, total: number, band: "A"|"B"|"C"|"D" }
exports.saveQuizResult = asyncHandler(async (req, res) => {
  const { subjectId, score, total, band } = req.body;

  if (!subjectId || score == null || total == null || !band) {
    throw new AppError("subjectId, score, total, and band are all required", 400);
  }

  const validBands = ["A", "B", "C", "D"];
  if (!validBands.includes(band)) {
    throw new AppError("band must be one of A, B, C, D", 400);
  }

  if (typeof score !== "number" || typeof total !== "number" || score < 0 || total < 1) {
    throw new AppError("score must be >= 0 and total must be >= 1", 400);
  }

  const session = await AdaptiveSession.findOneAndUpdate(
    { user: req.user.id },
    { $push: { quizHistory: { subjectId, score, total, band, takenAt: new Date() } } },
    { upsert: true, new: true }
  );

  res.status(201).json({ success: true, data: session });
});

// DELETE /api/adaptive/session
// Resets (deletes) the user's adaptive session to start fresh.
exports.resetSession = asyncHandler(async (req, res) => {
  await AdaptiveSession.deleteOne({ user: req.user.id });
  res.status(200).json({ success: true, message: "Adaptive session reset successfully" });
});
