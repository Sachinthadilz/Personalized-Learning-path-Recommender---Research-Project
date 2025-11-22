// src/components/ProgressDashboard.tsx
import React from "react";
import type { SubjectPerformance, QuizResult, TrainingRecord } from "../types";

interface Props {
  subjects: SubjectPerformance[];
  lastQuizResult: QuizResult | null;
  trainingData: TrainingRecord[];
  onBack: () => void;
}

export const ProgressDashboard: React.FC<Props> = ({
  subjects,
  lastQuizResult,
  onBack,
}) => {
  const weakCount = subjects.filter((s) => s.isWeak).length;
  const totalSubjects = subjects.length;

  // Build last-quiz summary
  let lastPercent: number | null = null;
  let lastStatusLabel = "No quiz taken yet";
  let lastStatusColor = "text-slate-500";
  let moodEmoji = "📊";
  let encouragement = "Take your first weekly quiz to see your progress!";

  if (lastQuizResult) {
    const approxTotal = Math.max(
      lastQuizResult.passMark * 2,
      lastQuizResult.score || 1
    );
    lastPercent = Math.round((lastQuizResult.score / approxTotal) * 100);
    const passed = lastPercent >= 50;

    if (lastPercent >= 80) {
      lastStatusLabel = "Excellent! 🎯";
      lastStatusColor = "text-emerald-600";
      moodEmoji = "🔥";
      encouragement = `You're mastering ${lastQuizResult.subjectName}. Keep challenging yourself with harder questions!`;
    } else if (lastPercent >= 60) {
      lastStatusLabel = "Great job! 💪";
      lastStatusColor = "text-emerald-500";
      moodEmoji = "😄";
      encouragement = `Nice work on ${lastQuizResult.subjectName}! A bit more practice and you'll hit the top band.`;
    } else if (passed) {
      lastStatusLabel = "You passed! ✅";
      lastStatusColor = "text-blue-500";
      moodEmoji = "🙂";
      encouragement = `Good effort on ${lastQuizResult.subjectName}. Strengthen your weak areas and aim for Band A next time.`;
    } else {
      lastStatusLabel = "Training in progress 🚀";
      lastStatusColor = "text-amber-600";
      moodEmoji = "🧠";
      encouragement =
        "Don't worry about this result. Follow the rescue plan, use the weekly package, and try the quiz again.";
    }
  }

  const lastSubjectId = lastQuizResult?.subjectId ?? null;

  return (
    // 🌈 Beautiful background wrapper
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">

      {/* Glass container */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg p-6 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Progress Dashboard
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Overview of your learning journey
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              See your current weak subjects and latest quiz performance. Use this
              as your personal progress board.
            </p>
          </div>
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={onBack}
          >
            Back to Diagnosis
          </button>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Weak subjects */}
          <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 px-5 py-4">
            <p className="text-xs font-medium text-rose-700">Weak subjects</p>
            <p className="mt-2 text-3xl font-semibold text-rose-700">
              {weakCount}
            </p>
            <p className="mt-1 text-xs text-rose-700/80">
              Focus on these first using the weekly package & quizzes.
            </p>
          </div>

          {/* Total subjects */}
          <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-sky-100 border border-sky-200 px-5 py-4">
            <p className="text-xs font-medium text-sky-700">Total subjects</p>
            <p className="mt-2 text-3xl font-semibold text-sky-700">
              {totalSubjects}
            </p>
            <p className="mt-1 text-xs text-sky-700/80">
              All subjects currently tracked in this study cycle.
            </p>
          </div>

          {/* Last quiz score */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-emerald-700">
                Last quiz score
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-700">
                {lastPercent !== null ? `${lastPercent}%` : "--"}
              </p>
              <p className={`mt-1 text-xs font-medium ${lastStatusColor}`}>
                {lastStatusLabel}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-inner text-xl">
              {moodEmoji}
            </div>
          </div>
        </div>

        {/* Encouragement panel */}
        <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 flex gap-3">
          <div className="text-2xl pt-1">🌱</div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Keep going – small steps build big results.
            </p>
            <p className="text-sm text-slate-600 mt-1">{encouragement}</p>
          </div>
        </div>

        {/* Subjects overview */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            Subjects overview
          </p>

          {subjects.length === 0 ? (
            <p className="text-sm text-slate-500">
              No subjects added yet. Start by filling in this week&apos;s subjects
              and grades.
            </p>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {subjects.map((s) => {
                const isWeak = !!s.isWeak;
                const isLast = lastSubjectId === s.id;

                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between px-5 py-3 text-sm ${
                      isLast ? "bg-sky-50" : ""
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">
                        {s.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        Difficulty: {s.difficulty}/5 · Confidence: {s.confidence}/5
                      </span>
                      {isLast && lastPercent !== null && (
                        <span className="text-xs text-sky-600 mt-0.5">
                          Last quiz for this subject: {lastPercent}% score
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isWeak ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          Weak
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Strong / Stable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
