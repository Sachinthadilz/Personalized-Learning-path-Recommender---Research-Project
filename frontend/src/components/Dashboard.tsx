import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getStats, type Stats } from "../api";
import {
  BookOpen,
  Building2,
  Zap,
  Star,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Award,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-200 border-t-blue-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 font-semibold">Error: {error}</p>
          <button
            onClick={loadData}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const firstName = user?.firstName || "Learner";

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 rounded-2xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-amber-400/15 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">Welcome back,</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            {firstName} 👋
          </h2>
          <p className="text-blue-200 text-sm max-w-md">
            Keep up the momentum. Your personalised learning paths and course recommendations are ready.
          </p>
        </div>
      </div>

      {/* ── Statistics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Courses", value: stats?.total_courses, Icon: BookOpen, color: "bg-blue-50 text-blue-700", iconBg: "bg-blue-100" },
          { label: "Universities", value: stats?.total_universities, Icon: GraduationCap, color: "bg-teal-50 text-teal-700", iconBg: "bg-teal-100" },
          { label: "Skills", value: stats?.total_skills, Icon: Zap, color: "bg-sky-50 text-sky-700", iconBg: "bg-sky-100" },
          { label: "Avg Rating", value: stats?.avg_rating ? stats.avg_rating.toFixed(2) : "0.00", Icon: Star, color: "bg-amber-50 text-amber-600", iconBg: "bg-amber-100" },
        ].map(({ label, value, Icon, color, iconBg }) => (
          <div key={label} className={`${color} rounded-2xl p-5 border border-transparent hover:shadow-lg transition-all`}>
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold">{value}</div>
            <div className="text-xs font-medium opacity-70 uppercase tracking-wide mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Two Column: Universities + Skills ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Top Universities */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Top Universities
            </h3>
            <TrendingUp className="w-4 h-4 text-gray-300" />
          </div>
          <div className="p-4 space-y-1.5">
            {stats?.top_universities.slice(0, 10).map((uni, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50/50 transition-colors group"
              >
                <span className="w-7 h-7 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                  {idx + 1}
                </span>
                <span className="flex-1 font-medium text-gray-700 text-sm truncate">
                  {uni.name || "Unknown University"}
                </span>
                <span className="text-blue-700 font-bold text-sm whitespace-nowrap">
                  {uni.course_count || 0}
                  <span className="text-gray-400 font-normal ml-1">courses</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Top Skills
            </h3>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {stats?.top_skills.slice(0, 20).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors cursor-default"
              >
                {skill.name}
                <span className="text-blue-400 font-normal">{skill.course_count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Refresh Button ── */}
      <button
        onClick={loadData}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all text-sm font-medium"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh Dashboard
      </button>
    </div>
  );
}
