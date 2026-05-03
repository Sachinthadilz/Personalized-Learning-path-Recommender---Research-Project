import { useState, useEffect } from "react";
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
  Cell,
  ReferenceLine,
} from "recharts";
import { BookOpen, Loader2, Trophy, TrendingUp, BarChart2 } from "lucide-react";
import { fetchQuizMarks } from "../api";

interface CourseEntry {
  name: string;
  percentage: number;
  score: number;
  total: number;
}

interface ProgressEntry {
  name: string;
  percentage: number;
  score: number;
  total: number;
  takenAt: string;
}

interface SubjectEntry {
  name: string;
  marks: number;
}

function scoreColor(pct: number) {
  if (pct >= 80) return "#10b981";
  if (pct >= 60) return "#6366f1";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

function CourseTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CourseEntry;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-[180px]">
      <p className="font-semibold text-gray-700 mb-1 break-words">{label}</p>
      <div className="flex justify-between gap-3">
        <span className="text-gray-500">Score</span>
        <span className="font-medium">{d.score}/{d.total}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-gray-500">Percentage</span>
        <span className="font-semibold" style={{ color: scoreColor(d.percentage) }}>{d.percentage}%</span>
      </div>
    </div>
  );
}

function ProgressTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ProgressEntry;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-[180px]">
      <p className="font-semibold text-gray-700 mb-1 break-words">{label}</p>
      <div className="flex justify-between gap-3">
        <span className="text-gray-500">Score</span>
        <span className="font-medium">{d.score}/{d.total}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-gray-500">Percentage</span>
        <span className="font-semibold" style={{ color: scoreColor(d.percentage) }}>{d.percentage}%</span>
      </div>
    </div>
  );
}

function SubjectTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as SubjectEntry;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-[180px]">
      <p className="font-semibold text-gray-700 mb-1 break-words">{label}</p>
      <div className="flex justify-between gap-3">
        <span className="text-gray-500">Marks</span>
        <span className="font-semibold" style={{ color: scoreColor(d.marks) }}>{d.marks}%</span>
      </div>
    </div>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-400">
      <BookOpen className="w-4 h-4 mx-auto mb-1 opacity-30" />
      {message}
    </div>
  );
}

export default function QuizMarksChart() {
  const [courseData, setCourseData] = useState<CourseEntry[]>([]);
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectEntry[]>([]);
  const [overallAvg, setOverallAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchQuizMarks()
      .then((result) => {
        if (cancelled) return;

        setCourseData(
          (result.courseQuizMarks ?? []).map((q) => ({
            name: q.courseName || q.courseId,
            percentage: q.percentage ?? 0,
            score: q.score,
            total: q.totalQuestions,
          }))
        );

        // Sort progress quizzes ascending by date (oldest → newest)
        const sorted = [...(result.progressQuizMarks ?? [])].sort(
          (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
        );
        setProgressData(
          sorted.map((q) => ({
            name: q.subjectName || q.subjectId,
            percentage: q.percentage ?? 0,
            score: q.score,
            total: q.total,
            takenAt: q.takenAt,
          }))
        );

        setSubjectData(
          (result.subjectMarks ?? []).map((s) => ({
            name: s.subjectName,
            marks: s.marks,
          }))
        );

        setOverallAvg(result.summary?.overallAverage ?? null);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err?.response?.data?.message ??
            err?.response?.data?.detail ??
            "Failed to load quiz marks"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading quiz marks…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  const tickFmt = (v: string) => (v.length > 14 ? v.slice(0, 13) + "…" : v);
  const totalResults = courseData.length + progressData.length + subjectData.length;

  return (
    <div className="space-y-6">
      {/* Overall average badge */}
      {overallAvg !== null && totalResults > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          Overall average:
          <span className="font-semibold" style={{ color: scoreColor(overallAvg) }}>
            {overallAvg}%
          </span>
          <span className="text-gray-400">across {totalResults} result(s)</span>
        </div>
      )}

      {/* ── Course Quizzes ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-semibold text-gray-600">Course Quizzes</span>
          {courseData.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{courseData.length} result(s)</span>
          )}
        </div>
        {courseData.length === 0 ? (
          <EmptySection message="No course quizzes completed yet." />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={courseData} margin={{ top: 4, right: 8, bottom: 24, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#cbd5e1"
                  tickFormatter={tickFmt} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip content={<CourseTooltip />} />
                <ReferenceLine y={60} stroke="#94a3b8" strokeDasharray="4 3"
                  label={{ value: "Pass 60%", position: "insideTopRight", fontSize: 9, fill: "#94a3b8" }} />
                <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return <circle key={payload.name} cx={cx} cy={cy} r={4}
                      fill={scoreColor(payload.percentage)} stroke="#fff" strokeWidth={1.5} />;
                  }}
                  activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Progress Quizzes ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
          <span className="text-xs font-semibold text-gray-600">Progress Quizzes</span>
          {progressData.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{progressData.length} result(s)</span>
          )}
        </div>
        {progressData.length === 0 ? (
          <EmptySection message="No progress quizzes taken yet." />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData} margin={{ top: 4, right: 8, bottom: 24, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#cbd5e1"
                  tickFormatter={tickFmt} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip content={<ProgressTooltip />} />
                <ReferenceLine y={60} stroke="#94a3b8" strokeDasharray="4 3"
                  label={{ value: "Pass 60%", position: "insideTopRight", fontSize: 9, fill: "#94a3b8" }} />
                <Line type="monotone" dataKey="percentage" stroke="#0ea5e9" strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return <circle key={`${payload.name}-${payload.takenAt}`} cx={cx} cy={cy} r={4}
                      fill={scoreColor(payload.percentage)} stroke="#fff" strokeWidth={1.5} />;
                  }}
                  activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Subject Assessments ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart2 className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-gray-600">Subject Assessments</span>
          {subjectData.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{subjectData.length} subject(s)</span>
          )}
        </div>
        {subjectData.length === 0 ? (
          <EmptySection message="No subject assessment marks recorded yet." />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} margin={{ top: 4, right: 8, bottom: 24, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#cbd5e1"
                  tickFormatter={tickFmt} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip content={<SubjectTooltip />} />
                <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="4 3"
                  label={{ value: "Pass 50%", position: "insideTopRight", fontSize: 9, fill: "#94a3b8" }} />
                <Bar dataKey="marks" radius={[4, 4, 0, 0]} name="Marks %">
                  {subjectData.map((entry, i) => (
                    <Cell key={i} fill={scoreColor(entry.marks)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
