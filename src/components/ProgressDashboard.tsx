// src/components/ProgressDashboard.tsx
import React, { useMemo } from "react";
import type {
  SubjectPerformance,
  QuizResult,
  TrainingRecord,
} from "../types";

interface ProgressDashboardProps {
  subjects: SubjectPerformance[];
  lastQuizResult: QuizResult | null;
  trainingData: TrainingRecord[]; // CSV data
  onBack: () => void;
}

// helper: calculate stats for a single subject from CSV training data
const getSubjectStats = (
  trainingData: TrainingRecord[],
  subjectName: string
) => {
  const rows = trainingData.filter((r) => r.subject === subjectName);
  if (rows.length === 0) return null;

  const attempts = rows.length;
  const avgScore =
    rows.reduce((sum, r) => sum + r.quizScore, 0) / attempts;
  const avgDifficulty =
    rows.reduce((sum, r) => sum + r.difficulty, 0) / attempts;
  const avgConfidence =
    rows.reduce((sum, r) => sum + r.confidence, 0) / attempts;

  return { attempts, avgScore, avgDifficulty, avgConfidence };
};

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  subjects,
  lastQuizResult,
  trainingData,
  onBack,
}) => {
  const {
    totalAttempts,
    averageScore,
    passRate,
    masteredCount,
    improvementCount,
    criticalCount,
  } = useMemo(() => {
    const totalAttempts = trainingData.length;

    if (totalAttempts === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        masteredCount: 0,
        improvementCount: 0,
        criticalCount: 0,
      };
    }

    const totalScore = trainingData.reduce(
      (sum, row) => sum + row.quizScore,
      0
    );

    const passCount = trainingData.filter(
      (row) => row.quizScore >= row.passMark
    ).length;

    const masteredCount = trainingData.filter(
      (row) => row.band === "Mastered Zone"
    ).length;

    const improvementCount = trainingData.filter(
      (row) => row.band === "Improvement Zone"
    ).length;

    const criticalCount = trainingData.filter(
      (row) => row.band === "Critical Zone"
    ).length;

    return {
      totalAttempts,
      averageScore: totalScore / totalAttempts,
      passRate: (passCount / totalAttempts) * 100,
      masteredCount,
      improvementCount,
      criticalCount,
    };
  }, [trainingData]);

  return (
    <div className="w-full space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">
          Progress Dashboard
        </h2>
        <button
          onClick={onBack}
          className="px-3 py-1 text-sm rounded-full border border-slate-300 hover:bg-slate-50"
        >
          Back to Subjects
        </button>
      </div>

      {/* Global stats from CSV */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Quiz Attempts
          </h3>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalAttempts}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            From CSV training dataset
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Average Score
          </h3>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {averageScore.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Pass Rate
          </h3>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {passRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Bands Overview
          </h3>
          <p className="mt-2 text-sm text-slate-700">
            Mastered:{" "}
            <span className="font-semibold text-emerald-600">
              {masteredCount}
            </span>{" "}
            • Improvement:{" "}
            <span className="font-semibold text-amber-500">
              {improvementCount}
            </span>{" "}
            • Critical (Weak):{" "}
            <span className="font-semibold text-rose-500">
              {criticalCount}
            </span>
          </p>
        </div>
      </div>

      {/* Last quiz result */}
      {lastQuizResult && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Last Quiz Summary
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              Subject:{" "}
              <span className="font-semibold">
                {lastQuizResult.subjectName}
              </span>
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              Score:{" "}
              <span className="font-semibold">
                {lastQuizResult.score}
              </span>
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              Band:{" "}
              <span className="font-semibold text-indigo-600">
                {lastQuizResult.band}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Subject list + per-subject stats */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Subjects Overview
        </h3>

        {subjects.length === 0 ? (
          <p className="text-sm text-slate-400">
            No weekly subjects added yet.
          </p>
        ) : (
          <div className="space-y-2">
            {subjects.map((subject) => {
              const stats = getSubjectStats(
                trainingData,
                subject.name // SubjectPerformance uses "name"
              );

              return (
                <div
                  key={subject.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between border border-slate-100 rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {subject.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Self-rated difficulty: {subject.difficulty} • Confidence:{" "}
                      {subject.confidence}{" "}
                      {subject.isWeak && (
                        <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[11px] font-semibold">
                          Weak Area
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="mt-2 md:mt-0 text-xs text-slate-600">
                    {stats ? (
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-50">
                          CSV avg score:{" "}
                          <span className="font-semibold">
                            {stats.avgScore.toFixed(1)}%
                          </span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-50">
                          CSV difficulty:{" "}
                          <span className="font-semibold">
                            {stats.avgDifficulty.toFixed(1)}
                          </span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-50">
                          CSV confidence:{" "}
                          <span className="font-semibold">
                            {stats.avgConfidence.toFixed(1)}
                          </span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-50">
                          Attempts:{" "}
                          <span className="font-semibold">
                            {stats.attempts}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span className="italic text-slate-400">
                        No historical CSV data for this subject.
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
  );
};

export default ProgressDashboard;
