import { useState, useEffect, useCallback } from "react";
import {
  getSavedLearningPaths,
  deleteLearningPath,
  updateLearningPathName,
  enrollInPath,
  generateQuiz,
  submitQuiz,
  unenrollFromPath,
  type SavedLearningPath,
  type AISearchResult,
  type QuizData,
  type QuizResult,
} from "../api";
import { useAuth } from "../contexts/AuthContext";
import { Lock, Trash2, AlertTriangle, X, ChevronDown, ChevronUp, Pencil, BookOpen, CheckCircle, Trophy, Loader2, Play, RotateCcw } from "lucide-react";

// Helper function to format description as bullet points
const formatDescriptionAsPoints = (
  description: string | undefined,
): string[] => {
  if (!description) return [];

  let points = description
    .split(/\.(?=\s+[A-Z])|\.\s*\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  points = points.map((point) => {
    if (!/[.!?]$/.test(point)) {
      return point + ".";
    }
    return point;
  });

  return points.length > 0 ? points : [description];
};

export default function SavedPathsTab() {
  const [savedPaths, setSavedPaths] = useState<SavedLearningPath[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletePathName, setDeletePathName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [enrollingPathId, setEnrollingPathId] = useState<string | null>(null);
  const [quizModal, setQuizModal] = useState<{
    pathId: string;
    courseId: string;
    courseName: string;
    quizData: QuizData | null;
    answers: number[];
    loading: boolean;
    submitting: boolean;
    result: QuizResult | null;
  } | null>(null);
  const [unenrollingPathId, setUnenrollingPathId] = useState<string | null>(null);
  const { user } = useAuth();

  const loadSavedPaths = useCallback(async () => {
    setError(null);
    try {
      const response = await getSavedLearningPaths();
      setSavedPaths(response.data.learningPaths);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load saved paths");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSavedPaths();
    } else {
      setInitialLoading(false);
    }
  }, [user, loadSavedPaths]);

  const handleDeleteRequest = (path: SavedLearningPath) => {
    setDeleteConfirmId(path.pathId);
    setDeletePathName(path.pathName);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteLearningPath(deleteConfirmId);
      setSavedPaths((prev) => prev.filter((p) => p.pathId !== deleteConfirmId));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete path");
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
      setDeletePathName("");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
    setDeletePathName("");
  };

  const handleStartEdit = (path: SavedLearningPath) => {
    setEditingPathId(path.pathId);
    setEditName(path.pathName);
  };

  const handleSaveEdit = async (pathId: string) => {
    if (!editName.trim()) {
      return;
    }

    try {
      await updateLearningPathName(pathId, editName);
      setSavedPaths(
        savedPaths.map((p) =>
          p.pathId === pathId ? { ...p, pathName: editName } : p,
        ),
      );
      setEditingPathId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update path name");
    }
  };

  const handleCancelEdit = () => {
    setEditingPathId(null);
    setEditName("");
  };

  const handleEnroll = async (pathId: string) => {
    setEnrollingPathId(pathId);
    try {
      const response = await enrollInPath(pathId);
      setSavedPaths((prev) =>
        prev.map((p) =>
          p.pathId === pathId
            ? { ...p, enrollment: response.data.enrollment }
            : p,
        ),
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to enroll");
    } finally {
      setEnrollingPathId(null);
    }
  };

  const handleUnenroll = async (pathId: string) => {
    setUnenrollingPathId(pathId);
    try {
      await unenrollFromPath(pathId);
      setSavedPaths((prev) =>
        prev.map((p) =>
          p.pathId === pathId
            ? { ...p, enrollment: { isEnrolled: false, currentCourseIndex: 0, courseProgress: [] } }
            : p,
        ),
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to unenroll");
    } finally {
      setUnenrollingPathId(null);
    }
  };

  const handleMarkComplete = async (pathId: string, courseId: string, courseName: string) => {
    setQuizModal({
      pathId,
      courseId,
      courseName,
      quizData: null,
      answers: [-1, -1, -1, -1, -1],
      loading: true,
      submitting: false,
      result: null,
    });

    try {
      const response = await generateQuiz(pathId, courseId);
      setQuizModal((prev) =>
        prev ? { ...prev, quizData: response.data, loading: false } : null,
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate quiz");
      setQuizModal(null);
    }
  };

  const handleQuizAnswer = (questionIdx: number, answerIdx: number) => {
    setQuizModal((prev) => {
      if (!prev) return null;
      const newAnswers = [...prev.answers];
      newAnswers[questionIdx] = answerIdx;
      return { ...prev, answers: newAnswers };
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quizModal || !quizModal.quizData) return;

    if (quizModal.answers.some((a) => a === -1)) {
      setError("Please answer all questions before submitting");
      return;
    }

    setQuizModal((prev) => (prev ? { ...prev, submitting: true } : null));

    try {
      const response = await submitQuiz(
        quizModal.pathId,
        quizModal.courseId,
        quizModal.answers,
        quizModal.quizData,
      );

      setQuizModal((prev) =>
        prev ? { ...prev, submitting: false, result: response.data.result } : null,
      );

      // Update the path's enrollment data locally
      setSavedPaths((prev) =>
        prev.map((p) =>
          p.pathId === quizModal.pathId
            ? { ...p, enrollment: response.data.enrollment }
            : p,
        ),
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit quiz");
      setQuizModal((prev) => (prev ? { ...prev, submitting: false } : null));
    }
  };

  const closeQuizModal = () => {
    setQuizModal(null);
  };

  const getCourseStatus = (path: SavedLearningPath, courseId: string) => {
    if (!path.enrollment?.isEnrolled) return null;
    return path.enrollment.courseProgress.find((cp) => cp.courseId === courseId);
  };

  const getCompletedCount = (path: SavedLearningPath) => {
    if (!path.enrollment?.isEnrolled) return 0;
    return path.enrollment.courseProgress.filter((cp) => cp.status === "completed").length;
  };

  const toggleExpanded = (pathId: string) => {
    setExpandedPathId(expandedPathId === pathId ? null : pathId);
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4">
          <Lock className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Login Required
        </h3>
        <p className="text-gray-600">
          Please login to view your saved learning paths.
        </p>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 rounded-2xl p-8">
          <div className="h-8 w-64 bg-white/20 rounded-lg animate-pulse mb-3" />
          <div className="h-4 w-48 bg-white/15 rounded animate-pulse" />
        </div>
        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/5" />
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  <div className="h-6 w-24 bg-gray-200 rounded-full" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-2/5" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-20 bg-gray-200 rounded-lg" />
                <div className="h-9 w-20 bg-gray-200 rounded-lg" />
                <div className="h-9 w-24 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={loadSavedPaths}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (savedPaths.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white rounded-2xl p-8">
          <h2 className="text-2xl font-extrabold mb-3">Saved Learning Paths</h2>
          <p className="text-blue-100">
            View and manage your saved learning paths from AI Search and
            Learning Path Generator.
          </p>
        </div>

        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-gray-400 text-6xl font-bold mb-4">○</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            No Saved Learning Paths Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by using the AI Search or Learning Path Generator to create
            personalized learning paths, then save them for easy access later.
          </p>
          <div className="flex gap-4 justify-center">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
              Use "Save Learning Path" buttons in other tabs
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleDeleteCancel}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
            <button
              onClick={handleDeleteCancel}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
              Delete Learning Path?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              <span className="font-medium text-gray-700">&ldquo;{deletePathName}&rdquo;</span> will be permanently removed. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white rounded-2xl p-8">
        <h2 className="text-2xl font-extrabold mb-3">Saved Learning Paths</h2>
        <p className="text-blue-100 mb-4">
          You have {savedPaths.length} saved learning path
          {savedPaths.length !== 1 ? "s" : ""}.
        </p>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="text-sm">
            <strong>Tip:</strong> Click on any path to expand and view all
            courses. You can rename or delete paths anytime.
          </p>
        </div>
      </div>

      {/* Saved Paths List */}
      <div className="space-y-4">
        {savedPaths.map((path) => (
          <div
            key={path.pathId}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all"
          >
            {/* Path Header */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {editingPathId === path.pathId ? (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(path.pathId)}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      {path.pathName}
                    </h3>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        path.pathType === "ai_search"
                          ? "bg-blue-100 text-blue-700"
                          : path.pathType === "ai_generator"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {path.pathType === "ai_search"
                        ? "AI Search"
                        : path.pathType === "ai_generator"
                        ? "AI Generator"
                        : "Manual Selection"}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {path.targetSkill}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {path.courses.length} courses
                    </span>
                    {path.metadata?.avgRating && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                        {path.metadata.avgRating.toFixed(1)}
                      </span>
                    )}
                    {path.metadata?.difficulty && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          path.metadata.difficulty === "Beginner"
                            ? "bg-green-100 text-green-700"
                            : path.metadata.difficulty === "Progressive"
                              ? "bg-gradient-to-r from-green-100 to-red-100 text-gray-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {path.metadata.difficulty}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500">
                    Saved on {new Date(path.createdAt).toLocaleDateString()} at{" "}
                    {new Date(path.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEdit(path)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(path)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button
                    onClick={() => toggleExpanded(path.pathId)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    {expandedPathId === path.pathId ? (
                      <><ChevronUp className="w-4 h-4" /> Collapse</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> Expand</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Course List */}
            {expandedPathId === path.pathId && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                {/* Enrollment Controls */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">
                    Courses in This Path:
                  </h4>
                  {path.enrollment?.isEnrolled ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium">
                        <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                        Enrolled &middot; {getCompletedCount(path)}/{path.courses.length} completed
                      </span>
                      <button
                        onClick={() => handleUnenroll(path.pathId)}
                        disabled={unenrollingPathId === path.pathId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        {unenrollingPathId === path.pathId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        Reset Progress
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEnroll(path.pathId)}
                      disabled={enrollingPathId === path.pathId}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium shadow disabled:opacity-50"
                    >
                      {enrollingPathId === path.pathId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Enroll in Path
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {path.enrollment?.isEnrolled && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${(getCompletedCount(path) / path.courses.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Hint banner when not enrolled */}
                  {!path.enrollment?.isEnrolled && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                      <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <p className="text-sm text-amber-800">
                        <strong>Enroll in this path</strong> to unlock courses, track your progress, and take quizzes.
                      </p>
                    </div>
                  )}

                  {path.courses.map((course, idx) => {
                    const progress = getCourseStatus(path, course.id);
                    const isEnrolled = path.enrollment?.isEnrolled;
                    const isLocked = !isEnrolled || progress?.status === "locked";
                    const isCompleted = isEnrolled === true && progress?.status === "completed";
                    const isUnlocked = isEnrolled === true && progress?.status === "unlocked";

                    return (
                    <div
                      key={course.id}
                      className={`border rounded-lg p-4 transition-shadow ${
                        isLocked
                          ? "bg-gray-100 border-gray-300 opacity-60"
                          : isCompleted
                            ? "bg-green-50 border-green-300"
                            : "bg-white border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            isCompleted
                              ? "bg-green-600 text-white"
                              : isLocked
                                ? "bg-gray-400 text-white"
                                : "bg-blue-700 text-white"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className={`font-semibold ${isLocked ? "text-gray-500" : "text-gray-800"}`}>
                              {course.name}
                            </h5>
                            {isLocked && (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                                Locked
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-xs px-2 py-0.5 bg-green-200 text-green-700 rounded-full">
                                Completed
                              </span>
                            )}
                            {isUnlocked && isEnrolled && (
                              <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-700 rounded-full animate-pulse">
                                Current
                              </span>
                            )}
                          </div>

                          {!isLocked && course.description && (
                            <ul className="list-disc pl-5 text-gray-600 mb-3 text-sm space-y-1">
                              {formatDescriptionAsPoints(course.description)
                                .slice(0, 3)
                                .map((point, pidx) => (
                                  <li key={pidx}>{point}</li>
                                ))}
                            </ul>
                          )}

                          {!isLocked && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {course.university && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                  {course.university}
                                </span>
                              )}
                              {course.rating && (
                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-semibold">
                                  {course.rating.toFixed(1)}
                                </span>
                              )}
                              {course.difficulty && (
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    course.difficulty === "Beginner"
                                      ? "bg-green-100 text-green-700"
                                      : course.difficulty === "Intermediate"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {course.difficulty}
                                </span>
                              )}
                              {(course as AISearchResult).similarity_score && (
                                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                  {(
                                    (course as AISearchResult).similarity_score *
                                    100
                                  ).toFixed(0)}
                                  % Match
                                </span>
                              )}
                            </div>
                          )}

                          {!isLocked && course.skills && course.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {course.skills.slice(0, 5).map((skill, sidx) => (
                                <span
                                  key={sidx}
                                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                              {course.skills.length > 5 && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  +{course.skills.length - 5} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Quiz Results for completed courses */}
                          {isCompleted && progress?.quizResult && (
                            <div className="mt-2 p-3 bg-green-100 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-sm">
                                <Trophy className="w-4 h-4 text-green-700" />
                                <span className="font-semibold text-green-800">
                                  Quiz Score: {progress.quizResult.score}/{progress.quizResult.totalQuestions} ({progress.quizResult.percentage}%)
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            {!isLocked && (
                              <a
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-4 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all text-sm font-medium"
                              >
                                Enroll
                              </a>
                            )}
                            {isUnlocked && isEnrolled && (
                              <button
                                onClick={() => handleMarkComplete(path.pathId, course.id, course.name)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium shadow"
                              >
                                <BookOpen className="w-4 h-4" />
                                Mark as Completed
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quiz Modal */}
      {quizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={quizModal.result ? closeQuizModal : undefined} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <button
              onClick={closeQuizModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Loading state */}
            {quizModal.loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h3 className="text-base font-bold text-gray-900 mb-2">Generating Quiz...</h3>
                <p className="text-gray-500 text-sm text-center">
                  AI is creating 5 questions for <strong>{quizModal.courseName}</strong>
                </p>
              </div>
            )}

            {/* Quiz Questions */}
            {!quizModal.loading && quizModal.quizData && !quizModal.result && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Course Quiz</h3>
                    <p className="text-sm text-gray-500">{quizModal.courseName}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {quizModal.quizData.questions.map((q, qIdx) => (
                    <div key={qIdx} className="border border-gray-200 rounded-lg p-4">
                      <p className="font-medium text-gray-800 mb-3">
                        <span className="text-blue-600 font-bold mr-2">Q{qIdx + 1}.</span>
                        {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((option, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              quizModal.answers[qIdx] === oIdx
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qIdx}`}
                              checked={quizModal.answers[qIdx] === oIdx}
                              onChange={() => handleQuizAnswer(qIdx, oIdx)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={quizModal.submitting || quizModal.answers.some((a) => a === -1)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quizModal.submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Submit Quiz
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Results */}
            {quizModal.result && (
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  quizModal.result.percentage >= 80
                    ? "bg-green-100"
                    : quizModal.result.percentage >= 50
                      ? "bg-yellow-100"
                      : "bg-red-100"
                }`}>
                  <Trophy className={`w-10 h-10 ${
                    quizModal.result.percentage >= 80
                      ? "text-green-600"
                      : quizModal.result.percentage >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`} />
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-1">Quiz Completed!</h3>
                <p className="text-gray-600 mb-4">{quizModal.courseName}</p>

                <div className="text-5xl font-bold mb-2">
                  <span className={
                    quizModal.result.percentage >= 80
                      ? "text-green-600"
                      : quizModal.result.percentage >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }>
                    {quizModal.result.score}/{quizModal.result.totalQuestions}
                  </span>
                </div>
                <p className="text-lg text-gray-500 mb-6">{quizModal.result.percentage}% correct</p>

                {/* Show each question result */}
                <div className="text-left space-y-3 mb-6">
                  {quizModal.result.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className={`p-3 rounded-lg border ${
                        q.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {q.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{q.question}</p>
                          {!q.isCorrect && (
                            <p className="text-xs text-gray-500 mt-1">
                              Your answer: <span className="text-red-600">{q.options[q.userAnswer!]}</span>
                              {" · "}
                              Correct: <span className="text-green-600">{q.options[q.correctAnswer!]}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={closeQuizModal}
                  className="px-6 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all font-medium shadow"
                >
                  Continue Learning
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
