// RetryLearningPackage – simplified adaptive study package shown after a quiz failure
// Level increases with each retry: simpler content, more games, shorter sessions
import React, { useState } from "react";
import { Brain, Clock, FileText, Gamepad2, ChevronRight, AlertTriangle } from "lucide-react";
import MatchingGame from "./MatchingGame";

interface Props {
  subjectName: string;
  level: number;          // retry level: 2 = first retry, 3 = second retry, etc.
  attemptNumber: number;  // same as level for display
  onStartQuiz: () => void;
  onBack: () => void;
}

interface TabItem {
  id: "mindmap" | "notes" | "game" | "tips";
  label: string;
  icon: React.ReactNode;
}

// Simplified mind map nodes per level — fewer nodes, simpler connections
const getMindMapContent = (subject: string, level: number) => {
  const complexity = level <= 2 ? "core" : "essential";
  if (level <= 2) {
    // Level 2: 4 core topics, easy language
    return {
      center: subject,
      branches: [
        { label: "What is it?", color: "bg-blue-100 border-blue-300 text-blue-800" },
        { label: "Key rule", color: "bg-green-100 border-green-300 text-green-800" },
        { label: "Example", color: "bg-purple-100 border-purple-300 text-purple-800" },
        { label: "Remember this!", color: "bg-amber-100 border-amber-300 text-amber-800" },
      ],
    };
  }
  // Level 3+: only 3 branches, ultra-simplified
  return {
    center: `${subject} (${complexity})`,
    branches: [
      { label: "Definition", color: "bg-blue-100 border-blue-300 text-blue-800" },
      { label: "One Example", color: "bg-green-100 border-green-300 text-green-800" },
      { label: "Why it matters", color: "bg-pink-100 border-pink-300 text-pink-800" },
    ],
  };
};

// Short bullet notes scaled down with each level
const buildNotes = (subject: string, level: number): string[] => {
  const base = [
    `Focus on the CORE definition of ${subject} — 1 sentence only.`,
    "If stuck, look at your lecture slides for 10 minutes only.",
    "Write the key concept in your own words on paper.",
    `Ask: what is the PURPOSE of ${subject}?`,
  ];
  // Higher levels → fewer notes
  return base.slice(0, Math.max(1, 5 - level));
};

// Simplified timetable — shorter sessions for higher levels
const buildTimetable = (level: number) => {
  if (level <= 2) {
    return [
      { time: "15 min", task: "Read the core definition and 1 example" },
      { time: "10 min", task: "Play the matching game" },
      { time: "5 min",  task: "Write 3 bullet points from memory" },
      { time: "Quiz",   task: "Retry the quiz!" },
    ];
  }
  return [
    { time: "10 min", task: "Read 1 definition — 1 example only" },
    { time: "10 min", task: "Play the matching game" },
    { time: "Quiz",   task: "Retry immediately" },
  ];
};

const RetryLearningPackage: React.FC<Props> = ({
  subjectName,
  level,
  attemptNumber,
  onStartQuiz,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<TabItem["id"]>("mindmap");
  const [gameCompleted, setGameCompleted] = useState(false);

  const mindmap = getMindMapContent(subjectName, level);
  const notes = buildNotes(subjectName, level);
  const timetable = buildTimetable(level);

  const tabs: TabItem[] = [
    { id: "mindmap", label: "Mind Map", icon: <Brain className="w-3.5 h-3.5" /> },
    { id: "notes",   label: "Short Notes", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "game",    label: "Game 🎮", icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: "tips",    label: "Timetable", icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden max-w-2xl mx-auto">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-white flex-shrink-0" />
          <div>
            <p className="text-white font-black text-lg leading-tight">
              Adaptive Retraining – Level {level}
            </p>
            <p className="text-blue-100 text-sm mt-0.5">
              {subjectName} · Attempt #{attemptNumber} · Simplified for you
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {Array.from({ length: level - 1 }).map((_, i) => (
            <span key={i} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
              ✕ Attempt {i + 1} (failed)
            </span>
          ))}
          <span className="text-xs bg-white text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
            ➜ Now on Attempt {attemptNumber}
          </span>
        </div>
      </div>

      {/* Encouragement bar */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
        <p className="text-sm text-blue-800">
          💡 This is a <strong>simplified version</strong> — shorter, clearer, and with a game to help
          concepts stick. Work through it at your own pace, then retry the quiz.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-3 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-700 bg-blue-50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === "game" && gameCompleted && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6 min-h-[280px]">
        {/* Mind Map */}
        {activeTab === "mindmap" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
              Simplified Mind Map · Level {level}
            </p>
            <div className="flex flex-col items-center gap-4">
              {/* Center node */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-2xl px-6 py-3 shadow-md">
                {mindmap.center}
              </div>
              {/* Branch connector */}
              <div className="w-px h-6 bg-slate-300" />
              {/* Branches */}
              <div className="flex flex-wrap gap-3 justify-center">
                {mindmap.branches.map((branch, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border-2 px-5 py-3 text-sm font-medium ${branch.color} text-center min-w-[120px]`}
                  >
                    {branch.label}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Spend 5–10 minutes on each branch before moving on.
            </p>
          </div>
        )}

        {/* Short Notes */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
              Short Notes · Level {level} (the essentials only)
            </p>
            <ul className="space-y-3">
              {notes.map((note, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700">{note}</p>
                </li>
              ))}
            </ul>
            {level >= 3 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <strong>Level {level} tip:</strong> Keep it super simple — master just ONE concept,
                then retry the quiz. You don't need to know everything at once.
              </div>
            )}
          </div>
        )}

        {/* Matching Game */}
        {activeTab === "game" && (
          <div>
            {gameCompleted ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-emerald-700 font-semibold">✓ Game completed!</p>
                <p className="text-sm text-slate-500">You're ready to retry the quiz.</p>
                <button
                  onClick={onStartQuiz}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  Retry Quiz →
                </button>
              </div>
            ) : (
              <MatchingGame
                subjectName={subjectName}
                onComplete={(_score, _total) => setGameCompleted(true)}
                onSkip={() => setGameCompleted(true)}
              />
            )}
          </div>
        )}

        {/* Timetable */}
        {activeTab === "tips" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
              Study Timetable · Level {level}
            </p>
            <div className="space-y-2">
              {timetable.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 ${
                    item.task === "Retry the quiz!" || item.task === "Retry immediately"
                      ? "bg-indigo-50 border border-indigo-200"
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <span
                    className={`text-xs font-bold min-w-[50px] text-right ${
                      item.task.includes("Retry") ? "text-indigo-600" : "text-blue-600"
                    }`}
                  >
                    {item.time}
                  </span>
                  <span className="text-sm text-slate-700">{item.task}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-slate-200 px-6 py-4 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:underline"
        >
          ← Back to subjects
        </button>
        <button
          onClick={onStartQuiz}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow"
        >
          Ready — Retry Quiz
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RetryLearningPackage;
