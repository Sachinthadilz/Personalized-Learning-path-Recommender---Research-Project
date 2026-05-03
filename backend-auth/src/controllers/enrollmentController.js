const User = require("../models/User");
const LearningPath = require("../models/LearningPath");
const QuizBank = require("../models/QuizBank");
const quizService = require("../services/quizService");

/**
 * Enroll in a saved learning path (unlock first course, lock rest)
 */
exports.enrollInPath = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pathId } = req.params;

    const learningPath = await LearningPath.findByUserAndPath(userId, pathId);
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

    // Use the model's enroll method
    await learningPath.enroll();

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

    const learningPath = await LearningPath.findByUserAndPath(userId, pathId);
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

    const learningPath = await LearningPath.findByUserAndPath(userId, pathId);
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
    const progress = learningPath.getCourseProgress(courseId);
    if (!progress) {
      return res
        .status(404)
        .json({ success: false, message: "Course progress not found" });
    }
    if (progress.status === "locked") {
      return res
        .status(400)
        .json({
          success: false,
          message: "This course is locked. Complete the previous course first.",
        });
    }
    if (progress.status === "completed") {
      return res
        .status(400)
        .json({ success: false, message: "This course is already completed" });
    }

    // Reuse existing question bank quiz if present, otherwise generate once and store.
    const courseKey = quizService.getCourseKey(course);
    let quizDoc = await QuizBank.findOne({ courseKey });

    if (!quizDoc) {
      const generatedQuestions = await quizService.generateQuiz(course);
      quizDoc = await QuizBank.create({
        courseKey,
        courseId: course.id || null,
        courseName: course.name,
        courseDescription: course.description || "",
        difficulty: course.difficulty || "",
        skills: Array.isArray(course.skills) ? course.skills : [],
        questions: generatedQuestions,
        createdBy: "ai",
        sourceModel: quizService.model,
      });
    }

    res.json({
      success: true,
      data: {
        quizId: String(quizDoc._id),
        courseId,
        courseName: course.name,
        questions: quizDoc.questions.map((q) => ({
          question: q.question,
          options: q.options,
        })),
        // Backward compatibility for older clients that still send _quizKey
        _quizKey: Buffer.from(
          JSON.stringify(quizDoc.questions.map((q) => q.correctAnswer)),
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
          .json({
            success: false,
            message: "Each answer must be a number between 0 and 3",
          });
      }
    }

    if (
      !quizData ||
      !quizData.questions ||
      (!quizData.quizId && !quizData._quizKey)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Quiz data is required" });
    }

    const learningPath = await LearningPath.findByUserAndPath(userId, pathId);
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

    const progress = learningPath.getCourseProgress(courseId);
    if (!progress) {
      return res
        .status(404)
        .json({ success: false, message: "Course progress not found" });
    }

    if (progress.status !== "unlocked") {
      return res
        .status(400)
        .json({ success: false, message: "Course is not in unlocked state" });
    }

    // Grade against persisted question bank if available.
    let fullQuestions;
    if (quizData.quizId) {
      const quizDoc = await QuizBank.findById(quizData.quizId);
      if (!quizDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Quiz not found" });
      }

      const course = learningPath.courses.find((c) => c.id === courseId);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found in this path" });
      }

      const expectedCourseKey = quizService.getCourseKey(course);
      if (quizDoc.courseKey !== expectedCourseKey) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Quiz does not match the selected course",
          });
      }

      fullQuestions = quizDoc.questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      }));
    } else {
      // Backward compatibility fallback for older clients
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

      fullQuestions = quizData.questions.map((q, idx) => ({
        ...q,
        correctAnswer: correctAnswers[idx],
      }));
    }

    const result = quizService.gradeQuiz(fullQuestions, answers);

    // Build quiz result
    const quizResult = {
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      questions: result.questions,
      completedAt: new Date(),
    };

    // Use the model's completeCourse method
    await learningPath.completeCourse(courseId, quizResult);

    // Check if next course was unlocked
    const progressIdx = learningPath.enrollment.courseProgress.findIndex(
      (cp) => cp.courseId === courseId,
    );
    const nextIdx = progressIdx + 1;

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
        nextCourseUnlocked:
          nextIdx < learningPath.enrollment.courseProgress.length,
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

    const learningPath = await LearningPath.findByUserAndPath(userId, pathId);
    if (!learningPath) {
      return res
        .status(404)
        .json({ success: false, message: "Learning path not found" });
    }

    // Use the model's unenroll method
    await learningPath.unenroll();

    res.json({
      success: true,
      message: "Unenrolled successfully. Progress has been reset.",
    });
  } catch (error) {
    next(error);
  }
};
