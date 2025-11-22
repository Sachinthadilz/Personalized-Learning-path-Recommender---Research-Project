// src/components/FeedbackBand.tsx
import React from "react";
import type { QuizResult, QuizBand } from "../types";

interface Props {
  result: QuizResult | null;
  onRetry: () => void;        // go back to Study Package
  onExploreNext: () => void;
  onGoDashboard: () => void;
}

// Map band -> label + description + training ideas
const getTrainingPlan = (band: QuizBand, subjectName: string) => {
  switch (band) {
    case "A":
      return {
        title: "Band A – Strong Performance",
        description:
          "You are performing very well in this subject. Keep your skills fresh with light revision.",
        bullets: [
          `Do a quick recap of key ${subjectName} formulas / concepts once a week.`,
          "Attempt a few higher-level challenge questions.",
          "Help a friend by explaining a topic – teaching strengthens your understanding.",
        ],
      };
    case "B":
      return {
        title: "Band B – Good Performance",
        description:
          "You are above the pass level, but there is still room to polish your understanding.",
        bullets: [
          `Revisit the topics you got wrong in the ${subjectName} quiz.`,
          "Spend 2–3 short sessions this week doing mixed practice questions.",
          "Summarise each weak area in 3–4 bullet points in your own words.",
        ],
      };
    case "C":
      return {
        title: "Band C – Just Passed",
        description:
          "You are just at the pass level. Strengthen your foundation before moving on.",
        bullets: [
          `Re-watch / re-read notes for the weakest ${subjectName} topics.`,
          "Redo the quiz questions you missed without looking at answers.",
          "Create a mini cheat-sheet (formulas / definitions) and keep it for daily review.",
        ],
      };
    case "FAIL":
    default:
      return {
        title: "Below Pass Mark – Rescue Plan Needed",
        description:
          "Your score is below the required pass mark. Follow this rescue plan for the next few days.",
        bullets: [
          `Go back to the ${subjectName} study package and first use the Mind Map + Short Notes.`,
          "Pause and write your own summary for each subtopic in 1–2 lines.",
          "Do at least 10 focused practice questions for your weakest areas.",
          "After 2–3 study sessions, retry the Weekly Quiz for this subject.",
        ],
      };
  }
};

export const FeedbackBand: React.FC<Props> = ({
  result,
  onRetry,
  onExploreNext,
  onGoDashboard,
}) => {
  if (!result) {
    return (
      <div className="bg-white rounded-2xl shadow p-8 w-full space-y-4">
        <p className="text-sm text-slate-700">
          No quiz result available. Please take a quiz first.
        </p>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={onGoDashboard}
        >
          Go to Progress Dashboard
        </button>
      </div>
    );
  }

  const { subjectName, score, passMark, band } = result;

  // student failed if score < passMark OR band is FAIL
  const failed = score < passMark || band === "FAIL";

  const totalQuestions = Math.max(passMark * 2, score || 1);
  const scorePercent = Math.round((score / totalQuestions) * 100);
  const passPercent = Math.round((passMark / totalQuestions) * 100);

  const training = getTrainingPlan(band, subjectName);

  return (
    <div className="bg-white rounded-2xl shadow p-8 w-full space-y-6">
      {/* Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-200 rounded-2xl px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">QUIZ SUMMARY</p>
          <h2 className="text-lg font-semibold text-slate-900">
            {subjectName}
          </h2>
        </div>

        <div className="text-right space-y-1">
          <p className="text-xs text-slate-500">
            Pass mark: {passPercent}% · Your score:
          </p>
          <p
            className={`text-2xl font-bold ${
              failed ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {scorePercent}%
          </p>
          <p className="text-xs text-slate-600">
            Status:{" "}
            <span className={failed ? "text-red-600" : "text-emerald-600"}>
              {failed ? "Below pass mark" : "At or above pass mark"}
            </span>
          </p>
        </div>
      </div>

      {/* Training band */}
      <div className="border border-amber-300 bg-amber-50 rounded-2xl px-6 py-4 space-y-2">
        <p className="text-xs font-semibold text-amber-700 tracking-wide">
          TRAINING BAND
        </p>
        <h3 className="text-sm font-semibold text-amber-900">
          {training.title}{" "}
          <span className="text-[11px] ml-1 px-2 py-[2px] rounded-full border border-amber-400 text-amber-800">
            Band: {band}
          </span>
        </h3>
        <p className="text-sm text-amber-800">{training.description}</p>
        <ul className="mt-2 text-sm text-amber-900 list-disc list-inside space-y-1">
          {training.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {failed && (
          <button
            className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium"
            onClick={onRetry}
          >
            Start Rescue Plan (Study Package)
          </button>
        )}

        <button
          className="px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium"
          onClick={onExploreNext}
        >
          Explore next subject
        </button>

        <button
          className="text-sm text-slate-600 hover:underline"
          onClick={onGoDashboard}
        >
          Go to Progress Dashboard
        </button>
      </div>
    </div>
  );
};
