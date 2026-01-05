import { useState, useEffect } from "react";
import { getAllUniversities, type University } from "../api";

export default function UniversitiesTab() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUniversities(200);
      setUniversities(data);
    } catch (err) {
      setError("Failed to load universities");
    } finally {
      setLoading(false);
    }
  };

  const filteredUniversities = universities.filter((uni) =>
    uni.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎓 Universities
        </h2>
        <p className="text-gray-600 mb-4">
          Browse all universities offering courses on Coursera
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search universities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={loadUniversities}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            🔄 Refresh
            <div className="text-xs mt-1 opacity-90">GET /universities</div>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          ❌ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Statistics */}
      {!loading && universities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🎓</div>
            <div className="text-3xl font-bold">{universities.length}</div>
            <div className="text-indigo-100 mt-1">Total Universities</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-3xl font-bold">
              {universities.reduce((sum, uni) => sum + uni.course_count, 0)}
            </div>
            <div className="text-green-100 mt-1">Total Courses</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-3xl font-bold">
              {(
                universities.reduce((sum, uni) => sum + uni.course_count, 0) /
                universities.length
              ).toFixed(1)}
            </div>
            <div className="text-purple-100 mt-1">Avg Courses per Uni</div>
          </div>
        </div>
      )}

      {/* Universities List */}
      {!loading && filteredUniversities.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            📋 Universities List ({filteredUniversities.length})
          </h3>

          <div className="space-y-2">
            {filteredUniversities.map((uni, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {uni.name || "Unknown University"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {uni.course_count || 0} course
                      {uni.course_count !== 1 ? "s" : ""} offered
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">
                    {uni.course_count}
                  </div>
                  <div className="text-xs text-gray-500">courses</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading &&
        filteredUniversities.length === 0 &&
        universities.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center text-yellow-700">
            No universities match "{searchTerm}"
          </div>
        )}

      {!loading && universities.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          No universities found. Click refresh to load data from the database.
        </div>
      )}
    </div>
  );
}
