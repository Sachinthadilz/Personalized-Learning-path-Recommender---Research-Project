// frontend/src/components/ProgressDashboard.tsx

import { Component, type ReactNode, useMemo } from "react";
import type { SubjectPerformance, QuizResult } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type Band = "A" | "B" | "C" | "D";

interface ProgressDashboardProps {
  subjects: SubjectPerformance[];
  lastQuizResult: QuizResult | null;
  quizHistory?: QuizResult[];
  onBack: () => void;
}

/** ErrorBoundary to prevent full-page crash if charts fail */
class ChartErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state: { hasError: boolean } = { hasError: false };

  static getDerivedStateFromError(): { hasError: true } {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Chart crashed:", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Charts are temporarily unavailable due to a render error. Stats and
            subjects are still visible.
          </div>
        )
      );
    }
    return this.props.children;
  }
}

/** Safe band extraction */
const getBandSafe = (q: QuizResult): Band => {
  const b = (q as { band?: Band }).band;
  return b === "A" || b === "B" || b === "C" || b === "D" ? b : "C";
};

/** Score % from quiz */
const getPct = (q: QuizResult) => {
  const total = Math.max(q.total ?? 0, 1);
  return (q.score / total) * 100;
};

/** Pass check (>= 50%) */
const isPass = (q: QuizResult) => {
  const total = Math.max(q.total ?? 0, 1);
  const passMark = Math.ceil(total * 0.5);
  return q.score >= passMark;
};

interface StatCardProps {
  title: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "neutral" | "good" | "warn" | "bad" | "info";
}

const StatCard = ({ title, value, sub, accent = "neutral" }: StatCardProps) => {
  const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
    neutral: "border-slate-200 bg-white",
    good: "border-emerald-200 bg-emerald-50/30",
    warn: "border-amber-200 bg-amber-50/30",
    bad: "border-rose-200 bg-rose-50/30",
    info: "border-sky-200 bg-sky-50/30",
  };

  return (
    <div
      className={[
        "rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow",
        accentClasses[accent],
      ].join(" ")}
    >
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {title}
      </p>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-600">{sub}</div>}
    </div>
  );
};

interface PillProps {
  children: ReactNode;
  tone?: "neutral" | "good" | "bad" | "info" | "warn";
}

const Pill = ({ children, tone = "neutral" }: PillProps) => {
  const tones: Record<NonNullable<PillProps["tone"]>, string> = {
    neutral: "bg-slate-100 text-slate-700",
    good: "bg-emerald-100 text-emerald-700",
    bad: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
    warn: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const EmptyState = ({ onBack }: { onBack: () => void }) => (
  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
    <h3 className="text-xl font-extrabold text-slate-900">No quiz data yet</h3>
    <p className="mt-2 text-sm text-slate-600">
      Complete at least one quiz to see charts and stats.
    </p>

    <button
      onClick={onBack}
      className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Back to Subjects
    </button>
  </div>
);

type TrendPoint = { name: string; score: number };
type PiePoint = { name: Band; value: number };
type SubjectBarPoint = { name: string; attempts: number };

const getSubjectId = (q: QuizResult): string | undefined =>
  (q as { subjectId?: string }).subjectId;

/** Recharts tooltip value can be number | string | array | undefined depending on payload */
const toNumberSafe = (v: unknown): number => {
  const base = Array.isArray(v) ? v[0] : v;
  if (typeof base === "number") return base;
  if (typeof base === "string") {
    const n = Number(base);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

export const ProgressDashboard = ({
  subjects = [],
  lastQuizResult,
  quizHistory = [],
  onBack,
}: ProgressDashboardProps) => {
  const { totalAttempts, averageScore, passRate, bandCounts } = useMemo(() => {
    const totalAttemptsLocal = Array.isArray(quizHistory)
      ? quizHistory.length
      : 0;

    if (totalAttemptsLocal === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        bandCounts: { A: 0, B: 0, C: 0, D: 0 } as Record<Band, number>,
      };
    }

    const totalPercent = quizHistory.reduce((sum, q) => sum + getPct(q), 0);
    const passCount = quizHistory.filter(isPass).length;

    const counts: Record<Band, number> = { A: 0, B: 0, C: 0, D: 0 };
    quizHistory.forEach((q) => {
      counts[getBandSafe(q)] += 1;
    });

    return {
      totalAttempts: totalAttemptsLocal,
      averageScore: totalPercent / totalAttemptsLocal,
      passRate: (passCount / totalAttemptsLocal) * 100,
      bandCounts: counts,
    };
  }, [quizHistory]);

  const subjectAttemptCount = (subject: SubjectPerformance) => {
    const name = subject.name;
    const id = subject.id;

    return quizHistory.filter((q) => {
      const sid = getSubjectId(q);
      return sid === name || sid === id;
    }).length;
  };

  const trendData: TrendPoint[] = useMemo(() => {
    const last = [...quizHistory].slice(-12);
    return last.map((q, idx) => ({
      name: `#${idx + 1}`,
      score: Number(getPct(q).toFixed(1)),
    }));
  }, [quizHistory]);

  const pieData: PiePoint[] = useMemo(() => {
    return (["A", "B", "C", "D"] as Band[]).map((b) => ({
      name: b,
      value: bandCounts[b],
    }));
  }, [bandCounts]);

  const subjectBars: SubjectBarPoint[] = useMemo(() => {
    return subjects.map((s) => ({
      name: s.name,
      attempts: subjectAttemptCount(s),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, quizHistory]);

  const bandColor = (b: Band) => {
    switch (b) {
      case "A":
        return "#10b981";
      case "B":
        return "#0ea5e9";
      case "C":
        return "#f59e0b";
      case "D":
        return "#f43f5e";
      default:
        return "#64748b";
    }
  };

  const lastBand = lastQuizResult ? getBandSafe(lastQuizResult) : null;
  const lastPct = lastQuizResult ? getPct(lastQuizResult) : null;

  return (
    <div className="w-full">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-sky-50 via-white to-white p-4 md:p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Progress Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Performance overview, trends and subject attempts.
            </p>
          </div>

          <button
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            ← Back to Subjects
          </button>
        </div>

        {/* Empty */}
        {quizHistory.length === 0 ? (
          <EmptyState onBack={onBack} />
        ) : (
          <>
            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatCard
                title="Total Attempts"
                value={totalAttempts}
                sub="From quiz history"
                accent="neutral"
              />
              <StatCard
                title="Average Score"
                value={`${averageScore.toFixed(1)}%`}
                sub={averageScore >= 50 ? "Nice progress" : "Needs practice"}
                accent={averageScore >= 50 ? "good" : "warn"}
              />
              <StatCard
                title="Pass Rate"
                value={`${passRate.toFixed(1)}%`}
                sub={passRate >= 60 ? "Good consistency" : "Improve weak topics"}
                accent={passRate >= 60 ? "good" : "bad"}
              />
              <StatCard
                title="Last Quiz"
                value={
                  lastQuizResult ? (
                    <div className="flex items-center gap-2">
                      <Pill
                        tone={
                          lastBand === "A" || lastBand === "B"
                            ? "good"
                            : lastBand === "D"
                              ? "bad"
                              : "warn"
                        }
                      >
                        Band {lastBand}
                      </Pill>
                      <span className="font-extrabold">
                        {lastPct?.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    "—"
                  )
                }
                sub={
                  lastQuizResult ? (
                    <span className="text-slate-600">
                      Subject:{" "}
                      <span className="font-semibold">
                        {getSubjectId(lastQuizResult) ?? "-"}
                      </span>
                    </span>
                  ) : (
                    "No recent quiz"
                  )
                }
                accent="info"
              />
            </div>

            {/* Charts */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Trend chart */}
              <ChartErrorBoundary>
                <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Score Trend
                      </h3>
                      <p className="text-xs text-slate-500">
                        Last {trendData.length} attempts
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Pill tone={averageScore >= 50 ? "good" : "warn"}>
                        Avg {averageScore.toFixed(1)}%
                      </Pill>
                      <Pill tone={passRate >= 60 ? "good" : "bad"}>
                        Pass {passRate.toFixed(1)}%
                      </Pill>
                    </div>
                  </div>

                  <div className="mt-3" style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(value) => {
                            const n = toNumberSafe(value);
                            return [`${n}%`, "Score"];
                          }}
                          labelFormatter={(l) => `Attempt ${l}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          strokeWidth={3}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ChartErrorBoundary>

              {/* Donut chart */}
              <ChartErrorBoundary>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Band Overview
                  </h3>
                  <p className="text-xs text-slate-500">Distribution</p>

                  <div className="mt-3" style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                          isAnimationActive={false}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={bandColor(entry.name)} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={30} />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Pill tone="good">A: {bandCounts.A}</Pill>
                    <Pill tone="info">B: {bandCounts.B}</Pill>
                    <Pill tone="warn">C: {bandCounts.C}</Pill>
                    <Pill tone="bad">D: {bandCounts.D}</Pill>
                  </div>
                </div>
              </ChartErrorBoundary>
            </div>

            {/* Subjects */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Subjects Overview
                    </h3>
                    <p className="text-xs text-slate-500">
                      Attempts, difficulty and confidence
                    </p>
                  </div>
                  <Pill tone="neutral">{subjects.length} subjects</Pill>
                </div>

                <div className="mt-4 space-y-2">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No weekly subjects added yet.
                    </p>
                  ) : (
                    subjects.map((subject) => {
                      const attempts = subjectAttemptCount(subject);
                      return (
                        <div
                          key={subject.id}
                          className="rounded-2xl border border-slate-200 bg-white p-3"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">
                                {subject.name}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <Pill tone="neutral">
                                  Difficulty: {subject.difficulty}
                                </Pill>
                                <Pill tone="info">
                                  Confidence: {subject.confidence}
                                </Pill>
                                {subject.isWeak && <Pill tone="bad">Weak Area</Pill>}
                              </div>
                            </div>
                            <Pill tone={attempts === 0 ? "warn" : "good"}>
                              Attempts: {attempts}
                            </Pill>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bar chart */}
              <ChartErrorBoundary>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Attempts by Subject
                  </h3>
                  <p className="text-xs text-slate-500">Quick comparison</p>

                  <div className="mt-3" style={{ width: "100%", height: 288 }}>
                    <ResponsiveContainer>
                      <BarChart data={subjectBars}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" hide />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="attempts"
                          radius={[10, 10, 10, 10]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ChartErrorBoundary>
            </div>

            {/* Last quiz summary */}
            {lastQuizResult && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Last Quiz Summary
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="neutral">
                    Subject:{" "}
                    <span className="ml-1 font-extrabold">
                      {getSubjectId(lastQuizResult) ?? "-"}
                    </span>
                  </Pill>
                  <Pill tone="info">
                    Score:{" "}
                    <span className="ml-1 font-extrabold">{lastQuizResult.score}</span>/
                    <span className="font-extrabold">{lastQuizResult.total}</span>
                  </Pill>
                  <Pill
                    tone={
                      getBandSafe(lastQuizResult) === "A" ||
                      getBandSafe(lastQuizResult) === "B"
                        ? "good"
                        : getBandSafe(lastQuizResult) === "D"
                          ? "bad"
                          : "warn"
                    }
                  >
                    Band {getBandSafe(lastQuizResult)}
                  </Pill>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;
