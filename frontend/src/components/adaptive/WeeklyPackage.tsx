// WeeklyPackage  AI-generated study package (Mind Map, Timetable, Short Notes, Practice Set)
import { useEffect, useState } from "react";
import { Loader2, Brain, CalendarDays, FileText, Dumbbell, RotateCcw } from "lucide-react";
import { authService } from "../../services/authService";
import type { StudyMaterialData, MindMapNode } from "../../services/authService";

type ActivePanel = "overview" | "mindmap" | "timetable" | "notes" | "practice";

interface Props {
  subjectName: string;
  marks?: number;
  grade?: string;
  onBack: () => void;
  onStartQuiz: () => void;
}

const WeeklyPackage: React.FC<Props> = ({
  subjectName,
  marks,
  grade,
  onBack,
  onStartQuiz,
}) => {
  const [activePanel, setActivePanel] = useState<ActivePanel>("overview");
  const [material, setMaterial] = useState<StudyMaterialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMaterial = async (forceGenerate = false) => {
    setError(null);
    try {
      if (!forceGenerate) {
        setLoading(true);
        const cached = await authService.getStudyMaterial(subjectName);
        // Only use cache if notes are present (avoids showing stale pre-AI data)
        if (cached.data && cached.data.notes && cached.data.notes.length > 0) {
          setMaterial(cached.data);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      setGenerating(true);
      const res = await authService.generateStudyMaterial(subjectName, marks, grade);
      if (res.success && res.data) {
        setMaterial(res.data);
      } else {
        setError("Could not generate study material. Please try again.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Could not connect to server. Make sure the backend is running.";
      console.error("[WeeklyPackage] loadMaterial error:", err);
      setError(msg);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadMaterial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectName]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-12 flex flex-col items-center gap-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading study material...</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="bg-white rounded-2xl shadow p-12 flex flex-col items-center gap-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-700">
          Generating your personalised study package for <span className="text-indigo-600 font-semibold">{subjectName}</span>...
        </p>
        <p className="text-xs text-slate-400">This usually takes 5-10 seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow p-10 flex flex-col items-center gap-4">
        <p className="text-sm text-red-600 text-center">{error}</p>
        <div className="flex gap-3">
          <button onClick={onBack} className="text-sm text-slate-500 hover:underline">Back</button>
          <button
            onClick={() => loadMaterial(true)}
            className="text-sm px-4 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!material) return null;

  const panelCard = (
    panel: ActivePanel,
    label: string,
    description: string,
    Icon: React.ComponentType<{ className?: string }>
  ) => (
    <button
      key={panel}
      type="button"
      onClick={() => setActivePanel(activePanel === panel ? "overview" : panel)}
      className={`border rounded-2xl p-4 text-left flex flex-col gap-2 transition-all ${
        activePanel === panel
          ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${activePanel === panel ? "text-indigo-600" : "text-slate-400"}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${activePanel === panel ? "text-indigo-700" : "text-slate-500"}`}>
          {label}
        </span>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </button>
  );

  return (
    <div className="bg-white rounded-2xl shadow p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Study Package - {subjectName}</h2>
          <p className="text-sm text-slate-500 mt-1">
            AI-generated personalised content
            {marks != null && (
              <span className="ml-1">
                 Marks: <span className="font-medium">{marks}%</span>
                {grade && <span> (Grade {grade})</span>}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadMaterial(true)}
            title="Regenerate content"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Regenerate
          </button>
          <button className="text-sm text-indigo-600 hover:underline" onClick={onBack}>Back</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {panelCard("mindmap",   "Mind Map",    "Visual concept map for this subject.", Brain)}
        {panelCard("timetable", "Timetable",   "AI-suggested 7-day revision schedule.", CalendarDays)}
        {panelCard("notes",     "Short Notes", "Deep academic review: definitions, theory, methods & exam strategy.", FileText)}
        {panelCard("practice",  "Practice Set","Exam-style questions with model answers.", Dumbbell)}
      </div>

      {activePanel !== "overview" && (
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-4">
          {activePanel === "mindmap" && (
            <MindMapGraph title={material.mindMap.title} nodes={material.mindMap.nodes} />
          )}

          {activePanel === "timetable" && (
            <>
              <h3 className="text-sm font-semibold text-slate-800">7-Day Revision Plan</h3>
              <div className="space-y-2">
                {material.timetable.map((day, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="w-10 shrink-0 font-semibold text-slate-700">{day.day}</span>
                    <span className="text-slate-600">{day.slots.join("  ")}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activePanel === "notes" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800">Academic Notes — {subjectName}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">AI-generated</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(material.notes ?? []).length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center gap-3 py-8 text-slate-400">
                    <p className="text-sm">No notes available yet.</p>
                    <button
                      onClick={() => loadMaterial(true)}
                      className="text-xs px-4 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Generate Now
                    </button>
                  </div>
                ) : (
                  (material.notes ?? []).map((section, i) => {
                  const sectionStyles = [
                    { border: "border-indigo-200", bg: "bg-indigo-50", title: "text-indigo-800", badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
                    { border: "border-violet-200", bg: "bg-violet-50", title: "text-violet-800", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
                    { border: "border-emerald-200", bg: "bg-emerald-50", title: "text-emerald-800", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
                    { border: "border-amber-200", bg: "bg-amber-50", title: "text-amber-800", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
                  ];
                  const s = sectionStyles[i % sectionStyles.length];
                  return (
                    <div key={i} className={`rounded-xl border ${s.border} ${s.bg} p-4 space-y-2`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{String(i + 1).padStart(2, "0")}</span>
                        <p className={`text-xs font-bold uppercase tracking-wide ${s.title}`}>{section.title}</p>
                      </div>
                      <ul className="space-y-1.5">
                        {section.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                  })
                )}
              </div>
            </>
          )}

          {activePanel === "practice" && (
            <>
              <h3 className="text-sm font-semibold text-slate-800">Practice Set - {subjectName}</h3>
              <div className="space-y-4">
                {material.practiceSet.map((item, i) => (
                  <PracticeCard key={i} index={i + 1} item={item} />
                ))}
              </div>
            </>
          )}

          <button type="button" onClick={() => setActivePanel("overview")} className="mt-2 text-xs text-indigo-600 hover:underline">
            Close
          </button>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button type="button" onClick={onStartQuiz} className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
          Start Weekly Quiz
        </button>
      </div>
    </div>
  );
};

// ─── Mind Map Graph ─────────────────────────────────────────────────────────

function splitLabel(label: string, maxLen: number): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxLen && cur) { lines.push(cur); cur = w; }
    else { cur = next; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

const BRANCH_COLORS = [
  { stroke: "#6366f1", light: "#eef2ff", text: "#3730a3" },
  { stroke: "#8b5cf6", light: "#f5f3ff", text: "#6d28d9" },
  { stroke: "#ec4899", light: "#fdf2f8", text: "#9d174d" },
  { stroke: "#f59e0b", light: "#fffbeb", text: "#92400e" },
  { stroke: "#10b981", light: "#ecfdf5", text: "#065f46" },
  { stroke: "#3b82f6", light: "#eff6ff", text: "#1e40af" },
  { stroke: "#ef4444", light: "#fef2f2", text: "#991b1b" },
  { stroke: "#14b8a6", light: "#f0fdfa", text: "#134e4a" },
];

const SvgLabel: React.FC<{
  x: number; y: number; label: string; maxLen: number;
  fontSize: number; fill: string; bold?: boolean;
}> = ({ x, y, label, maxLen, fontSize, fill, bold }) => {
  const lines = splitLabel(label, maxLen);
  const lineH = fontSize * 1.3;
  return (
    <text
      x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fontSize={fontSize} fill={fill} fontWeight={bold ? 700 : 500}
      fontFamily="system-ui, sans-serif" style={{ pointerEvents: "none" }}
    >
      {lines.map((line, k) => (
        <tspan key={k} x={x} dy={k === 0 ? -((lines.length - 1) * lineH) / 2 : lineH}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

const MindMapGraph: React.FC<{ title: string; nodes: MindMapNode[] }> = ({ title, nodes }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const W = 800, H = 560;
  const cx = W / 2, cy = H / 2;
  const ROOT_R = 46, MAIN_R = 36, CHILD_R = 27;
  const INNER_D = 148, OUTER_D = 108;

  const mainNodes = nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return {
      ...node,
      x: cx + INNER_D * Math.cos(angle),
      y: cy + INNER_D * Math.sin(angle),
      angle,
      color: BRANCH_COLORS[i % BRANCH_COLORS.length],
    };
  });

  const childMap = mainNodes.map((mn) => {
    const kids = mn.children ?? [];
    return kids.map((kid, j) => {
      const count = kids.length;
      const spread = count <= 1 ? 0 : Math.min(Math.PI * 0.75, (count / 5) * Math.PI);
      const kidAngle =
        count <= 1 ? mn.angle : mn.angle - spread / 2 + (spread * j) / (count - 1);
      return {
        label: kid.label,
        x: mn.x + OUTER_D * Math.cos(kidAngle),
        y: mn.y + OUTER_D * Math.sin(kidAngle),
        color: mn.color,
      };
    });
  });

  const bezier = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    return `M ${x1} ${y1} Q ${mx - dy * 0.12} ${my + dx * 0.12} ${x2} ${y2}`;
  };

  return (
    <div className="w-full space-y-3">
      <div className="w-full overflow-x-auto rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50 border border-slate-200 p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]" style={{ userSelect: "none" }}>
          <defs>
            <filter id="mm-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#00000020" />
            </filter>
            <filter id="mm-active">
              <feDropShadow dx="0" dy="3" stdDeviation="8" floodColor="#00000035" />
            </filter>
          </defs>

          {/* Root → main curved edges */}
          {mainNodes.map((mn, i) => {
            const active = activeIdx === i || hoveredIdx === i;
            const dim = activeIdx !== null && activeIdx !== i && hoveredIdx !== i;
            return (
              <path
                key={`re-${i}`}
                d={bezier(cx, cy, mn.x, mn.y)}
                stroke={mn.color.stroke}
                strokeWidth={active ? 2.5 : 1.5}
                fill="none"
                opacity={dim ? 0.12 : active ? 0.9 : 0.4}
                style={{ transition: "opacity 0.25s, stroke-width 0.2s" }}
              />
            );
          })}

          {/* Main → child dashed edges (active branch only) */}
          {mainNodes.map((mn, i) =>
            (activeIdx === i || hoveredIdx === i) &&
            childMap[i].map((ch, j) => (
              <path
                key={`ce-${i}-${j}`}
                d={bezier(mn.x, mn.y, ch.x, ch.y)}
                stroke={mn.color.stroke}
                strokeWidth={1.5}
                fill="none"
                opacity={0.55}
                strokeDasharray="5 3"
              />
            ))
          )}

          {/* Root node */}
          <circle cx={cx} cy={cy} r={ROOT_R} fill="white" stroke="#6366f1" strokeWidth={2.5} filter="url(#mm-shadow)" />
          <SvgLabel x={cx} y={cy} label={title} maxLen={11} fontSize={10.5} fill="#3730a3" bold />

          {/* Main topic nodes */}
          {mainNodes.map((mn, i) => {
            const active = activeIdx === i;
            const hovered = hoveredIdx === i;
            const dim = activeIdx !== null && !active;
            const r = active || hovered ? MAIN_R + 3 : MAIN_R;
            return (
              <g
                key={`mn-${i}`}
                style={{ cursor: "pointer" }}
                onClick={() => setActiveIdx(active ? null : i)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <circle
                  cx={mn.x} cy={mn.y} r={r}
                  fill={active || hovered ? mn.color.stroke : mn.color.light}
                  stroke={mn.color.stroke}
                  strokeWidth={active ? 2.5 : 1.5}
                  opacity={dim ? 0.3 : 1}
                  filter={active ? "url(#mm-active)" : "url(#mm-shadow)"}
                  style={{ transition: "all 0.2s" }}
                />
                <SvgLabel
                  x={mn.x} y={mn.y} label={mn.label} maxLen={9} fontSize={9.5}
                  fill={active || hovered ? "white" : mn.color.text} bold
                />
              </g>
            );
          })}

          {/* Child nodes (expanded branch) */}
          {mainNodes.map((_mn, i) =>
            (activeIdx === i || hoveredIdx === i) &&
            childMap[i].map((ch, j) => (
              <g key={`cn-${i}-${j}`}>
                <circle
                  cx={ch.x} cy={ch.y} r={CHILD_R}
                  fill={ch.color.light}
                  stroke={ch.color.stroke}
                  strokeWidth={1.5}
                />
                <SvgLabel x={ch.x} y={ch.y} label={ch.label} maxLen={8} fontSize={8.5} fill={ch.color.text} />
              </g>
            ))
          )}
        </svg>
      </div>
      <p className="text-center text-xs text-slate-400">
        Click a topic node to expand its subtopics · Click again to collapse
      </p>
    </div>
  );
};

// ─── Practice Card ────────────────────────────────────────────────────────────

const PracticeCard: React.FC<{ index: number; item: { question: string; answer: string } }> = ({ index, item }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
      <p className="text-sm font-semibold text-slate-800">Q{index}. {item.question}</p>
      {revealed ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-xs text-emerald-800 font-medium mb-1">Answer:</p>
          <p className="text-sm text-emerald-900">{item.answer}</p>
        </div>
      ) : (
        <button onClick={() => setRevealed(true)} className="text-xs px-3 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 transition">
          Reveal answer
        </button>
      )}
    </div>
  );
};

export default WeeklyPackage;