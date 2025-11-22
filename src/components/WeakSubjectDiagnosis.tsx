// src/components/WeakSubjectDiagnosis.tsx
import React from "react";
import type { SubjectPerformance } from "../types";

interface Props {
  subjects: SubjectPerformance[];
  onBack: () => void;
  onStartPlan: (subjectId: string) => void;
  onGoDashboard: () => void;
}

export const WeakSubjectDiagnosis: React.FC<Props> = ({
  subjects,
  onBack,
  onStartPlan,
  onGoDashboard,
}) => {
  const weakSubjects = subjects.filter((s) => s.isWeak);
  const others = subjects.filter((s) => !s.isWeak);

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            This Week’s Diagnosis
          </h2>
          <p className="text-sm text-slate-600">
            We identified your weak areas using your difficulty and confidence
            ratings.
          </p>
        </div>
        <button
          className="text-xs px-3 py-1 rounded-full border border-slate-300"
          onClick={onGoDashboard}
        >
          View Analytics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weakSubjects.map((s) => (
          <div
            key={s.id}
            className="border border-red-200 bg-red-50 rounded-xl p-4 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold text-red-800">{s.name}</h3>
              <p className="text-xs text-red-700 mt-1">
                Marked as <span className="font-semibold">Weak</span> based on
                high difficulty ({s.difficulty}/5) and low confidence (
                {s.confidence}/5).
              </p>
              {s.comments && (
                <p className="text-xs text-red-800 mt-2 italic">
                  “{s.comments}”
                </p>
              )}
            </div>
            <button
              className="mt-3 self-start text-xs px-3 py-1 rounded-full bg-red-600 text-white"
              onClick={() => onStartPlan(s.id)}
            >
              Generate Personalized Plan
            </button>
          </div>
        ))}

        {others.map((s) => (
          <div
            key={s.id}
            className="border border-emerald-200 bg-emerald-50 rounded-xl p-4"
          >
            <h3 className="font-semibold text-emerald-800">{s.name}</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Currently not flagged as weak. Keep maintaining your performance!
            </p>
          </div>
        ))}

        {subjects.length === 0 && (
          <p className="text-sm text-slate-500">
            No subjects available. Go back and complete the weekly form first.
          </p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          className="text-sm text-slate-500 hover:underline"
          onClick={onBack}
        >
          Back to weekly form
        </button>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={onGoDashboard}
        >
          Go to Progress Dashboard
        </button>
      </div>
    </div>
  );
};
