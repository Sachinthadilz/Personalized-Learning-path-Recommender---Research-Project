import { useState, useEffect } from "react";
import {
  getCourses,
  searchCourses,
  getCourseById,
  getCoursesBySkill,
  saveLearningPath,
  type Course,
  type CourseDetail,
} from "../api";
import { Star, X, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Search filters
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [minRating, setMinRating] = useState<number>(0);

  // Manual selection state
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set(),
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pathName, setPathName] = useState("");
  const [targetSkill, setTargetSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourses(0, 50);
      setCourses(data);
    } catch (err) {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const skills = skillFilter
        ? skillFilter.split(",").map((s) => s.trim())
        : undefined;
      const data = await searchCourses(
        searchQuery,
        skills,
        difficultyFilter || undefined,
        minRating || undefined,
        50,
      );
      setCourses(data);
    } catch (err) {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchBySkill = async () => {
    if (!skillFilter) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCoursesBySkill(skillFilter, 50);
      setCourses(data);
    } catch (err) {
      setError("Failed to search by skill");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourseById(courseId);
      setSelectedCourse(data);
    } catch (err) {
      setError("Failed to load course details");
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
    if (selectedCourses.size === courses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(courses.map((c) => c.id)));
    }
  };

  const handleOpenSaveModal = () => {
    if (selectedCourses.size === 0) {
      alert("Please select at least one course to save");
      return;
    }
    setShowSaveModal(true);
    setSaveSuccess(false);
  };

  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    setPathName("");
    setTargetSkill("");
    setSaveSuccess(false);
  };

  const handleSaveSelectedCourses = async () => {
    if (!pathName.trim()) {
      alert("Please enter a name for this learning path");
      return;
    }
    if (!targetSkill.trim()) {
      alert("Please enter a target skill");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const selectedCoursesData = courses.filter((c) =>
        selectedCourses.has(c.id),
      );

      const avgRating =
        selectedCoursesData.reduce((sum, c) => sum + c.rating, 0) /
        selectedCoursesData.length;

      await saveLearningPath({
        pathName: pathName.trim(),
        pathType: "manual",
        targetSkill: targetSkill.trim(),
        courses: selectedCoursesData,
        metadata: {
          totalCourses: selectedCoursesData.length,
          avgRating: avgRating,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => {
        handleCloseSaveModal();
        setSelectedCourses(new Set());
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save learning path");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Search Courses</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="text"
            placeholder="Skills (comma-separated)"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <input
            type="number"
            placeholder="Min Rating (0-5)"
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            min="0"
            max="5"
            step="0.1"
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-colors"
          >
            Search
          </button>

          <button
            onClick={handleSearchBySkill}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Search by Skill
          </button>

          <button
            onClick={loadCourses}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            All Courses
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedCourse.name}
              </h2>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-semibold">University:</span>{" "}
                {selectedCourse.university}
              </div>
              <div>
                <span className="font-semibold">Difficulty:</span>{" "}
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {selectedCourse.difficulty}
                </span>
              </div>
              <div>
                <span className="font-semibold">Rating:</span>{" "}
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {selectedCourse.rating.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="font-semibold">Description:</span>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  {formatDescriptionAsPoints(selectedCourse.description).map(
                    (point, idx) => (
                      <li key={idx} className="ml-4">
                        {point}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {selectedCourse.skills && selectedCourse.skills.length > 0 && (
                <div>
                  <span className="font-semibold">Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCourse.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCourse.similar_courses &&
                selectedCourse.similar_courses.length > 0 && (
                  <div>
                    <span className="font-semibold">Similar Courses:</span>
                    <div className="space-y-2 mt-2">
                      {selectedCourse.similar_courses.map((course) => (
                        <div key={course.id} className="p-3 bg-gray-50 rounded">
                          <div className="font-medium">{course.name}</div>
                          <div className="text-sm text-gray-600">
                            {course.university}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <a
                href={selectedCourse.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center px-6 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-colors"
              >
                View Course
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && courses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Results ({courses.length} courses)
            </h3>

            {user && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {selectedCourses.size === courses.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                {selectedCourses.size > 0 && (
                  <button
                    onClick={handleOpenSaveModal}
                    className="px-4 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all font-medium shadow-sm"
                  >
                    Save Selected ({selectedCourses.size})
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className={`border rounded-2xl p-4 hover:shadow-lg transition-all ${
                  selectedCourses.has(course.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {user && (
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedCourses.has(course.id)}
                      onChange={() => handleToggleSelection(course.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedCourses.has(course.id) ? "Selected" : "Select"}
                    </span>
                  </div>
                )}

                <div
                  onClick={() => handleViewCourse(course.id)}
                  className="cursor-pointer"
                >
                  <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {course.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {course.university}
                  </p>

                  {/* Description as bullet points */}
                  {course.description && (
                    <ul className="list-disc list-inside text-xs text-gray-600 mb-3 space-y-1">
                      {formatDescriptionAsPoints(course.description)
                        .slice(0, 3)
                        .map((point, idx) => (
                          <li key={idx} className="line-clamp-1">
                            {point}
                          </li>
                        ))}
                    </ul>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                      {course.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-500 text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {course.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-600">
          No courses found. Try searching or loading all courses.
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Save Learning Path
            </h3>

            {saveSuccess ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-blue-600">
                  Learning Path Saved Successfully!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Path Name *
                  </label>
                  <input
                    type="text"
                    value={pathName}
                    onChange={(e) => setPathName(e.target.value)}
                    placeholder="e.g., My Custom Learning Path"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Skill *
                  </label>
                  <input
                    type="text"
                    value={targetSkill}
                    onChange={(e) => setTargetSkill(e.target.value)}
                    placeholder="e.g., Machine Learning"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedCourses.size}</strong> courses selected
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveSelectedCourses}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Learning Path"}
                  </button>
                  <button
                    onClick={handleCloseSaveModal}
                    disabled={saving}
                    className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
