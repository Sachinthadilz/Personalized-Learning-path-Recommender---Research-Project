import { useState } from "react";
import {
  aiSemanticSearch,
  saveLearningPath,
  type LearningPathResponse,
  type AISearchResult,
  type CrossDomainCourse,
} from "../api";
import LearningPathGraphD3 from "./LearningPathGraphD3";
import { useAuth } from "../contexts/AuthContext";

// Helper function to format description as bullet points
const formatDescriptionAsPoints = (
  description: string | undefined,
): string[] => {
  if (!description) return [];

  // Split by sentence boundaries (period + space + capital letter or newline)
  let points = description
    .split(/\.(?=\s+[A-Z])|\.\s*\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  // Add periods back to sentences that don't end with punctuation
  points = points.map((point) => {
    if (!/[.!?]$/.test(point)) {
      return point + ".";
    }
    return point;
  });

  return points.length > 0 ? points : [description];
};

// Course Card Component
function CourseCard({
  course,
  levelColor,
  isSelected,
  onToggleSelect,
  showCheckbox = false,
}: {
  course: AISearchResult;
  levelColor: string;
  isSelected?: boolean;
  onToggleSelect?: (courseId: string) => void;
  showCheckbox?: boolean;
}) {
  const borderColors = {
    green: "hover:border-blue-400",
    yellow: "hover:border-yellow-400",
    red: "hover:border-red-400",
  };

  const scoreColors = {
    green: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-6 hover:shadow-xl transition-all ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      } ${borderColors[levelColor as keyof typeof borderColors]}`}
    >
      {showCheckbox && onToggleSelect && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => onToggleSelect(course.id)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">
            {isSelected ? "Selected" : "Select"}
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{course.name}</h3>
              <p className="text-sm text-gray-600">{course.university}</p>
            </div>
          </div>

          {/* Description as bullet points */}
          {course.description && (
            <ul className="list-disc pl-5 text-gray-700 mb-4 leading-relaxed space-y-1.5">
              {formatDescriptionAsPoints(course.description)
                .slice(0, 4)
                .map((point, idx) => (
                  <li key={idx} className="text-sm">
                    {point}
                  </li>
                ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              Rating: {course.rating?.toFixed(1) ?? "N/A"}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                scoreColors[levelColor as keyof typeof scoreColors]
              }`}
            >
              {(course.similarity_score * 100).toFixed(0)}% Match
            </span>
          </div>

          {course.skills && course.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {course.skills.slice(0, 6).map((skill, skillIdx) => (
                <span
                  key={skillIdx}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                >
                  {skill}
                </span>
              ))}
              {course.skills.length > 6 && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  +{course.skills.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <a
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all shadow-md text-sm font-medium whitespace-nowrap"
          >
            View Course →
          </a>
        </div>
      </div>

      {/* Similarity Score Bar */}
      <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            levelColor === "green"
              ? "bg-gradient-to-r from-blue-400 to-sky-500"
              : levelColor === "yellow"
                ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                : "bg-gradient-to-r from-red-400 to-rose-500"
          }`}
          style={{ width: `${course.similarity_score * 100}%` }}
        ></div>
      </div>
    </div>
  );
}

// Cross-Domain Card Component
function CrossDomainCard({
  item,
  isSelected,
  onToggleSelect,
  showCheckbox = false,
}: {
  item: CrossDomainCourse;
  isSelected?: boolean;
  onToggleSelect?: (courseId: string) => void;
  showCheckbox?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-2xl p-6 hover:shadow-xl transition-all ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-blue-200"
      } hover:border-blue-400`}
    >
      {showCheckbox && onToggleSelect && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => onToggleSelect(item.id)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">
            {isSelected ? "Selected" : "Select"}
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {item.domain}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                item.difficulty === "Beginner"
                  ? "bg-blue-100 text-blue-700"
                  : item.difficulty === "Intermediate"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {item.difficulty}
            </span>
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-2">
            {item.course}
          </h3>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
            <p className="text-sm text-blue-900">
              <strong>Why this matters:</strong> {item.reason}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              Rating: {item.rating?.toFixed(1) ?? "N/A"}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {(item.similarity_score * 100).toFixed(0)}% Match
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {(item.skill_overlap * 100).toFixed(0)}% Skill Overlap
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all shadow-md text-sm font-medium whitespace-nowrap"
            >
              Explore →
            </a>
          ) : (
            <span className="px-6 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium whitespace-nowrap cursor-not-allowed">
              No URL
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AISearchTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LearningPathResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user } = useAuth();

  // Manual selection state
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set(),
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [customPathName, setCustomPathName] = useState("");
  const [saveMode, setSaveMode] = useState<"all" | "selected">("all");

  // Pagination state for each difficulty level
  const [beginnerPage, setBeginnerPage] = useState(1);
  const [intermediatePage, setIntermediatePage] = useState(1);
  const [advancedPage, setAdvancedPage] = useState(1);
  const coursesPerPage = 5;

  // Helper functions for pagination
  const getVisibleCourses = (courses: AISearchResult[], page: number) => {
    return courses.slice(0, page * coursesPerPage);
  };

  const hasMoreCourses = (coursesLength: number, page: number) => {
    return coursesLength > page * coursesPerPage;
  };

  const getRemainingCount = (coursesLength: number, page: number) => {
    return Math.min(coursesPerPage, coursesLength - page * coursesPerPage);
  };

  const showAllCourses = (
    coursesLength: number,
    setPage: (page: number) => void,
  ) => {
    setPage(Math.ceil(coursesLength / coursesPerPage));
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    setBeginnerPage(1);
    setIntermediatePage(1);
    setAdvancedPage(1);
    setSelectedCourses(new Set());
    const startTime = performance.now();

    try {
      const data = await aiSemanticSearch(query, 100);
      setResults(data);
      const endTime = performance.now();
      setSearchTime((endTime - startTime) / 1000);
    } catch (err) {
      setError("AI search failed. Make sure embeddings are generated first.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelection = (courseId: string) => {
    const newSelection = new Set(selectedCourses);
    if (newSelection.has(courseId)) {
      newSelection.delete(courseId);
    } else {
      newSelection.add(courseId);
    }
    setSelectedCourses(newSelection);
  };

  const handleSelectAll = () => {
    if (!results) return;

    const allCourses = [
      ...results.learning_path.beginner,
      ...results.learning_path.intermediate,
      ...results.learning_path.advanced,
      ...results.cross_domain_courses,
    ];

    if (selectedCourses.size > 0) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(allCourses.map((c) => c.id)));
    }
  };

  const handleOpenSaveModal = (mode: "all" | "selected") => {
    if (mode === "selected" && selectedCourses.size === 0) {
      alert("Please select at least one course to save");
      return;
    }
    setSaveMode(mode);
    setCustomPathName(mode === "all" ? `AI Search: ${query}` : "");
    setShowSaveModal(true);
    setSaveSuccess(false);
  };

  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    setCustomPathName("");
    setSaveSuccess(false);
  };

  const handleSaveFromModal = async () => {
    if (!customPathName.trim()) {
      alert("Please enter a name for this learning path");
      return;
    }
    if (!results || !user) {
      setError("Please login to save learning paths");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let coursesToSave: AISearchResult[];
      let pathType: "ai_search" | "manual";

      if (saveMode === "all") {
        coursesToSave = [
          ...results.learning_path.beginner,
          ...results.learning_path.intermediate,
          ...results.learning_path.advanced,
        ];
        pathType = "ai_search";
      } else {
        const allCourses = [
          ...results.learning_path.beginner,
          ...results.learning_path.intermediate,
          ...results.learning_path.advanced,
          ...results.cross_domain_courses.map((cd) => ({
            id: cd.id,
            name: cd.course,
            url: cd.url,
            description: cd.reason,
            rating: cd.rating,
            difficulty: cd.difficulty,
            skills: [],
            similarity_score: cd.similarity_score,
          })),
        ];
        coursesToSave = allCourses.filter((c) => selectedCourses.has(c.id));
        pathType = "manual";
      }

      const avgRating =
        coursesToSave.reduce((sum, c) => sum + (c.rating || 0), 0) /
        coursesToSave.length;

      await saveLearningPath({
        pathName: customPathName.trim(),
        pathType: pathType,
        targetSkill: query,
        courses: coursesToSave,
        metadata: {
          totalCourses: coursesToSave.length,
          avgRating: parseFloat(avgRating.toFixed(2)),
          difficulty: saveMode === "all" ? "Mixed" : undefined,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => {
        handleCloseSaveModal();
        if (saveMode === "selected") {
          setSelectedCourses(new Set());
        }
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save learning path";
      if (
        errorMessage.includes("User not found") ||
        err.response?.status === 401
      ) {
        setError("Session expired. Please login again to save learning paths.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const exampleQueries = [
    "machine learning for beginners",
    "advanced data science with Python",
    "web development with JavaScript",
    "cloud computing and AWS",
    "artificial intelligence and neural networks",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-2xl p-8">
        <h2 className="text-2xl font-extrabold mb-3">
          AI-Powered Learning Path Discovery
        </h2>
        <p className="text-blue-100 mb-4">
          Get personalized learning paths with courses organized from Beginner →
          Intermediate → Advanced, plus cross-domain discoveries!
        </p>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="text-sm">
            <strong>New:</strong> Our AI now creates structured learning paths
            and suggests relevant courses from other domains to broaden your
            knowledge.
          </p>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder='Describe what you want to learn... (e.g., "learn Python for data analysis")'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-6 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Searching...
              </span>
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Example Queries */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2 font-medium">
            Try these examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 font-medium">{error}</p>
          {error.includes("AI search failed") && (
            <p className="text-sm text-red-500 mt-2">
              Run{" "}
              <code className="bg-red-100 px-2 py-1 rounded">
                python vector_setup.py
              </code>{" "}
              to generate embeddings first.
            </p>
          )}
        </div>
      )}

      {/* Results Header */}
      {!loading && results && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-green-700 font-medium">
              Found {results.summary.total_courses} relevant courses in{" "}
              {searchTime.toFixed(2)}s
            </p>
            {user && (
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {selectedCourses.size > 0 ? "Deselect All" : "Select All"}
                </button>
                {selectedCourses.size > 0 && (
                  <button
                    onClick={() => handleOpenSaveModal("selected")}
                    className="px-4 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all font-medium shadow-md text-sm"
                  >
                    Save Selected ({selectedCourses.size})
                  </button>
                )}
                <button
                  onClick={() => handleOpenSaveModal("all")}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md text-sm flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>Saved!</>
                  ) : (
                    <>Save All Courses</>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-4 text-sm items-center">
            <span className="text-green-600 font-medium">
              Beginner: {results.summary.beginner_count}
            </span>
            <span className="text-yellow-600 font-medium">
              Intermediate: {results.summary.intermediate_count}
            </span>
            <span className="text-red-600 font-medium">
              Advanced: {results.summary.advanced_count}
            </span>
            {results.summary.cross_domain_count > 0 && (
              <span className="text-blue-600 font-medium">
                Cross-Domain: {results.summary.cross_domain_count}
              </span>
            )}

            {/* View Mode Toggle */}
            <div className="ml-auto flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-1 rounded-md font-medium text-sm transition-all ${
                  viewMode === "list"
                    ? "bg-white text-blue-700 shadow"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("graph")}
                className={`px-4 py-1 rounded-md font-medium text-sm transition-all ${
                  viewMode === "graph"
                    ? "bg-white text-blue-700 shadow"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Graph View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Graph View */}
      {!loading && results && viewMode === "graph" && (
        <LearningPathGraphD3
          learningPath={results.learning_path}
          crossDomainCourses={results.cross_domain_courses}
        />
      )}

      {/* Learning Path Results */}
      {!loading && results && viewMode === "list" && (
        <div className="space-y-6">
          {/* Beginner Courses */}
          {results.learning_path.beginner.length > 0 && (
            <div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      Beginner Level ({results.learning_path.beginner.length})
                    </h3>
                    <p className="text-green-100 mt-1">
                      Start your learning journey here • Showing{" "}
                      {
                        getVisibleCourses(
                          results.learning_path.beginner,
                          beginnerPage,
                        ).length
                      }{" "}
                      of {results.learning_path.beginner.length}
                    </p>
                  </div>
                  {hasMoreCourses(
                    results.learning_path.beginner.length,
                    beginnerPage,
                  ) && (
                    <button
                      onClick={() =>
                        showAllCourses(
                          results.learning_path.beginner.length,
                          setBeginnerPage,
                        )
                      }
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium"
                    >
                      Show All
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {getVisibleCourses(
                  results.learning_path.beginner,
                  beginnerPage,
                ).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    levelColor="green"
                    isSelected={selectedCourses.has(course.id)}
                    onToggleSelect={handleToggleSelection}
                    showCheckbox={user !== null}
                  />
                ))}
              </div>
              {hasMoreCourses(
                results.learning_path.beginner.length,
                beginnerPage,
              ) && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setBeginnerPage(beginnerPage + 1)}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium shadow-sm"
                  >
                    Load More Beginner Courses (
                    {getRemainingCount(
                      results.learning_path.beginner.length,
                      beginnerPage,
                    )}{" "}
                    more)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Intermediate Courses */}
          {results.learning_path.intermediate.length > 0 && (
            <div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      Intermediate Level (
                      {results.learning_path.intermediate.length})
                    </h3>
                    <p className="text-yellow-100 mt-1">
                      Build on your foundation • Showing{" "}
                      {
                        getVisibleCourses(
                          results.learning_path.intermediate,
                          intermediatePage,
                        ).length
                      }{" "}
                      of {results.learning_path.intermediate.length}
                    </p>
                  </div>
                  {hasMoreCourses(
                    results.learning_path.intermediate.length,
                    intermediatePage,
                  ) && (
                    <button
                      onClick={() =>
                        showAllCourses(
                          results.learning_path.intermediate.length,
                          setIntermediatePage,
                        )
                      }
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium"
                    >
                      Show All
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {getVisibleCourses(
                  results.learning_path.intermediate,
                  intermediatePage,
                ).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    levelColor="yellow"
                    isSelected={selectedCourses.has(course.id)}
                    onToggleSelect={handleToggleSelection}
                    showCheckbox={user !== null}
                  />
                ))}
              </div>
              {hasMoreCourses(
                results.learning_path.intermediate.length,
                intermediatePage,
              ) && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setIntermediatePage(intermediatePage + 1)}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all font-medium shadow-sm"
                  >
                    Load More Intermediate Courses (
                    {getRemainingCount(
                      results.learning_path.intermediate.length,
                      intermediatePage,
                    )}{" "}
                    more)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Advanced Courses */}
          {results.learning_path.advanced.length > 0 && (
            <div>
              <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      Advanced Level ({results.learning_path.advanced.length})
                    </h3>
                    <p className="text-red-100 mt-1">
                      Master advanced concepts • Showing{" "}
                      {
                        getVisibleCourses(
                          results.learning_path.advanced,
                          advancedPage,
                        ).length
                      }{" "}
                      of {results.learning_path.advanced.length}
                    </p>
                  </div>
                  {hasMoreCourses(
                    results.learning_path.advanced.length,
                    advancedPage,
                  ) && (
                    <button
                      onClick={() =>
                        showAllCourses(
                          results.learning_path.advanced.length,
                          setAdvancedPage,
                        )
                      }
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium"
                    >
                      Show All
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {getVisibleCourses(
                  results.learning_path.advanced,
                  advancedPage,
                ).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    levelColor="red"
                    isSelected={selectedCourses.has(course.id)}
                    onToggleSelect={handleToggleSelection}
                    showCheckbox={user !== null}
                  />
                ))}
              </div>
              {hasMoreCourses(
                results.learning_path.advanced.length,
                advancedPage,
              ) && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setAdvancedPage(advancedPage + 1)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-sm"
                  >
                    Load More Advanced Courses (
                    {getRemainingCount(
                      results.learning_path.advanced.length,
                      advancedPage,
                    )}{" "}
                    more)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cross-Domain Recommendations */}
          {results.cross_domain_courses.length > 0 && (
            <div>
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-2xl p-4 mb-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  Cross-Domain Discoveries (
                  {results.cross_domain_courses.length})
                </h3>
                <p className="text-blue-100 mt-1">
                  Expand your horizons with related courses from other domains
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {results.cross_domain_courses.map((item) => (
                  <CrossDomainCard
                    key={item.id}
                    item={item}
                    isSelected={selectedCourses.has(item.id)}
                    onToggleSelect={handleToggleSelection}
                    showCheckbox={user !== null}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && results && results.summary.total_courses === 0 && query && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-600 text-lg font-medium">
            No courses found matching your query. Try different keywords or
            check if embeddings are generated.
          </p>
        </div>
      )}

      {!query && !loading && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-50 border-2 border-blue-200 rounded-lg p-12 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Ready to discover your learning path?
          </h3>
          <p className="text-gray-600 mb-6">
            Enter a natural language description of what you want to learn, and
            our AI will create a structured learning path with cross-domain
            discoveries.
          </p>
          <div className="bg-white rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-gray-700 mb-2 font-semibold">
              What you'll get:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>
                • <strong>Beginner</strong> courses to start your journey
              </li>
              <li>
                • <strong>Intermediate</strong> courses to build skills
              </li>
              <li>
                • <strong>Advanced</strong> courses to master concepts
              </li>
              <li>
                • <strong>Cross-domain</strong> courses to broaden perspective
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Save Learning Path
              </h3>
              <button
                onClick={handleCloseSaveModal}
                disabled={saving}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {saveSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-green-600">
                  Saved Successfully!
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Path Name
                  </label>
                  <input
                    type="text"
                    value={customPathName}
                    onChange={(e) => setCustomPathName(e.target.value)}
                    placeholder="e.g., My AI Learning Path"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    autoFocus
                  />
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    {saveMode === "all"
                      ? `Saving all ${results?.summary.total_courses} courses from AI search`
                      : `Saving ${selectedCourses.size} selected courses`}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Target Skill: {query}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSaveFromModal}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Learning Path"}
                  </button>
                  <button
                    onClick={handleCloseSaveModal}
                    disabled={saving}
                    className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
