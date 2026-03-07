import { useMemo, useState } from "react";

type MindMapChild = { label: string };
type MindMapNode = { label: string; children?: MindMapChild[] };
type MindMapData = { title: string; nodes: MindMapNode[] };

type NoteSection = { title: string; bullets: string[] };

type WeekDay = { day: string; slots: string[] };

type SubjectPackage = {
  mindMap: MindMapData;
  notes: NoteSection[];
  timetable: WeekDay[];
  quiz?: { url: string };
};

type WeeklyPackageProps = {
  subjectName?: string;
  onBack?: () => void;
  onStartQuiz?: () => void;
};

/* -------------------------- SUBJECT PRESETS (optional) -------------------------- */
const SUBJECT_PRESETS: Record<string, SubjectPackage> = {
  "Software Engineering": {
    mindMap: {
      title: "Software Engineering",
      nodes: [
        {
          label: "Foundations",
          children: [
            { label: "Definition & Goals" },
            { label: "Software Crisis" },
            { label: "Process vs Product" },
          ],
        },
        {
          label: "SDLC Models",
          children: [
            { label: "Waterfall" },
            { label: "Agile / Scrum" },
            { label: "Spiral" },
            { label: "V-Model" },
          ],
        },
        {
          label: "Requirements",
          children: [
            { label: "Functional vs Non-functional" },
            { label: "User Stories" },
            { label: "SRS" },
          ],
        },
        {
          label: "Design",
          children: [
            { label: "Architecture" },
            { label: "UML Diagrams" },
            { label: "Design Patterns" },
          ],
        },
        {
          label: "Quality",
          children: [
            { label: "Testing Levels" },
            { label: "Verification & Validation" },
            { label: "QA vs QC" },
          ],
        },
        {
          label: "Project Management",
          children: [
            { label: "Estimation" },
            { label: "Risk Management" },
            { label: "Version Control" },
          ],
        },
      ],
    },
    notes: [
      {
        title: "Key Ideas",
        bullets: [
          "Software Engineering is a systematic approach to develop, operate, and maintain software.",
          "Quality includes correctness, reliability, maintainability, and usability.",
          "Requirements should be clear, testable, and consistent.",
        ],
      },
      {
        title: "Exam Tips",
        bullets: [
          "When comparing SDLC models, include pros/cons and suitable use-cases.",
          "Testing levels: unit → integration → system → acceptance.",
          "Agile artifacts: product backlog, sprint backlog, increment.",
        ],
      },
    ],
    timetable: [
      { day: "Mon", slots: ["Mind Map (30m)", "Notes (45m)", "Quiz (15m)"] },
      { day: "Tue", slots: ["Notes (45m)", "Past Questions (45m)"] },
      { day: "Wed", slots: ["Mind Map (20m)", "Practice (60m)"] },
      { day: "Thu", slots: ["Notes (45m)", "Mock Quiz (30m)"] },
      { day: "Fri", slots: ["Weak Areas (60m)", "Flash Review (20m)"] },
      { day: "Sat", slots: ["Full Practice Set (60m)"] },
      { day: "Sun", slots: ["Final Review (45m)", "Weekly Quiz (30m)"] },
    ],
    quiz: { url: "/quiz/software-engineering" },
  },
};

/* ------------------------------ AUTO GENERATION ------------------------------ */

function buildAutoPackage(subjectName: string): SubjectPackage {
  return {
    mindMap: buildGenericMindMap(subjectName),
    notes: buildGenericNotes(subjectName),
    timetable: buildGenericTimeTable(subjectName),
    quiz: { url: `/quiz/${slugify(subjectName)}` },
  };
}

function buildGenericMindMap(subjectName: string): MindMapData {
  return {
    title: subjectName,
    nodes: [
      {
        label: "Introduction",
        children: [{ label: "Definition" }, { label: "Scope" }, { label: "Applications" }],
      },
      {
        label: "Core Concepts",
        children: [{ label: "Key Terms" }, { label: "Models / Theory" }, { label: "Examples" }],
      },
      {
        label: "Methods / Process",
        children: [{ label: "Steps" }, { label: "Tools" }, { label: "Best Practices" }],
      },
      {
        label: "Common Questions",
        children: [{ label: "Short Questions" }, { label: "Long Questions" }, { label: "Diagrams" }],
      },
      {
        label: "Mistakes & Fixes",
        children: [{ label: "Common Errors" }, { label: "How to Avoid" }, { label: "Checklists" }],
      },
      {
        label: "Practice",
        children: [{ label: "MCQ / Quiz" }, { label: "Past Papers" }, { label: "Revision Plan" }],
      },
    ],
  };
}

function buildGenericNotes(subjectName: string): NoteSection[] {
  return [
    {
      title: "Key Ideas",
      bullets: [
        `Identify 5–7 core concepts in ${subjectName} and understand them clearly.`,
        "Write definitions and key points in a simple, structured format.",
        "Prepare 2–3 examples to strengthen explanations.",
      ],
    },
    {
      title: "Exam Tips",
      bullets: [
        "Keep definitions short and accurate.",
        "Add simple diagrams when relevant.",
        "Review past questions and identify repeating patterns.",
      ],
    },
  ];
}

function buildGenericTimeTable(subjectName: string): WeekDay[] {
  return [
    { day: "Mon", slots: [`${subjectName} Overview (30m)`, "Notes (45m)"] },
    { day: "Tue", slots: ["Core Concepts (60m)", "Mini Quiz (15m)"] },
    { day: "Wed", slots: ["Examples / Problems (60m)"] },
    { day: "Thu", slots: ["Past Questions (60m)", "Review (15m)"] },
    { day: "Fri", slots: ["Weak Areas (60m)", "Flash Review (15m)"] },
    { day: "Sat", slots: ["Mock Quiz (45m)", "Fix Mistakes (30m)"] },
    { day: "Sun", slots: ["Final Review (45m)", "Weekly Quiz (30m)"] },
  ];
}

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* -------------------------------- UI -------------------------------- */

const ITEMS = [
  { key: "mindmap", title: "Mind Map", subtitle: "Visual concept map", cta: "Open Mind Map", icon: "🧠", theme: "from-indigo-500 to-violet-500" },
  { key: "timetable", title: "Time Table", subtitle: "Weekly study slots", cta: "View Time Table", icon: "🗓️", theme: "from-emerald-500 to-teal-500" },
  { key: "notes", title: "Short Notes", subtitle: "Quick revision notes", cta: "Open Notes", icon: "📘", theme: "from-amber-500 to-orange-500" },
  { key: "practice", title: "Practice Set", subtitle: "Targeted quiz practice", cta: "Start Practice", icon: "🎯", theme: "from-pink-500 to-rose-500" },
] as const;

type ItemKey = typeof ITEMS[number]["key"];

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function WeeklyPackage(props: WeeklyPackageProps) {
  const subjectName = props.subjectName ?? "Software Engineering";

  const subject = useMemo<SubjectPackage>(() => {
    return SUBJECT_PRESETS[subjectName] ?? buildAutoPackage(subjectName);
  }, [subjectName]);

  const [activeKey, setActiveKey] = useState<ItemKey | null>(null);

  const detailsGradient =
    activeKey === "mindmap"
      ? "from-indigo-600 to-violet-600"
      : activeKey === "timetable"
        ? "from-emerald-600 to-teal-600"
        : activeKey === "notes"
          ? "from-amber-600 to-orange-600"
          : "from-pink-600 to-rose-600";

  const showButtonsAfterDetails = activeKey !== null;

  const ActionBar = () => (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={props.onBack}
        className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-gray-100"
      >
        ← Back
      </button>

      <button
        type="button"
        onClick={props.onStartQuiz}
        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Start Weekly Quiz (per subject)
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="px-6 py-5">
            {/* header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  Provide Weekly Package – {subjectName}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  A one-week study package will be generated for the selected subject.
                </div>
              </div>

              <button
                type="button"
                onClick={props.onBack}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Back to Weak Subject List
              </button>
            </div>

            {/* cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {ITEMS.map((it) => (
                <div
                  key={it.key}
                  className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={classNames(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white",
                        `bg-gradient-to-r ${it.theme}`
                      )}
                    >
                      <span>{it.icon}</span>
                      <span>{it.title}</span>
                    </div>
                    <div className="text-2xl">{it.icon}</div>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">{it.subtitle}</div>

                  <button
                    onClick={() => setActiveKey((prev) => (prev === it.key ? null : it.key))}
                    className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {it.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* ✅ If NO details open -> show buttons here (like your 2nd screenshot) */}
            {!showButtonsAfterDetails && <ActionBar />}

            {/* details */}
            {activeKey && (
              <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className={classNames("bg-gradient-to-r px-6 py-4 text-white", detailsGradient)}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">
                        {activeKey === "mindmap" && `${subjectName} Mind Map`}
                        {activeKey === "timetable" && `${subjectName} Weekly Time Table`}
                        {activeKey === "notes" && `${subjectName} Short Notes`}
                        {activeKey === "practice" && `${subjectName} Practice`}
                      </div>
                      <div className="mt-1 text-sm/5 opacity-90">
                        {activeKey === "mindmap" && "Auto-generated concept map view"}
                        {activeKey === "timetable" && "A weekly schedule you can follow"}
                        {activeKey === "notes" && "Quick revision notes for fast review"}
                        {activeKey === "practice" && "Practice guidance (start quiz using the button below)"}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveKey(null)}
                      className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/20"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {activeKey === "mindmap" && <MindMapDiagramPretty data={subject.mindMap} />}
                  {activeKey === "timetable" && <TimeTablePretty week={subject.timetable} />}
                  {activeKey === "notes" && <ShortNotesPretty notes={subject.notes} />}
                  {activeKey === "practice" && <PracticePretty />}
                </div>
              </div>
            )}

            {/* ✅ If details open -> show buttons AFTER details (like your 1st screenshot) */}
            {showButtonsAfterDetails && <ActionBar />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ NOTES (Pretty) ------------------------------ */

function ShortNotesPretty({ notes }: { notes: NoteSection[] }) {
  const iconFor = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("exam")) return "✅";
    if (t.includes("tip")) return "⚡";
    return "📘";
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {notes.map((sec, idx) => (
        <div key={idx} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="text-xl">{iconFor(sec.title)}</div>
            <div className="text-base font-semibold text-slate-900">{sec.title}</div>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {sec.bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-blue-500" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ PRACTICE (Pretty) ------------------------------ */

function PracticePretty() {
  return (
    <div className="rounded-2xl border bg-gradient-to-r from-pink-50 to-rose-50 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-slate-900">🎯 Practice</div>
          <div className="mt-1 text-sm text-slate-600">
            Review this content and then start the quiz using the action button below.
          </div>
        </div>

        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200">
          10–15 mins
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- TIME TABLE (Pretty) ----------------------------- */

function TimeTablePretty({ week }: { week: WeekDay[] }) {
  const dayTheme: Record<string, string> = {
    Mon: "from-indigo-500 to-violet-500",
    Tue: "from-emerald-500 to-teal-500",
    Wed: "from-sky-500 to-cyan-500",
    Thu: "from-amber-500 to-orange-500",
    Fri: "from-pink-500 to-rose-500",
    Sat: "from-purple-500 to-fuchsia-500",
    Sun: "from-slate-600 to-slate-800",
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white">
        <div className="text-base font-semibold">🗓️ Weekly Time Table</div>
        <div className="mt-1 text-sm/5 opacity-90">Suggested weekly study slots</div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {week.map((d) => (
            <div key={d.day} className="rounded-2xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div
                  className={classNames(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r",
                    dayTheme[d.day] || "from-slate-600 to-slate-800"
                  )}
                >
                  <span>📅</span>
                  <span>{d.day}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">{d.slots.length} slots</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {d.slots.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------- MIND MAP (SVG, no overlap) ----------------------- */

function MindMapDiagramPretty({ data }: { data: MindMapData }) {
  const width = 980;
  const height = 560;

  const center = { x: width / 2, y: 160 };
  const leftX = 230;
  const rightX = 750;

  const branchYs = [70, 170, 270];
  const childGap = 52;
  const childStartOffset = 58;

  const nodes = data.nodes ?? [];
  const left = nodes.slice(0, 3);
  const right = nodes.slice(3, 6);

  const branchThemes = [
    { stroke: "#A5B4FC", fill: "#EEF2FF", text: "#1E3A8A" },
    { stroke: "#6EE7B7", fill: "#ECFDF5", text: "#065F46" },
    { stroke: "#FDBA74", fill: "#FFF7ED", text: "#9A3412" },
    { stroke: "#FDA4AF", fill: "#FFF1F2", text: "#9F1239" },
    { stroke: "#7DD3FC", fill: "#ECFEFF", text: "#0C4A6E" },
    { stroke: "#D8B4FE", fill: "#FAF5FF", text: "#6B21A8" },
  ];

  const placedLeft = left.map((n, idx) => ({
    ...n,
    x: leftX,
    y: branchYs[idx] + 70,
    theme: branchThemes[idx % branchThemes.length],
  }));

  const placedRight = right.map((n, idx) => ({
    ...n,
    x: rightX,
    y: branchYs[idx] + 70,
    theme: branchThemes[(idx + 3) % branchThemes.length],
  }));

  const placedAll = [...placedLeft, ...placedRight];

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="block">
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#EEF2FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#111827" />
              <stop offset="100%" stopColor="#1F2937" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="url(#centerGlow)" />

          {placedAll.map((n, i) => (
            <path
              key={i}
              d={`M ${center.x} ${center.y} C ${center.x} ${center.y - 60}, ${n.x} ${n.y - 40}, ${n.x} ${n.y}`}
              fill="none"
              stroke={n.theme.stroke}
              strokeWidth="3"
              opacity="0.9"
            />
          ))}

          <SvgNode x={center.x} y={center.y} label={data.title || "Subject"} variant="center" />

          {placedAll.map((n, i) => {
            const children = n.children ?? [];
            return (
              <g key={i}>
                <SvgNode x={n.x} y={n.y} label={n.label} variant="branch" theme={n.theme} />

                {children.map((c, j) => {
                  const cy = n.y + childStartOffset + j * childGap;
                  const cx = n.x;

                  return (
                    <g key={j}>
                      <path
                        d={`M ${n.x} ${n.y + 20} C ${n.x} ${n.y + 40}, ${cx} ${cy - 25}, ${cx} ${cy}`}
                        fill="none"
                        stroke={n.theme.stroke}
                        strokeWidth="2"
                        opacity="0.6"
                      />
                      <SvgNode x={cx} y={cy} label={c.label} variant="child" theme={n.theme} />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function SvgNode({
  x,
  y,
  label,
  variant,
  theme,
}: {
  x: number;
  y: number;
  label: string;
  variant: "center" | "branch" | "child";
  theme?: { stroke: string; fill: string; text: string };
}) {
  const isCenter = variant === "center";
  const isBranch = variant === "branch";

  const w = isCenter ? 240 : isBranch ? 210 : 190;
  const h = isCenter ? 48 : 42;
  const rx = 18;

  const fill = isCenter ? "url(#centerGrad)" : theme?.fill ?? "#F8FAFC";
  const stroke = isCenter ? "none" : theme?.stroke ?? "#E2E8F0";
  const textFill = isCenter ? "#FFFFFF" : theme?.text ?? "#0F172A";
  const fontSize = isCenter ? 14 : 12;

  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      <rect width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth={2} />
      <text
        x={w / 2}
        y={h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
        fill={textFill}
      >
        {truncate(label, 28)}
      </text>
    </g>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
