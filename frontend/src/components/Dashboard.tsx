import { useState, useEffect } from "react";
import { getStats, healthCheck, type Stats } from "../api";
import {
  BookOpen,
  Building2,
  Zap,
  Star,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Award,
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<string>("checking...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, healthData] = await Promise.all([
        getStats(),
        healthCheck(),
      ]);
      setStats(statsData);
      setHealth(healthData.status);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 font-medium">Error: {error}</p>
          <button
            onClick={loadData}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          API Health Status
        </h2>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full"></span>
          <span className="text-sm font-medium text-gray-700 capitalize">{health}</span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Courses</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.total_courses}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Universities</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.total_universities}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Skills</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.total_skills}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Rating</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {stats?.avg_rating ? stats.avg_rating.toFixed(2) : "0.00"}
            </div>
          </div>
        </div>
      </div>

      {/* Top Universities */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          Top Universities
        </h3>
        <div className="space-y-2">
          {stats?.top_universities.slice(0, 10).map((uni, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <span className="font-medium text-gray-700">
                {uni.name || "Unknown University"}
              </span>
              <span className="text-indigo-600 font-semibold">
                {uni.course_count || 0} courses
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Skills */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-gray-500" />
          Top Skills
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {stats?.top_skills.slice(0, 20).map((skill, idx) => (
            <div key={idx} className="p-3 bg-indigo-50 rounded text-center">
              <div className="font-semibold text-indigo-600">{skill.name}</div>
              <div className="text-sm text-gray-600">
                {skill.course_count} courses
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadData}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh Dashboard
      </button>
    </div>
  );
}
