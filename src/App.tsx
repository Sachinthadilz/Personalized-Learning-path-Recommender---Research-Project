// src/App.tsx
import React, { useState, useEffect } from "react";
import type {
  View,
  SubjectPerformance,
  QuizResult,
  StudyResource,
  TrainingRecord,
} from "./types";

import { getTrainingData } from "./trainingData";

import { StudentLogin } from "./components/StudentLogin";
import { WeeklySubjectForm } from "./components/WeeklySubjectForm";
import { WeakSubjectDiagnosis } from "./components/WeakSubjectDiagnosis";
import { StudyPlan } from "./components/StudyPlan";
import { AdaptiveQuiz } from "./components/AdaptiveQuiz";
import { FeedbackBand } from "./components/FeedbackBand";
import { ProgressDashboard } from "./components/ProgressDashboard";

import WeeklyPackage from "./components/WeeklyPackage";

const buildResourcesForSubject = (subjectName: string): StudyResource[] => [
  {
    id: `${subjectName}-mindmap`,
    type: "mindmap",
    title: `${subjectName} Mind Map`,
    description: `Key concepts of ${subjectName}`,
  },
  {
    id: `${subjectName}-notes`,
    type: "notes",
    title: `${subjectName} Short Notes`,
    description: `One-page summary for ${subjectName}`,
  },
  {
    id: `${subjectName}-practice`,
    type: "game",
    title: `${subjectName} Practice Quiz`,
    description: `Targeted practice for ${subjectName}`,
  },
];

const App: React.FC = () => {
  const [view, setView] = useState<View>("login");
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const [weeklySubjectNames, setWeeklySubjectNames] = useState<string[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingRecord[]>([]);
  const [isTrainingDataLoading, setIsTrainingDataLoading] = useState(true);

  useEffect(() => {
    getTrainingData()
      .then((data: TrainingRecord[]) => setTrainingData(data))
      .catch((err: Error) => console.error("Training data load error:", err.message))
      .finally(() => setIsTrainingDataLoading(false));
  }, []);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || null;

  const handleWeeklyFormSubmit = (data: SubjectPerformance[]) => {
    const processed = data.map((s) => ({
      ...s,
      isWeak: s.difficulty >= 3 || s.confidence <= 2,
    }));
    setSubjects(processed);
    setView("diagnosis");
  };

  // page-specific background gradient
  const pageBg =
    view === "weeklyPackage"
      ? "from-slate-50 via-indigo-50 to-sky-50"
      : view === "quiz"
        ? "from-slate-50 via-rose-50 to-amber-50"
        : view === "feedback"
          ? "from-slate-50 via-emerald-50 to-teal-50"
          : view === "dashboard"
            ? "from-slate-50 via-cyan-50 to-blue-50"
            : view === "diagnosis"
              ? "from-slate-50 via-red-50 to-orange-50"
              : "from-slate-50 via-sky-50 to-indigo-50";

  const renderContent = () => {
    if (isTrainingDataLoading) return <div>Loading training data...</div>;

    switch (view) {
      case "login":
        return (
          <StudentLogin
            onLogin={(data) => {
              setWeeklySubjectNames(data.weeklySubjects.map((s) => s.subject));
              setView("subjectForm");
            }}
          />
        );

      case "subjectForm":
        return (
          <WeeklySubjectForm
            subjects={weeklySubjectNames}
            onSubmit={handleWeeklyFormSubmit}
            onSkip={() => setView("diagnosis")}
          />
        );

      case "diagnosis":
        return (
          <WeakSubjectDiagnosis
            subjects={subjects}
            onBack={() => setView("subjectForm")}
            onStartPlan={(id) => {
              setSelectedSubjectId(id);
              setView("weeklyPackage");
            }}
            onGoDashboard={() => setView("dashboard")}
          />
        );

      case "package":
        return (
          <StudyPlan
            subject={selectedSubject}
            resources={selectedSubject ? buildResourcesForSubject(selectedSubject.name) : []}
            onBack={() => setView("diagnosis")}
            onStartQuiz={() => setView("quiz")}
          />
        );

      case "weeklyPackage":
        return (
          <WeeklyPackage
            subjectName={selectedSubject?.name ?? "Software Engineering"}
            onBack={() => setView("diagnosis")}
            onStartQuiz={() => setView("quiz")}
          />
        );

      case "quiz":
        return (
          <AdaptiveQuiz
            subject={selectedSubject}
            onCancel={() => setView("weeklyPackage")}
            onCompleted={(r) => {
              setQuizResult(r);
              setView("feedback");
            }}
          />
        );

      case "feedback":
        return (
          <FeedbackBand
            result={quizResult}
            onRetry={() => setView("weeklyPackage")}
            onExploreNext={() => setView("diagnosis")}
            onGoDashboard={() => setView("dashboard")}
          />
        );

      case "dashboard":
        return (
          <ProgressDashboard
            subjects={subjects}
            lastQuizResult={quizResult}
            trainingData={trainingData}
            onBack={() => setView("diagnosis")}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${pageBg}`}>
      {/* dotted overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-25 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:18px_18px]" />

      {/* header */}
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <h1 className="text-xl font-bold text-slate-900">
            Progress Tracking Adaptive Visualizer
          </h1>
        </div>
      </header>

      {/* ✅ no white container card here */}
      <main className="relative z-0 px-4 py-8 md:px-6">
        <div className="mx-auto w-full max-w-6xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
