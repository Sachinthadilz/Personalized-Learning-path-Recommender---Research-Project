import { useState, useEffect } from "react";
import { getAllUniversities, type University } from "../api";
import { Building2, BookOpen, BarChart2 } from "lucide-react";

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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Universities
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
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={loadUniversities}
            className="px-6 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-colors"
          >
            Refresh
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

      {/* Statistics */}
      {!loading && universities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Universities</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">{universities.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Courses</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">
                {universities.reduce((sum, uni) => sum + uni.course_count, 0)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Courses / Uni</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">
                {(
                  universities.reduce((sum, uni) => sum + uni.course_count, 0) /
                  universities.length
                ).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universities List */}
      {!loading && filteredUniversities.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Universities List ({filteredUniversities.length})
          </h3>

          <div className="space-y-2">
            {filteredUniversities.map((uni, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-lg">
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
                  <div className="text-2xl font-bold text-blue-700">
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center text-yellow-700">
            No universities match "{searchTerm}"
          </div>
        )}

      {!loading && universities.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-600">
          No universities found. Click refresh to load data from the database.
        </div>
      )}
    </div>
  );
}
