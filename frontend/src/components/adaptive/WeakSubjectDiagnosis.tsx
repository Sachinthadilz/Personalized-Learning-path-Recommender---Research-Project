// WeakSubjectDiagnosis  shows weak vs strong subjects and action buttons
import React from "react";
import { BookOpen, BarChart2, Zap } from "lucide-react";
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
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Your Weak Subjects Diagnosis</h2>
            <p className="text-sm text-slate-500 mt-1">
              Subjects are loaded from your Academic Profile. Those scoring below 50% are flagged as weak areas.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-semibold transition-all"
            onClick={onGoDashboard}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            View Analytics
          </button>
        </div>
      </div>

      {subjects.length === 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No subjects found</p>
          <p className="text-xs text-slate-500 mt-1">
            Please open your <strong>Academic Profile</strong> and add weak subjects there.
          </p>
        </div>
      )}

      {weak.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wide">Weak Areas  Needs Attention</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weak.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                    <span className="text-xs bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                      Below 50%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Marks: <strong className="text-slate-700">{s.marks}%</strong></span>
                    <span>Grade: <strong className="text-slate-700">{s.grade}</strong></span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-rose-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                      style={{ width: `${Math.min(s.marks, 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                  onClick={() => onStartPlan(s.id)}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Open Study Package
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {strong.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Looking Good</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {strong.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{s.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>Marks: <strong className="text-slate-700">{s.marks}%</strong></span>
                    <span>Grade: <strong className="text-slate-700">{s.grade}</strong></span>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                  {s.marks}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          onClick={onGoDashboard}
        >
          <BarChart2 className="w-4 h-4" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};