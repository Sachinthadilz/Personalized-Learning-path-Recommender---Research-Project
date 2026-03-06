import { useState, useEffect, useCallback } from "react";
import {
  getSavedLearningPaths,
  deleteLearningPath,
  updateLearningPathName,
  type SavedLearningPath,
  type AISearchResult,
} from "../api";
import { useAuth } from "../contexts/AuthContext";
import { Lock, Trash2, AlertTriangle, X, ChevronDown, ChevronUp, Pencil } from "lucide-react";

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

  const toggleExpanded = (pathId: string) => {
    setExpandedPathId(expandedPathId === pathId ? null : pathId);
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4">
          <Lock className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
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
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8">
          <div className="h-8 w-64 bg-white/20 rounded-lg animate-pulse mb-3" />
          <div className="h-4 w-48 bg-white/15 rounded animate-pulse" />
        </div>
        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border-2 border-gray-100 rounded-lg shadow p-6 animate-pulse">
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
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
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-3">Saved Learning Paths</h2>
          <p className="text-indigo-100">
            View and manage your saved learning paths from AI Search and
            Learning Path Generator.
          </p>
        </div>

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-gray-400 text-6xl font-bold mb-4">○</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            No Saved Learning Paths Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by using the AI Search or Learning Path Generator to create
            personalized learning paths, then save them for easy access later.
          </p>
          <div className="flex gap-4 justify-center">
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg">
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
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-3">Saved Learning Paths</h2>
        <p className="text-indigo-100 mb-4">
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
            className="bg-white border-2 border-gray-200 rounded-lg shadow hover:shadow-lg transition-all"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(path.pathId)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {path.pathName}
                    </h3>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        path.pathType === "ai_search"
                          ? "bg-purple-100 text-purple-700"
                          : path.pathType === "ai_generator"
                          ? "bg-indigo-100 text-indigo-700"
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(path)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button
                    onClick={() => toggleExpanded(path.pathId)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
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
                <h4 className="font-semibold text-gray-800 mb-4">
                  Courses in This Path:
                </h4>
                <div className="space-y-3">
                  {path.courses.map((course, idx) => (
                    <div
                      key={course.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800 mb-2">
                            {course.name}
                          </h5>

                          {course.description && (
                            <ul className="list-disc pl-5 text-gray-600 mb-3 text-sm space-y-1">
                              {formatDescriptionAsPoints(course.description)
                                .slice(0, 3)
                                .map((point, pidx) => (
                                  <li key={pidx}>{point}</li>
                                ))}
                            </ul>
                          )}

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
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                {(
                                  (course as AISearchResult).similarity_score *
                                  100
                                ).toFixed(0)}
                                % Match
                              </span>
                            )}
                          </div>

                          {course.skills && course.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {course.skills.slice(0, 5).map((skill, sidx) => (
                                <span
                                  key={sidx}
                                  className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded"
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

                          <a
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all text-sm font-medium"
                          >
                            View Course →
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
