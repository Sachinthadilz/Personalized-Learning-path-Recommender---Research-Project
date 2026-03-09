// ProgressDashboard – performance overview with charts, stats and subject details
import { Component, type ReactNode, useMemo } from "react";
import type { SubjectPerformance, QuizResult } from "./types";
import { LevelProgressDiagram } from "./LevelProgressDiagram";
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

interface Props {
  subjects: SubjectPerformance[];
  lastQuizResult: QuizResult | null;
  quizHistory?: QuizResult[];
  onBack: () => void;
}

// ── Error boundary for chart crashes ─────────────────────────────────────────
class ChartErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: unknown) { console.error("Chart crashed:", err); }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Charts are temporarily unavailable.
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const getBand = (q: QuizResult): Band => {
  const b = q.band as Band;
  return ["A", "B", "C", "D"].includes(b) ? b : "C";
};

const getPct = (q: QuizResult) => {
  const total = Math.max(q.total ?? 0, 1);
  return (q.score / total) * 100;
};

const isPass = (q: QuizResult) => {
  const total = Math.max(q.total ?? 0, 1);
  return q.score >= Math.ceil(total * 0.5);
};

const bandColour = (b: Band) =>
  ({ A: "#10b981", B: "#0ea5e9", C: "#f59e0b", D: "#f43f5e" })[b] ?? "#64748b";

// ── Sub-components ────────────────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  sub,
  accent = "neutral",
}: {
  title: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "neutral" | "good" | "warn" | "bad" | "info";
}) => {
  const colours = {
    neutral: "border-slate-200 bg-white",
    good:    "border-emerald-200 bg-emerald-50/40",
    warn:    "border-amber-200 bg-amber-50/40",
    bad:     "border-rose-200 bg-rose-50/40",
    info:    "border-sky-200 bg-sky-50/40",
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${colours[accent]}`}>
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</p>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-600">{sub}</div>}
    </div>
  );
};

const Pill = ({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "bad" | "info" | "warn";
}) => {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    good:    "bg-emerald-100 text-emerald-700",
    bad:     "bg-rose-100 text-rose-700",
    info:    "bg-sky-100 text-sky-700",
    warn:    "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const ProgressDashboard = ({
  subjects = [],
  lastQuizResult,
  quizHistory = [],
  onBack,
}: Props) => {
  const { totalAttempts, averageScore, passRate, bandCounts } = useMemo(() => {
    const total = quizHistory.length;
    if (total === 0) {
      return { totalAttempts: 0, averageScore: 0, passRate: 0, bandCounts: { A: 0, B: 0, C: 0, D: 0 } as Record<Band, number> };
    }
    const counts: Record<Band, number> = { A: 0, B: 0, C: 0, D: 0 };
    quizHistory.forEach((q) => { counts[getBand(q)] += 1; });
    return {
      totalAttempts: total,
      averageScore: quizHistory.reduce((s, q) => s + getPct(q), 0) / total,
      passRate: (quizHistory.filter(isPass).length / total) * 100,
      bandCounts: counts,
    };
  }, [quizHistory]);

  const trendData = useMemo(
    () => [...quizHistory].slice(-12).map((q, i) => ({ name: `#${i + 1}`, score: +getPct(q).toFixed(1) })),
    [quizHistory]
  );

  const pieData = useMemo(
    () => (["A", "B", "C", "D"] as Band[]).map((b) => ({ name: b, value: bandCounts[b] })),
    [bandCounts]
  );

  const subjectBars = useMemo(
    () =>
      subjects.map((s) => ({
        name: s.name,
        attempts: quizHistory.filter((q) => q.subjectId === s.id || q.subjectId === s.name).length,
      })),
    [subjects, quizHistory]
  );

  const lastBand = lastQuizResult ? getBand(lastQuizResult) : null;

  return (
    <div className="w-full">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-sky-50 via-white to-white p-4 md:p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Progress Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
              Performance overview, quiz trends, and subject attempts.
            </p>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            ← Back to Subjects
          </button>
        </div>

        {quizHistory.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <h3 className="text-xl font-extrabold text-slate-900">No quiz data yet</h3>
            <p className="mt-2 text-sm text-slate-600">
              Complete at least one quiz to see charts and stats here.
            </p>
            <button
              onClick={onBack}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to Subjects
            </button>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatCard title="Total Attempts" value={totalAttempts} sub="From quiz history" />
              <StatCard
                title="Average Score"
                value={`${averageScore.toFixed(1)}%`}
                sub={averageScore >= 50 ? "Solid progress" : "Needs more practice"}
                accent={averageScore >= 50 ? "good" : "warn"}
              />
              <StatCard
                title="Pass Rate"
                value={`${passRate.toFixed(1)}%`}
                sub={passRate >= 60 ? "Good consistency" : "Work on weak topics"}
                accent={passRate >= 60 ? "good" : "bad"}
              />
              <StatCard
                title="Last Quiz"
                value={
                  lastBand ? (
                    <div className="flex items-center gap-2">
                      <Pill tone={lastBand === "A" || lastBand === "B" ? "good" : lastBand === "D" ? "bad" : "warn"}>
                        Band {lastBand}
                      </Pill>
                      <span className="font-extrabold">{lastQuizResult ? getPct(lastQuizResult).toFixed(1) : 0}%</span>
                    </div>
                  ) : (
                    "—"
                  )
                }
                sub={lastQuizResult ? `Subject: ${lastQuizResult.subjectId}` : "No recent quiz"}
                accent="info"
              />
            </div>

            {/* Charts row */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ChartErrorBoundary>
                <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Score Trend</h3>
                      <p className="text-xs text-slate-500">Last {trendData.length} attempts</p>
                    </div>
                    <div className="flex gap-2">
                      <Pill tone={averageScore >= 50 ? "good" : "warn"}>Avg {averageScore.toFixed(1)}%</Pill>
                      <Pill tone={passRate >= 60 ? "good" : "bad"}>Pass {passRate.toFixed(1)}%</Pill>
                    </div>
                  </div>
                  <div className="mt-3" style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Score"]} />
                        <Line type="monotone" dataKey="score" strokeWidth={3} isAnimationActive={false} stroke="#6366f1" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ChartErrorBoundary>

              <ChartErrorBoundary>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-900">Band Overview</h3>
                  <p className="text-xs text-slate-500">Distribution</p>
                  <div className="mt-3" style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} isAnimationActive={false}>
                          {pieData.map((entry) => (<Cell key={entry.name} fill={bandColour(entry.name as Band)} />))}
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

            {/* Level Progress Diagram */}
            <div className="mt-6">
              <LevelProgressDiagram quizHistory={quizHistory} lastQuizResult={lastQuizResult} />
            </div>

            {/* Subjects + attempts bar chart */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Subjects Overview</h3>
                    <p className="text-xs text-slate-500">Quiz attempts per subject</p>
                  </div>
                  <Pill tone="neutral">{subjects.length} subjects</Pill>
                </div>
                <div className="mt-4 space-y-2">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-slate-500">No weekly subjects added yet.</p>
                  ) : (
                    subjects.map((s) => {
                      const attempts = subjectBars.find((b) => b.name === s.name)?.attempts ?? 0;
                      return (
                        <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">{s.name}</p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {s.isWeak && <Pill tone="bad">Weak Area</Pill>}
                              </div>
                            </div>
                            <Pill tone={attempts === 0 ? "warn" : "good"}>Attempts: {attempts}</Pill>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <ChartErrorBoundary>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-900">Attempts by Subject</h3>
                  <p className="text-xs text-slate-500">Quiz count per subject</p>
                  <div className="mt-3" style={{ width: "100%", height: 288 }}>
                    <ResponsiveContainer>
                      <BarChart data={subjectBars}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" hide />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="attempts" radius={[10, 10, 10, 10]} isAnimationActive={false} fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ChartErrorBoundary>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;
