// FeedbackBand – shows quiz result with clear PASS/FAIL + adaptive retraining trigger
import React from "react";
import { CheckCircle, XCircle, RefreshCw, ChevronRight, BarChart2 } from "lucide-react";
import type { QuizResult } from "./types";

interface Props {
  result: QuizResult | null;
  subjectName: string;
  onStartRetraining: () => void;   // goes to RetryLearningPackage
  onExploreNext: () => void;
  onGoDashboard: () => void;
  attemptNumber?: number;
}

const getTrainingPlan = (band: QuizResult["band"], subjectName: string) => {
  switch (band) {
    case "A":
      return {
        title: "Band A – Strong Performance",
        description: "You are performing very well. Keep your skills fresh with light revision.",
        bullets: [
          `Do a quick recap of key ${subjectName} concepts once a week.`,
          "Attempt a few higher-level challenge questions.",
          "Teach a friend — explaining strengthens understanding.",
        ],
      };
    case "B":
      return {
        title: "Band B – Good Performance",
        description: "Above the pass level, but there is still room to polish your understanding.",
        bullets: [
          `Revisit the topics you got wrong in the ${subjectName} quiz.`,
          "Spend 2–3 short sessions this week on mixed practice questions.",
          "Summarise each weak area in your own words.",
        ],
      };
    case "C":
      return {
        title: "Band C – Just Passed",
        description: "You are at the pass level. Strengthen your foundation before moving on.",
        bullets: [
          `Re-read your notes for the weakest ${subjectName} topics.`,
          "Redo the questions you missed without looking at answers.",
          "Create a mini cheat-sheet and review it daily.",
        ],
      };
    case "D":
    default:
      return {
        title: "Band D – Below Pass Mark (Rescue Plan)",
        description: "Your score is below the required pass mark. Follow this rescue plan.",
        bullets: [
          `Go back to the ${subjectName} study package — start with Mind Map + Short Notes.`,
          "Write your own summary for each subtopic in 1–2 lines.",
          "Do at least 10 focused practice questions on your weakest areas.",
          "After 2–3 study sessions, retry the Weekly Quiz.",
        ],
      };
  }
};

export const FeedbackBand: React.FC<Props> = ({
  result,
  subjectName,
  onStartRetraining,
  onExploreNext,
  onGoDashboard,
  attemptNumber = 1,
}) => {
  if (!result) {
    return (
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-8 space-y-4">
        <p className="text-sm text-slate-700">No quiz result found. Please take a quiz first.</p>
        <button className="text-sm text-indigo-600 hover:underline" onClick={onGoDashboard}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const { score, total, band } = result;
  const passMark = Math.ceil(total * 0.5);
  const failed = score < passMark;
  const scorePercent = Math.round((score / Math.max(total, 1)) * 100);
  const training = getTrainingPlan(band, subjectName);

  const bandColour: Record<QuizResult["band"], string> = {
    A: "bg-emerald-100 text-emerald-800 border-emerald-300",
    B: "bg-blue-100 text-blue-800 border-blue-300",
    C: "bg-amber-100 text-amber-800 border-amber-300",
    D: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-8 space-y-6 max-w-2xl mx-auto">

      {/* BIG PASS / FAIL banner */}
      <div
        className={`rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
          failed
            ? "bg-red-50 border-2 border-red-300"
            : "bg-emerald-50 border-2 border-emerald-300"
        }`}
      >
        <div className="flex items-center gap-3">
          {failed ? (
            <XCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-10 h-10 text-emerald-500 flex-shrink-0" />
          )}
          <div>
            <p className={`text-2xl font-black ${failed ? "text-red-700" : "text-emerald-700"}`}>
              {failed ? "FAILED" : "PASSED!"}
            </p>
            <p className="text-sm text-slate-600 mt-0.5">
              {subjectName} — Attempt #{attemptNumber}
            </p>
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className={`text-4xl font-black ${failed ? "text-red-600" : "text-emerald-600"}`}>
            {scorePercent}%
          </p>
          <p className="text-xs text-slate-500">
            Pass mark: 50% · You scored: {score}/{total}
          </p>
          <span
            className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${bandColour[band]}`}
          >
            Band {band}
          </span>
        </div>
      </div>

      {/* Adaptive retraining prompt (fail only) */}
      {failed && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-5 space-y-3">
          <p className="text-sm font-bold text-orange-800 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Adaptive Retraining Activated
          </p>
          <p className="text-sm text-orange-700">
            Don't worry — our system will adapt! You'll receive a{" "}
            <strong>simplified learning package</strong> with shorter notes, easier mind maps,
            and an interactive game to help you master <strong>{subjectName}</strong> before retrying.
          </p>
          <p className="text-xs text-orange-600">
            The loop continues until you pass. Each retry uses an easier version of the material.
          </p>
        </div>
      )}

      {/* Training band */}
      <div className="border border-indigo-200 bg-indigo-50 rounded-2xl px-6 py-5 space-y-3">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Personalised Training Plan</p>
        <h3 className="text-sm font-semibold text-indigo-900">{training.title}</h3>
        <p className="text-sm text-indigo-800">{training.description}</p>
        <ul className="mt-1 text-sm text-indigo-900 list-disc list-inside space-y-1">
          {training.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {failed && (
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition shadow"
            onClick={onStartRetraining}
          >
            <RefreshCw className="w-4 h-4" />
            Start Adaptive Retraining
          </button>
        )}
        {!failed && (
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition shadow"
            onClick={onExploreNext}
          >
            <ChevronRight className="w-4 h-4" />
            Next Subject
          </button>
        )}
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          onClick={onGoDashboard}
        >
          <BarChart2 className="w-4 h-4" />
          View Progress Dashboard
        </button>
        {!failed && (
          <button
            className="text-sm text-slate-500 hover:underline self-center"
            onClick={onExploreNext}
          >
            Explore another subject
          </button>
        )}
      </div>
    </div>
  );
};
