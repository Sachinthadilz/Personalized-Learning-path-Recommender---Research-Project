const User = require("../models/User");
const quizService = require("../services/quizService");

/**
 * Enroll in a saved learning path (unlock first course, lock rest)
 */
exports.enrollInPath = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const learningPath = user.savedLearningPaths.find(
      (p) => p.pathId === pathId,
    );
    if (!learningPath) {
      return res
        .status(404)
        .json({ success: false, message: "Learning path not found" });
    }

    if (learningPath.enrollment && learningPath.enrollment.isEnrolled) {
      return res
        .status(400)
        .json({ success: false, message: "Already enrolled in this path" });
    }

    // Build courseProgress: first course unlocked, rest locked
    const courseProgress = learningPath.courses.map((course, idx) => ({
      courseId: course.id,
      status: idx === 0 ? "unlocked" : "locked",
    }));

    learningPath.enrollment = {
      isEnrolled: true,
      enrolledAt: new Date(),
      currentCourseIndex: 0,
      courseProgress,
    };

    await user.save();

    res.json({
      success: true,
      message: "Enrolled successfully. First course is now unlocked.",
      data: { enrollment: learningPath.enrollment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get enrollment status for a learning path
 */
exports.getEnrollmentStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathId } = req.params;

    const user = await User.findById(userId).select("savedLearningPaths");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const learningPath = user.savedLearningPaths.find(
      (p) => p.pathId === pathId,
    );
    if (!learningPath) {
      return res
        .status(404)
        .json({ success: false, message: "Learning path not found" });
    }

    res.json({
      success: true,
      data: {
        enrollment: learningPath.enrollment || { isEnrolled: false },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a quiz for a course when user marks it as completed
 */
exports.generateQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathId, courseId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const learningPath = user.savedLearningPaths.find(
      (p) => p.pathId === pathId,
    );
    if (!learningPath) {
      return res
        .status(404)
        .json({ success: false, message: "Learning path not found" });
    }

    if (!learningPath.enrollment || !learningPath.enrollment.isEnrolled) {
      return res
        .status(400)
        .json({ success: false, message: "Not enrolled in this path" });
    }

    // Find the course in the path
    const course = learningPath.courses.find((c) => c.id === courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found in this path" });
    }

    // Check course is unlocked (not locked, not already completed)
    const progress = learningPath.enrollment.courseProgress.find(
      (cp) => cp.courseId === courseId,
    );
    if (!progress) {
      return res
        .status(404)
        .json({ success: false, message: "Course progress not found" });
    }
    if (progress.status === "locked") {
      return res
        .status(400)
        .json({ success: false, message: "This course is locked. Complete the previous course first." });
    }
    if (progress.status === "completed") {
      return res
        .status(400)
        .json({ success: false, message: "This course is already completed" });
    }

    // Generate quiz using Groq AI
    const questions = await quizService.generateQuiz(course);

    res.json({
      success: true,
      data: {
        courseId,
        courseName: course.name,
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
        })),
        // Store correct answers server-side temporarily in session/memory
        // We'll validate on submission
        _quizKey: Buffer.from(
          JSON.stringify(questions.map((q) => q.correctAnswer)),
        ).toString("base64"),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit quiz answers and grade them
 */
exports.submitQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathId, courseId } = req.params;
    const { answers, quizData } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length !== 5) {
      return res
        .status(400)
        .json({ success: false, message: "Must provide exactly 5 answers" });
    }

    // Validate answer values
    for (const ans of answers) {
      if (typeof ans !== "number" || ans < 0 || ans > 3) {
        return res
          .status(400)
          .json({ success: false, message: "Each answer must be a number between 0 and 3" });
      }
    }

    if (!quizData || !quizData.questions || !quizData._quizKey) {
      return res
        .status(400)
        .json({ success: false, message: "Quiz data is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const learningPath = user.savedLearningPaths.find(
      (p) => p.pathId === pathId,
    );
    if (!learningPath) {
      return res
        .status(404)
        .json({ success: false, message: "Learning path not found" });
    }

    if (!learningPath.enrollment || !learningPath.enrollment.isEnrolled) {
      return res
        .status(400)
        .json({ success: false, message: "Not enrolled in this path" });
    }

    const progressIdx = learningPath.enrollment.courseProgress.findIndex(
      (cp) => cp.courseId === courseId,
    );
    if (progressIdx === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Course progress not found" });
    }

    const progress = learningPath.enrollment.courseProgress[progressIdx];
    if (progress.status !== "unlocked") {
      return res
        .status(400)
        .json({ success: false, message: "Course is not in unlocked state" });
    }

    // Decode correct answers from the quiz key
    let correctAnswers;
    try {
      correctAnswers = JSON.parse(
        Buffer.from(quizData._quizKey, "base64").toString("utf-8"),
      );
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid quiz key" });
    }

    // Grade the quiz
    const fullQuestions = quizData.questions.map((q, idx) => ({
      ...q,
      correctAnswer: correctAnswers[idx],
    }));

    const result = quizService.gradeQuiz(fullQuestions, answers);

    // Save quiz result and mark course as completed
    progress.status = "completed";
    progress.completedAt = new Date();
    progress.quizResult = {
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      questions: result.questions,
      completedAt: new Date(),
    };

    // Unlock next course if exists
    const nextIdx = progressIdx + 1;
    if (nextIdx < learningPath.enrollment.courseProgress.length) {
      learningPath.enrollment.courseProgress[nextIdx].status = "unlocked";
      learningPath.enrollment.currentCourseIndex = nextIdx;
    }

    await user.save();

    res.json({
      success: true,
      message: "Quiz submitted successfully",
      data: {
        result: {
          score: result.score,
          totalQuestions: result.totalQuestions,
          percentage: result.percentage,
          questions: result.questions,
        },
        nextCourseUnlocked: nextIdx < learningPath.enrollment.courseProgress.length,
        enrollment: learningPath.enrollment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unenroll from a learning path (reset progress)
 */
exports.unenrollFromPath = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const learningPath = user.savedLearningPaths.find(
      (p) => p.pathId === pathId,
    );
    if (!learningPath) {
      return res
        .status(404)
        .json({ success: false, message: "Learning path not found" });
    }

    learningPath.enrollment = {
      isEnrolled: false,
      courseProgress: [],
    };

    await user.save();

    res.json({
      success: true,
      message: "Unenrolled successfully. Progress has been reset.",
    });
  } catch (error) {
    next(error);
  }
};
