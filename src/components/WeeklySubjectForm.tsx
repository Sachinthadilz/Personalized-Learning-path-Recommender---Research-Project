// src/components/WeeklySubjectForm.tsx
import React, { useState } from "react";
import type { SubjectPerformance } from "../types";

interface Props {
  subjects: string[]; // names from first form
  onSubmit: (data: SubjectPerformance[]) => void;
  onSkip: () => void;
}

// fallback if first page had no subjects
const DEFAULT_SUBJECTS = ["Mathematics", "DBMS", "OOP", "Networks"];

export const WeeklySubjectForm: React.FC<Props> = ({
  subjects,
  onSubmit,
  onSkip,
}) => {
  const subjectNames =
    subjects && subjects.length > 0 ? subjects : DEFAULT_SUBJECTS;

  const [rows, setRows] = useState<
    { name: string; difficulty: number; confidence: number }[]
  >(
    subjectNames.map((name) => ({
      name,
      difficulty: 3,
      confidence: 3,
    }))
  );

  const updateRow = (
    index: number,
    field: "difficulty" | "confidence",
    value: number
  ) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Research input: weekly learner self-ratings (combined with historical CSV performance analytics)
    const data: SubjectPerformance[] = rows.map((row, index) => ({
      id: `week-${index}`,
      name: row.name,
      difficulty: row.difficulty,
      confidence: row.confidence,
    }));

    onSubmit(data);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow p-8 w-full max-w-3xl space-y-6"
      >
        <h2 className="text-xl font-semibold text-slate-800">
          Subject Info Form (This Week)
        </h2>

        <p className="text-sm text-slate-600">
          Select the subjects you are focusing on this week and rate your
          difficulty and confidence.
        </p>

        {/* ✅ Research visibility line (UI-level) */}
        <p className="text-xs text-slate-500">
          These ratings are combined with historical quiz performance data (CSV)
          to identify weak subjects and generate personalized support.
        </p>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.name}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-slate-200 rounded-xl px-4 py-3"
            >
              <div className="font-medium text-slate-800">{row.name}</div>

              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Difficulty (1–5)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={row.difficulty}
                    onChange={(e) =>
                      updateRow(index, "difficulty", Number(e.target.value))
                    }
                  />
                  <span className="ml-2 text-xs text-slate-600">
                    {row.difficulty}
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Confidence (1–5)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={row.confidence}
                    onChange={(e) =>
                      updateRow(index, "confidence", Number(e.target.value))
                    }
                  />
                  <span className="ml-2 text-xs text-slate-600">
                    {row.confidence}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-sm text-slate-500 hover:underline"
            onClick={onSkip}
          >
            Skip for now
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium"
          >
            Save &amp; Continue
          </button>
        </div>
      </form>
    </div>
  );
};
