import { useState, useEffect } from "react";
import {
  getSavedLearningPaths,
  deleteLearningPath,
  updateLearningPathName,
  type SavedLearningPath,
  type AISearchResult,
} from "../api";
import { useAuth } from "../contexts/AuthContext";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSavedPaths();
    }
  }, [user]);

  const loadSavedPaths = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSavedLearningPaths();
      setSavedPaths(response.data.learningPaths);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load saved paths");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pathId: string) => {
    if (!confirm("Are you sure you want to delete this learning path?")) {
      return;
    }

    try {
      await deleteLearningPath(pathId);
      setSavedPaths(savedPaths.filter((p) => p.pathId !== pathId));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete path");
    }
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
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Login Required
        </h3>
        <p className="text-gray-600">
          Please login to view your saved learning paths.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
          <p className="text-gray-600">Loading saved learning paths...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={loadSavedPaths}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (savedPaths.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-3">📚 Saved Learning Paths</h2>
          <p className="text-indigo-100">
            View and manage your saved learning paths from AI Search and
            Learning Path Generator.
          </p>
        </div>

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            No Saved Learning Paths Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by using the AI Search or Learning Path Generator to create
            personalized learning paths, then save them for easy access later.
          </p>
          <div className="flex gap-4 justify-center">
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg">
              💾 Use "Save Learning Path" buttons in other tabs
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-3">📚 Saved Learning Paths</h2>
        <p className="text-indigo-100 mb-4">
          You have {savedPaths.length} saved learning path
          {savedPaths.length !== 1 ? "s" : ""}.
        </p>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="text-sm">
            💡 <strong>Tip:</strong> Click on any path to expand and view all
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
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        ✕
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
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {path.pathType === "ai_search"
                        ? "🔍 AI Search"
                        : "🤖 AI Generator"}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      🎯 {path.targetSkill}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      📚 {path.courses.length} courses
                    </span>
                    {path.metadata?.avgRating && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                        ⭐ {path.metadata.avgRating.toFixed(1)}
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
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium"
                  >
                    ✏️ Rename
                  </button>
                  <button
                    onClick={() => handleDelete(path.pathId)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => toggleExpanded(path.pathId)}
                    className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all text-sm font-medium"
                  >
                    {expandedPathId === path.pathId ? "▲ Collapse" : "▼ Expand"}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Course List */}
            {expandedPathId === path.pathId && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-4">
                  📖 Courses in This Path:
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
                                🏫 {course.university}
                              </span>
                            )}
                            {course.rating && (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                ⭐ {course.rating.toFixed(1)}
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
