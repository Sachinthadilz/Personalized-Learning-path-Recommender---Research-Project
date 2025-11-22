// src/components/StudyPlan.tsx
import React, { useState } from "react";
import type { SubjectPerformance, StudyResource } from "../types";

interface Props {
  subject: SubjectPerformance | null;
  resources: StudyResource[];
  onBack: () => void;
  onStartQuiz: () => void;
}

type ActivePanel = "overview" | "mindmap" | "timetable" | "notes" | "practice";

export const StudyPlan: React.FC<Props> = ({
  subject,
  resources,
  onBack,
  onStartQuiz,
}) => {
  const [activePanel, setActivePanel] = useState<ActivePanel>("overview");

  const subjectName = subject?.name ?? "Subject";

  const mindmap = resources.find((r) => r.type === "mindmap");
  const timetable = resources.find((r) => r.type === "timetable");
  const notes = resources.find((r) => r.type === "notes");
  const practice = resources.find((r) => r.type === "game");

  return (
    <div className="bg-white rounded-2xl shadow p-8 w-full space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Provide Weekly Package – {subjectName}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Based on your weak subject, here is your one-week study package:
            Mind Map, Time Table, Short Notes and Practice Set.
          </p>
        </div>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={onBack}
        >
          Back to Weak Subject List
        </button>
      </div>

      {/* Resource cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Mind Map */}
        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              MIND MAP
            </p>
            <h3 className="text-sm font-semibold text-slate-800">
              {mindmap?.title ?? `${subjectName} Mind Map`}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {mindmap?.description ??
                `Key concepts and relationships for ${subjectName}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePanel("mindmap")}
            className="mt-4 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium"
          >
            Open Mind Map
          </button>
        </div>

        {/* Time Table */}
        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              TIME TABLE
            </p>
            <h3 className="text-sm font-semibold text-slate-800">
              {timetable?.title ?? `${subjectName} Weekly Study Slots`}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {timetable?.description ??
                `Pre-filled schedule for ${subjectName} revision.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePanel("timetable")}
            className="mt-4 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium"
          >
            View Time Table
          </button>
        </div>

        {/* Short Notes */}
        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              SHORT NOTES
            </p>
            <h3 className="text-sm font-semibold text-slate-800">
              {notes?.title ?? `Short Notes: ${subjectName}`}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {notes?.description ??
                `One-page summary of core ${subjectName} topics.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePanel("notes")}
            className="mt-4 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium"
          >
            Open Notes
          </button>
        </div>

        {/* Practice Set */}
        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              PRACTICE SET
            </p>
            <h3 className="text-sm font-semibold text-slate-800">
              {practice?.title ?? `${subjectName} Practice Set`}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {practice?.description ??
                `Targeted questions to strengthen your ${subjectName} skills.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePanel("practice")}
            className="mt-4 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium"
          >
            Start Practice
          </button>
        </div>
      </div>

      {/* Study & Practice description */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Study &amp; Practice (1 Week)
        </h3>
        <p className="text-sm text-slate-600 max-w-2xl">
          Use this package during the week. When you feel ready, take the{" "}
          <span className="font-semibold">Weekly Quiz</span> for{" "}
          {subjectName} to check if you reached the pass mark.
        </p>
        <p className="text-sm text-slate-600">
          How are you feeling about this subject today?
        </p>
        <div className="flex gap-2 text-2xl">
          <button type="button">😟</button>
          <button type="button">😕</button>
          <button type="button">🙂</button>
          <button type="button">🤩</button>
        </div>
      </div>

      {/* 🔍 Dynamic detail panel */}
      {activePanel !== "overview" && (
        <div className="border border-slate-200 rounded-2xl p-6 space-y-3 bg-slate-50">
          {activePanel === "mindmap" && (
            <>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                {subjectName} Mind Map
              </h3>
              <p className="text-sm text-slate-600">
                This is a simple conceptual mind map for <b>{subjectName}</b>.
                You can later replace this with a real diagram, but for now it
                highlights the main idea → subtopics → examples.
              </p>
              <ul className="mt-2 text-sm text-slate-700 list-disc list-inside">
                <li>Core Topic 1 – key idea about {subjectName}</li>
                <li>Core Topic 2 – formulas / definitions</li>
                <li>Core Topic 3 – common mistakes and how to avoid them</li>
              </ul>
            </>
          )}

          {activePanel === "timetable" && (
            <>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                {subjectName} Weekly Study Slots
              </h3>
              <p className="text-sm text-slate-600">
                Suggested one-week plan for revising <b>{subjectName}</b>.
              </p>
              <ul className="mt-2 text-sm text-slate-700 list-disc list-inside">
                <li>Mon / Wed – 1 hour: theory &amp; notes</li>
                <li>Tue / Thu – 1 hour: worked examples</li>
                <li>Fri – 45 mins: past paper questions</li>
                <li>Weekend – 1 hour: recap + self-quiz</li>
              </ul>
            </>
          )}

          {activePanel === "notes" && (
            <>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Short Notes: {subjectName}
              </h3>
              <p className="text-sm text-slate-600">
                High-level summary of important points to remember in{" "}
                <b>{subjectName}</b>.
              </p>
              <ul className="mt-2 text-sm text-slate-700 list-disc list-inside">
                <li>Key definitions and terms</li>
                <li>Most-used formulas / patterns</li>
                <li>1–2 typical exam style questions</li>
              </ul>
            </>
          )}

          {activePanel === "practice" && (
            <>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                {subjectName} Practice Ideas
              </h3>
              <p className="text-sm text-slate-600">
                Use this as a guideline for practice before taking the weekly
                quiz.
              </p>
              <ul className="mt-2 text-sm text-slate-700 list-disc list-inside">
                <li>Do 5–10 short problems from each subtopic.</li>
                <li>Time yourself for at least 2 exam-style questions.</li>
                <li>Note down where you get stuck and revisit those in notes.</li>
              </ul>
            </>
          )}

          <button
            type="button"
            onClick={() => setActivePanel("overview")}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            Close details
          </button>
        </div>
      )}

      {/* Quiz button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
          onClick={onStartQuiz}
        >
          Start Weekly Quiz (per subject)
        </button>
      </div>
    </div>
  );
};
