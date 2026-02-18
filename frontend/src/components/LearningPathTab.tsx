import { useState } from "react";
import { getLearningPath, saveLearningPath, type Course } from "../api";
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

export default function LearningPathTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 5;
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user } = useAuth();

  const [targetSkill, setTargetSkill] = useState("");

  const handleGeneratePath = async () => {
    if (!targetSkill) {
      setError("Please enter a target skill");
      return;
    }

    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    setCurrentPage(1);
    try {
      // Request a large number to get all available courses
      const data = await getLearningPath(
        targetSkill,
        undefined, // AI determines best starting point
        100, // Request up to 100 courses
      );
      setAllCourses(data);
      setCourses(data.slice(0, coursesPerPage));
    } catch (err) {
      setError("Failed to generate learning path");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLearningPath = async () => {
    if (!allCourses.length || !user) {
      setError("Please login to save learning paths");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Calculate metadata
      const avgRating =
        allCourses.reduce((sum, c) => sum + (c.rating || 0), 0) /
        allCourses.length;

      const difficulties = allCourses.map((c) => c.difficulty).filter(Boolean);
      const hasBeginner = difficulties.includes("Beginner");
      const hasAdvanced = difficulties.includes("Advanced");
      const difficulty =
        hasBeginner && hasAdvanced
          ? "Progressive"
          : hasBeginner
            ? "Beginner"
            : "Advanced";

      await saveLearningPath({
        pathName: `AI Generated: ${targetSkill}`,
        pathType: "ai_generator",
        targetSkill: targetSkill,
        courses: allCourses,
        metadata: {
          totalCourses: allCourses.length,
          avgRating: parseFloat(avgRating.toFixed(2)),
          difficulty: difficulty,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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

  const loadMoreCourses = () => {
    const nextPage = currentPage + 1;
    const startIndex = 0;
    const endIndex = nextPage * coursesPerPage;
    setCourses(allCourses.slice(startIndex, endIndex));
    setCurrentPage(nextPage);
  };

  const hasMoreCourses = allCourses.length > courses.length;

  return (
    <div className="space-y-6">
      {/* AI Feature Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">
          🤖 AI-Powered Learning Path Generator
        </h2>
        <p className="text-purple-100">
          Using Groq AI to create intelligent, personalized learning paths
          tailored to your goals
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🎯 What do you want to learn?
        </h3>
        <p className="text-gray-600 mb-6">
          Our AI will analyze available courses and create an optimal learning
          path from beginner to advanced
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Skill * (required)
            </label>
            <input
              type="text"
              placeholder="e.g., Machine Learning, Python, Data Science"
              value={targetSkill}
              onChange={(e) => setTargetSkill(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Information Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 text-2xl">💡</div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-purple-900 mb-1">
                  AI-Powered Smart Start
                </h4>
                <p className="text-sm text-purple-700">
                  Our AI automatically determines the best starting point based
                  on your target skill. It will begin with beginner courses and
                  progressively advance to intermediate and advanced levels.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleGeneratePath}
          disabled={!targetSkill || loading}
          className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed font-medium shadow-lg"
        >
          {loading ? (
            <>
              🤖 AI is analyzing courses...
              <div className="text-xs mt-1 opacity-90">
                This may take 5-10 seconds
              </div>
            </>
          ) : (
            <>
              🚀 Generate AI-Powered Learning Path
              <div className="text-xs mt-1 opacity-90">
                Powered by Groq AI • POST /learning-path
              </div>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          ❌ {error}
          {error.includes("Failed to generate") && (
            <p className="text-sm mt-2">
              Make sure your GROQ_API_KEY is configured in the backend .env file
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🤖 AI is curating your learning path...
              </h3>
              <p className="text-gray-600">
                Analyzing {targetSkill} courses across all difficulty levels
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span className="animate-pulse">●</span>
                <span>Finding relevant courses</span>
                <span className="animate-pulse">●</span>
                <span>Optimizing progression</span>
                <span className="animate-pulse">●</span>
                <span>Ranking by quality</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Path Results */}
      {!loading && courses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                🎯 Your Learning Path to "{targetSkill}"
              </h3>
              <p className="text-gray-600">
                Showing {courses.length} of {allCourses.length} courses • Follow
                this path to master {targetSkill}
              </p>
            </div>
            {user && (
              <button
                onClick={handleSaveLearningPath}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md text-sm flex items-center gap-2 whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>✓ Saved!</>
                ) : (
                  <>💾 Save Learning Path</>
                )}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {courses.map((course, idx) => (
              <div key={course.id} className="relative">
                {/* Connector Line */}
                {idx < courses.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-indigo-200 -mb-4"></div>
                )}

                <div className="flex gap-4">
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                    {idx + 1}
                  </div>

                  {/* Course Card */}
                  <div className="flex-1 border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                    <h4 className="font-semibold text-gray-800 text-lg mb-2">
                      {course.name}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-sm">
                        <span className="text-gray-600">University:</span>
                        <span className="ml-2 font-medium">
                          {course.university}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Rating:</span>
                        <span className="ml-2 text-yellow-500">
                          ⭐ {course.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          course.difficulty === "Beginner"
                            ? "bg-green-100 text-green-600"
                            : course.difficulty === "Intermediate"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-red-100 text-red-600"
                        }`}
                      >
                        {course.difficulty}
                      </span>
                    </div>

                    {/* Description as bullet points */}
                    {course.description && (
                      <ul className="list-disc pl-5 text-sm text-gray-600 mb-3 leading-relaxed space-y-1">
                        {formatDescriptionAsPoints(course.description)
                          .slice(0, 3)
                          .map((point, pointIdx) => (
                            <li key={pointIdx}>{point}</li>
                          ))}
                      </ul>
                    )}

                    {course.skills && course.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {course.skills.map((skill, skillIdx) => (
                          <span
                            key={skillIdx}
                            className={`text-xs px-2 py-1 rounded ${
                              skill
                                .toLowerCase()
                                .includes(targetSkill.toLowerCase())
                                ? "bg-indigo-100 text-indigo-600 font-semibold"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                    >
                      🔗 Enroll Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMoreCourses && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMoreCourses}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
              >
                📚 Load More Courses ({allCourses.length - courses.length}{" "}
                remaining)
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">
              ✅ Learning Path Summary
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Total Courses Available: {allCourses.length}</li>
              <li>• Showing: {courses.length} courses</li>
              <li>• Target Skill: {targetSkill}</li>
              <li>
                • Difficulty Progression:{" "}
                {courses.map((c) => c.difficulty).join(" → ")}
              </li>
              <li>
                • Average Rating:{" "}
                {(
                  courses.reduce((sum, c) => sum + c.rating, 0) / courses.length
                ).toFixed(1)}{" "}
                ⭐
              </li>
            </ul>
          </div>
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          Enter a target skill above to generate your personalized learning path
        </div>
      )}
    </div>
  );
}
