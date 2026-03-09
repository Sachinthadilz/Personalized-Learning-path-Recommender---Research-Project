import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  predictLearnerProfileAuto,
  type AutoLearnerProfileInput,
  type LearnerProfileResult,
  fetchQuizMarks,
  type QuizMarksResponse,
  fetchVideoActivityLogs,
  type VideoActivityLog,
} from "../api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Dot,
} from "recharts";
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  User,
  Activity,
  Video,
  Award,
} from "lucide-react";
import StudentEngagementTimeline from "./StudentEngagementTimeline";

// ── Confidence bar ──────────────────────────────────────────────────────────

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-10 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

// ── Outcome styles ──────────────────────────────────────────────────────────

const OUTCOME_STYLES: Record<
  string,
  { border: string; bg: string; text: string; icon: React.ReactElement }
> = {
  Distinction: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  },
  Pass: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
  },
  Fail: {
    border: "border-rose-200",
    bg: "bg-rose-50",
    text: "text-rose-700",
    icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
  },
  Withdrawn: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  },
};

const ALERT_LEVEL_STYLES: Record<string, string> = {
  None: "bg-gray-100 text-gray-700",
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-rose-100 text-rose-700",
  Critical: "bg-red-100 text-red-700",
};

// ── Main component ──────────────────────────────────────────────────────────

export default function AutoLearnerProfileTab() {
  const { user } = useAuth();
  const [result, setResult] = useState<LearnerProfileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizMarks, setQuizMarks] = useState<QuizMarksResponse | null>(null);
  const [videoLogs, setVideoLogs] = useState<VideoActivityLog[]>([]);

  const handleAnalyze = async () => {
    if (!user) {
      setError("You must be logged in to use this feature.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input: AutoLearnerProfileInput = {
        student_id: user.id,
      };

      const data = await predictLearnerProfileAuto(input);
      setResult(data);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail ||
        err?.message ||
        "Analysis failed. Make sure your student data is available in the system.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run analysis when the component mounts and user is available
  useEffect(() => {
    if (user) {
      handleAnalyze();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch quiz marks and video logs when user is available
  useEffect(() => {
    if (!user) return;
    fetchQuizMarks().then(setQuizMarks).catch(() => {});
    fetchVideoActivityLogs(user.id).then(setVideoLogs).catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReanalyze = () => {
    setResult(null);
    setError(null);
    handleAnalyze();
  };

  // ── Derived outcome styles ──────────────────────────────────────────────

  const outcomeStyle =
    result && OUTCOME_STYLES[result.predicted_outcome]
      ? OUTCOME_STYLES[result.predicted_outcome]
      : {
          border: "border-gray-200",
          bg: "bg-gray-50",
          text: "text-gray-700",
          icon: <BarChart3 className="w-5 h-5 text-gray-400" />,
        };

  const isAtRisk = result?.risk_prediction === "At-Risk";
  const alertLevelClass =
    result?.learning_path_recommendation?.alert_level
      ? ALERT_LEVEL_STYLES[result.learning_path_recommendation.alert_level] ??
        "bg-gray-100 text-gray-700"
      : "bg-gray-100 text-gray-700";

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-600" />
              Automatic Learner Profile Analysis
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              The system automatically fetches your student data and activity logs to
              predict your learner profile, academic outcome, and risk level. No manual
              data entry required.
            </p>
          </div>

          {user && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-indigo-500">ID: {user.id}</p>
                </div>
              </div>
              <button
                onClick={handleReanalyze}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
              >
                {loading ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
                ) : (
                  <><RefreshCw className="w-3.5 h-3.5" /> Re-analyze</>
                )}
              </button>
            </div>
          )}

          {!user && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                You must be logged in to view your learner analysis.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────── */}
      {loading && !result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-gray-500">Analyzing your learner profile…</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          RESULTS
      ══════════════════════════════════════════════════════════════════ */}
      {result && (
        <div id="auto-results" className="space-y-4 pt-1">
          <h3 className="text-base font-semibold text-gray-700">
            Your Learner Analysis
          </h3>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Learner Profile */}
            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Learner Profile
                </span>
              </div>
              <p className="text-base font-bold text-gray-900 mb-2">
                {result.learner_profile}
              </p>
              <div className="text-xs text-gray-400 mb-1">Confidence</div>
              <ConfidenceBar
                value={result.profile_confidence}
                color="bg-indigo-500"
              />
            </div>

            {/* Predicted Outcome */}
            <div
              className={`bg-white rounded-xl border shadow-sm p-5 ${outcomeStyle.border}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${outcomeStyle.bg}`}
                >
                  {outcomeStyle.icon}
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Predicted Outcome
                </span>
              </div>
              <p className={`text-base font-bold mb-2 ${outcomeStyle.text}`}>
                {result.predicted_outcome}
              </p>
              <div className="text-xs text-gray-400 mb-1">Confidence</div>
              <ConfidenceBar
                value={result.outcome_confidence}
                color={
                  result.predicted_outcome === "Distinction" ||
                  result.predicted_outcome === "Pass"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }
              />
            </div>

            {/* Early Warning */}
            <div
              className={`bg-white rounded-xl border shadow-sm p-5 ${
                isAtRisk ? "border-rose-200" : "border-emerald-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isAtRisk ? "bg-rose-50" : "bg-emerald-50"
                  }`}
                >
                  {isAtRisk ? (
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Early Warning
                </span>
              </div>
              <p
                className={`text-base font-bold mb-2 ${
                  isAtRisk ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {result.risk_prediction}
              </p>
              <div className="text-xs text-gray-400 mb-1">Risk Score</div>
              <ConfidenceBar
                value={result.risk_score}
                color={isAtRisk ? "bg-rose-500" : "bg-emerald-500"}
              />
            </div>

            {/* Intervention */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Intervention
                </span>
              </div>
              {result.learning_path_recommendation.alert_level && (
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${alertLevelClass}`}
                >
                  {result.learning_path_recommendation.alert_level} Alert
                </span>
              )}
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {result.learning_path_recommendation.intervention ?? "—"}
              </p>
            </div>
          </div>

          {/* Learning Track panel */}
          {result.learning_path_recommendation &&
            Object.keys(result.learning_path_recommendation).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-800">
                      Recommended Learning Track
                    </h4>
                    <p className="text-sm text-indigo-600 font-medium mt-0.5">
                      {result.learning_path_recommendation.learning_path}
                    </p>
                  </div>
                  {result.learning_path_recommendation.profile && (
                    <span className="flex-shrink-0 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                      {result.learning_path_recommendation.profile}
                    </span>
                  )}
                </div>
                {result.learning_path_recommendation.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {result.learning_path_recommendation.description}
                  </p>
                )}
                {result.learning_path_recommendation.actions &&
                  result.learning_path_recommendation.actions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Recommended Actions
                      </p>
                      <ul className="space-y-2">
                        {result.learning_path_recommendation.actions.map(
                          (action: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                              {action}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
        </div>
      )}

      {/* ── Engagement Timeline ──────────────────────────────────────────── */}
      {user && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            My Engagement Timeline
          </h3>
          <StudentEngagementTimeline studentId={user.id} />
        </div>
      )}

      {/* ── Quiz Marks Chart ─────────────────────────────────────────────── */}
      {user && <QuizMarksChart quizMarks={quizMarks} />}

      {/* ── Video Watch Chart ────────────────────────────────────────────── */}
      {user && <VideoWatchChart videoLogs={videoLogs} />}
    </div>
  );
}

// ── Quiz Marks Chart ─────────────────────────────────────────────────────────

function getDotColor(percentage: number) {
  if (percentage >= 80) return "#22c55e";
  if (percentage >= 60) return "#6366f1";
  if (percentage >= 40) return "#f59e0b";
  return "#ef4444";
}

function QuizMarksChart({ quizMarks }: { quizMarks: QuizMarksResponse | null }) {
  const courseData = useMemo(() => {
    if (!quizMarks) return [];
    return (quizMarks.courseQuizMarks ?? []).map((q) => ({
      name: q.courseName.length > 22 ? q.courseName.slice(0, 22) + "…" : q.courseName,
      score: Math.round(q.percentage),
    }));
  }, [quizMarks]);

  const progressData = useMemo(() => {
    if (!quizMarks) return [];
    return [...(quizMarks.progressQuizMarks ?? [])]
      .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
      .map((q) => ({
        name: q.subjectName.length > 22 ? q.subjectName.slice(0, 22) + "…" : q.subjectName,
        score: Math.round(q.percentage),
      }));
  }, [quizMarks]);

  const hasData = courseData.length > 0 || progressData.length > 0;

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <Dot
        key={`dot-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={5}
        fill={getDotColor(payload.score)}
        stroke="#fff"
        strokeWidth={1.5}
      />
    );
  };

  const LineChartSection = ({
    data,
    title,
    color,
  }: {
    data: { name: string; score: number }[];
    title: string;
    color: string;
  }) => {
    if (data.length === 0) return null;
    return (
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: -12 }}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                stroke="#cbd5e1"
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                domain={[0, 100]}
                unit="%"
              />
              <RechartsTooltip
                formatter={(value: number) => [`${value}%`, "Score"]}
              />
              {/* Pass threshold */}
              <ReferenceLine y={60} stroke="#6366f1" strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: "Pass", position: "insideTopRight", fontSize: 10, fill: "#6366f1" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={color}
                strokeWidth={2.5}
                dot={renderCustomDot}
                activeDot={{ r: 7 }}
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Award className="w-5 h-5 text-indigo-600" />
        Quiz Marks
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Scores from course quizzes and progress assessments
      </p>

      {!quizMarks && (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading quiz marks…
        </div>
      )}

      {quizMarks && !hasData && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          <Award className="w-5 h-5 mx-auto mb-2 opacity-40" />
          No quiz marks recorded yet.
        </div>
      )}

      {quizMarks && hasData && (
        <>
          {/* Summary row */}
          {quizMarks.summary && quizMarks.summary.overallAverage !== null && (
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
              <span>
                Course quizzes:{" "}
                <span className="font-semibold text-gray-700">
                  {quizMarks.summary.totalCourseQuizzes}
                </span>
              </span>
              <span>
                Progress quizzes:{" "}
                <span className="font-semibold text-gray-700">
                  {quizMarks.summary.totalProgressQuizzes}
                </span>
              </span>
              <span>
                Overall avg:{" "}
                <span className="font-semibold text-indigo-700">
                  {Math.round(quizMarks.summary.overallAverage)}%
                </span>
              </span>
            </div>
          )}

          <div className="space-y-6">
            <LineChartSection data={courseData} title="Course Quizzes" color="#6366f1" />
            <LineChartSection data={progressData} title="Progress Quizzes" color="#0ea5e9" />
          </div>

          {/* Dot colour legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />≥ 80% Excellent</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />60–79% Good</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />40–59% Fair</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />&lt; 40% Needs Work</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Video Watch Chart ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

function VideoWatchChart({ videoLogs }: { videoLogs: VideoActivityLog[] }) {
  const chartData = useMemo(() => {
    const byDate: Record<string, { date: string; plays: number; watchMins: number }> = {};
    videoLogs.forEach((log) => {
      const date = log.timestamp.split("T")[0];
      if (!byDate[date]) byDate[date] = { date, plays: 0, watchMins: 0 };
      // Play events → increment session count
      if (log.event_type === "video_play") {
        byDate[date].plays += 1;
      }
      // Pause / complete events → accumulate watch time (duration is in seconds)
      if (
        (log.event_type === "video_pause" || log.event_type === "video_complete") &&
        log.duration != null &&
        log.duration > 0
      ) {
        byDate[date].watchMins += log.duration / 60;
      }
    });
    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, watchMins: Math.round(d.watchMins * 10) / 10 }));
  }, [videoLogs]);

  const totalPlays = chartData.reduce((s, d) => s + d.plays, 0);
  const totalWatchMins = chartData.reduce((s, d) => s + d.watchMins, 0);
  const totalWatchSecs = videoLogs
    .filter((l) => l.event_type === "video_pause" || l.event_type === "video_complete")
    .reduce((s, l) => s + (l.duration ?? 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Video className="w-5 h-5 text-sky-600" />
        Video Watch Activity
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Daily video plays and watch time (minutes)
      </p>

      {videoLogs.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          <Video className="w-5 h-5 mx-auto mb-2 opacity-40" />
          No video activity recorded yet.
        </div>
      )}

      {chartData.length > 0 && (
        <>
          <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
            <span>
              Total plays:{" "}
              <span className="font-semibold text-gray-700">{totalPlays}</span>
            </span>
            <span>
              Total watch time:{" "}
              <span className="font-semibold text-sky-700">
                {totalWatchSecs > 0 ? formatDuration(totalWatchSecs) : `${Math.round(totalWatchMins)}m`}
              </span>
            </span>
            <span>
              Active days:{" "}
              <span className="font-semibold text-gray-700">{chartData.length}</span>
            </span>
          </div>

          {/* Watch Time Chart */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Watch Time (minutes / day)</p>
          <div className="h-52 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#cbd5e1"
                  allowDecimals={false}
                  unit="m"
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} min`, "Watch Time"]}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Bar
                  dataKey="watchMins"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                  name="Watch Time"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Play Count Chart */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Video Plays (sessions / day)</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#cbd5e1"
                  allowDecimals={false}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} sessions`, "Video Plays"]}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Bar
                  dataKey="plays"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  name="Video Plays"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
