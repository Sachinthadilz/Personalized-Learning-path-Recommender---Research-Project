import { useState } from "react";
import {
  aiSemanticSearch,
  type LearningPathResponse,
  type AISearchResult,
  type CrossDomainCourse,
} from "../api";
import LearningPathGraphD3 from "./LearningPathGraphD3";

// Course Card Component
function CourseCard({
  course,
  levelColor,
}: {
  course: AISearchResult;
  levelColor: string;
}) {
  const borderColors = {
    green: "hover:border-green-400",
    yellow: "hover:border-yellow-400",
    red: "hover:border-red-400",
  };

  const scoreColors = {
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div
      className={`bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-xl transition-all ${
        borderColors[levelColor as keyof typeof borderColors]
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{course.name}</h3>
              <p className="text-sm text-gray-600">{course.university}</p>
            </div>
          </div>

          <p className="text-gray-700 mb-4 leading-relaxed line-clamp-3">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              ⭐ {course.rating?.toFixed(1) ?? "N/A"}
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
                  className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded"
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
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md text-sm font-medium whitespace-nowrap"
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
              ? "bg-gradient-to-r from-green-400 to-emerald-500"
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
function CrossDomainCard({ item }: { item: CrossDomainCourse }) {
  return (
    <div className="bg-white border-2 border-purple-200 rounded-lg p-6 hover:shadow-xl hover:border-purple-400 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
              🌐 {item.domain}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                item.difficulty === "Beginner"
                  ? "bg-green-100 text-green-700"
                  : item.difficulty === "Intermediate"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {item.difficulty}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {item.course}
          </h3>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-purple-900">
              <strong>Why this matters:</strong> {item.reason}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              ⭐ {item.rating?.toFixed(1) ?? "N/A"}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {(item.similarity_score * 100).toFixed(0)}% Match
            </span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
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
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md text-sm font-medium whitespace-nowrap"
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

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const data = await aiSemanticSearch(query, 30);
      setResults(data);
      const endTime = performance.now();
      setSearchTime((endTime - startTime) / 1000);
    } catch (err) {
      setError("AI search failed. Make sure embeddings are generated first.");
    } finally {
      setLoading(false);
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
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-3">
          🤖 AI-Powered Learning Path Discovery
        </h2>
        <p className="text-purple-100 mb-4">
          Get personalized learning paths with courses organized from Beginner →
          Intermediate → Advanced, plus cross-domain discoveries!
        </p>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="text-sm">
            💡 <strong>New!</strong> Our AI now creates structured learning
            paths and suggests relevant courses from other domains to broaden
            your knowledge.
          </p>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder='Describe what you want to learn... (e.g., "learn Python for data analysis")'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Searching...
              </span>
            ) : (
              "🔍 AI Search"
            )}
          </button>
        </div>

        {/* Example Queries */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">💡 Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="text-sm px-3 py-1 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Endpoint:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">POST /ai-search</code>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">❌ {error}</p>
          <p className="text-sm text-red-500 mt-2">
            Run{" "}
            <code className="bg-red-100 px-2 py-1 rounded">
              python vector_setup.py
            </code>{" "}
            to generate embeddings first.
          </p>
        </div>
      )}

      {/* Results Header */}
      {!loading && results && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 font-medium">
            ✨ Found {results.summary.total_courses} relevant courses in{" "}
            {searchTime.toFixed(2)}s
          </p>
          <div className="mt-2 flex gap-4 text-sm items-center">
            <span className="text-green-600">
              🟢 Beginner: {results.summary.beginner_count}
            </span>
            <span className="text-yellow-600">
              🟡 Intermediate: {results.summary.intermediate_count}
            </span>
            <span className="text-red-600">
              🔴 Advanced: {results.summary.advanced_count}
            </span>
            {results.summary.cross_domain_count > 0 && (
              <span className="text-purple-600">
                🌐 Cross-Domain: {results.summary.cross_domain_count}
              </span>
            )}

            {/* View Mode Toggle */}
            <div className="ml-auto flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-1 rounded-md font-medium text-sm transition-all ${
                  viewMode === "list"
                    ? "bg-white text-indigo-600 shadow"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                📋 List View
              </button>
              <button
                onClick={() => setViewMode("graph")}
                className={`px-4 py-1 rounded-md font-medium text-sm transition-all ${
                  viewMode === "graph"
                    ? "bg-white text-indigo-600 shadow"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                🔗 Graph View
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
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4 mb-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  🟢 Beginner Level ({results.learning_path.beginner.length})
                </h3>
                <p className="text-green-100 mt-1">
                  Start your learning journey here
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {results.learning_path.beginner.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    levelColor="green"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Intermediate Courses */}
          {results.learning_path.intermediate.length > 0 && (
            <div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-4 mb-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  🟡 Intermediate Level (
                  {results.learning_path.intermediate.length})
                </h3>
                <p className="text-yellow-100 mt-1">Build on your foundation</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {results.learning_path.intermediate.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    levelColor="yellow"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Advanced Courses */}
          {results.learning_path.advanced.length > 0 && (
            <div>
              <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg p-4 mb-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  🔴 Advanced Level ({results.learning_path.advanced.length})
                </h3>
                <p className="text-red-100 mt-1">Master advanced concepts</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {results.learning_path.advanced.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    levelColor="red"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cross-Domain Recommendations */}
          {results.cross_domain_courses.length > 0 && (
            <div>
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-4 mb-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  🌐 Cross-Domain Discoveries (
                  {results.cross_domain_courses.length})
                </h3>
                <p className="text-purple-100 mt-1">
                  Expand your horizons with related courses from other domains
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {results.cross_domain_courses.map((item) => (
                  <CrossDomainCard key={item.course.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && results && results.summary.total_courses === 0 && query && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600 text-lg">
            No courses found matching your query. Try different keywords or
            check if embeddings are generated.
          </p>
        </div>
      )}

      {!query && !loading && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Ready to discover your learning path?
          </h3>
          <p className="text-gray-600 mb-6">
            Enter a natural language description of what you want to learn, and
            our AI will create a structured learning path with cross-domain
            discoveries.
          </p>
          <div className="bg-white rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-gray-700 mb-2">
              <strong>🎯 What you'll get:</strong>
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
    </div>
  );
}
