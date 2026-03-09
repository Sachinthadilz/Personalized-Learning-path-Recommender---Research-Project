// WeakSubjectDiagnosis – shows weak vs strong subjects and action buttons
import React from "react";
import type { SubjectPerformance } from "./types";

interface Props {
  subjects: SubjectPerformance[];
  onStartPlan: (subjectId: string) => void;
  onGoDashboard: () => void;
}

export const WeakSubjectDiagnosis: React.FC<Props> = ({
  subjects,
  onStartPlan,
  onGoDashboard,
}) => {
  const weak = subjects.filter((s) => s.isWeak);
  const strong = subjects.filter((s) => !s.isWeak);

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Your Weak Subjects Diagnosis</h2>
          <p className="text-sm text-slate-600 mt-1">
            Subjects are loaded from your Academic Profile. Those scoring below 50% are flagged as weak areas.
          </p>
        </div>
        <button
          className="text-xs px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50"
          onClick={onGoDashboard}
        >
          View Analytics →
        </button>
      </div>

      {subjects.length === 0 && (
        <p className="text-sm text-slate-500">
          No weak subjects found. Please open your <strong>Academic Profile</strong> and add weak subjects there.
        </p>
      )}

      {weak.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 mb-2">Weak Areas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weak.map((s) => (
              <div
                key={s.id}
                className="border border-red-200 bg-red-50 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-semibold text-red-800">{s.name}</h4>
                </div>
                <button
                  className="mt-3 self-start text-xs px-4 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700"
                  onClick={() => onStartPlan(s.id)}
                >
                  Open Study Package
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {strong.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-emerald-700 mb-2">Looking Good</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strong.map((s) => (
              <div
                key={s.id}
                className="border border-emerald-200 bg-emerald-50 rounded-xl p-4"
              >
                <h4 className="font-semibold text-emerald-800">{s.name}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button className="text-sm text-indigo-600 hover:underline" onClick={onGoDashboard}>
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
};
