// src/App.tsx
import React, { useState, useEffect } from "react";
import type {
  View,
  SubjectPerformance,
  QuizResult,
  StudyResource,
  TrainingRecord,
} from "./types";

import { getTrainingData } from "./data/trainingData";

import { StudentLogin } from "./components/StudentLogin";
import { WeeklySubjectForm } from "./components/WeeklySubjectForm";
import { WeakSubjectDiagnosis } from "./components/WeakSubjectDiagnosis";
import { StudyPlan } from "./components/StudyPlan";
import { AdaptiveQuiz } from "./components/AdaptiveQuiz";
import { FeedbackBand } from "./components/FeedbackBand";
import { ProgressDashboard } from "./components/ProgressDashboard";

// 🔹 Build subject-specific resources dynamically
const buildResourcesForSubject = (subjectName: string): StudyResource[] => [
  {
    id: `${subjectName}-mindmap`,
    type: "mindmap",
    title: `${subjectName} Mind Map`,
    description: `Key concepts and relationships for ${subjectName}.`,
  },
  {
    id: `${subjectName}-timetable`,
    type: "timetable",
    title: `${subjectName} Weekly Study Slots`,
    description: `Pre-filled schedule for ${subjectName} revision.`,
  },
  {
    id: `${subjectName}-notes`,
    type: "notes",
    title: `Short Notes: ${subjectName}`,
    description: `One-page summary of core ${subjectName} topics.`,
  },
  {
    id: `${subjectName}-practice`,
    type: "game",
    title: `${subjectName} Practice Set`,
    description: `Targeted questions to strengthen your ${subjectName} skills.`,
  },
];

export const App: React.FC = () => {
  const [view, setView] = useState<View>("login");
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // subjects typed in first screen
  const [weeklySubjectNames, setWeeklySubjectNames] = useState<string[]>([]);

  // 🔹 CSV training data (from final_training_dataset_mapped.csv)
  const [trainingData, setTrainingData] = useState<TrainingRecord[]>([]);
  const [isTrainingDataLoading, setIsTrainingDataLoading] = useState(true);

  // load CSV once on app start
  useEffect(() => {
    getTrainingData()
      .then((data) => {
        setTrainingData(data);
      })
      .catch((err) => {
        console.error("Error loading training data:", err);
      })
      .finally(() => {
        setIsTrainingDataLoading(false);
      });
  }, []);

  const selectedSubject =
    subjects.find((s) => s.id === selectedSubjectId) || null;

  const handleWeeklyFormSubmit = (data: SubjectPerformance[]) => {
    const withWeakFlag = data.map((s) => ({
      ...s,
      isWeak: s.difficulty >= 3 || s.confidence <= 2,
    }));
    setSubjects(withWeakFlag);
    setView("diagnosis");
  };

  const handleStartPlanForSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setView("package");
  };

  const handleStartQuiz = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setView("quiz");
  };

  const handleQuizCompleted = (result: QuizResult) => {
    setQuizResult(result);
    setView("feedback");
  };

  const handleGoToDashboard = () => {
    setView("dashboard");
  };

  const handleExploreNextSubject = () => {
    setView("diagnosis");
  };

  const renderContent = () => {
    // optional: show loading while CSV is still loading
    if (isTrainingDataLoading) {
      return <div>Loading training data...</div>;
    }

    switch (view) {
      case "login":
        return (
          <StudentLogin
            onLogin={(data) => {
              // save subject names for next page
              setWeeklySubjectNames(
                data.weeklySubjects.map((s) => s.subject).filter(Boolean)
              );
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
            onStartPlan={handleStartPlanForSubject}
            onGoDashboard={handleGoToDashboard}
          />
        );

      case "package": {
        const resources = selectedSubject
          ? buildResourcesForSubject(selectedSubject.name)
          : [];

        return (
          <StudyPlan
            subject={selectedSubject}
            resources={resources}
            onBack={() => setView("diagnosis")}
            onStartQuiz={() =>
              selectedSubject && handleStartQuiz(selectedSubject.id)
            }
          />
        );
      }

      case "quiz":
        return (
          <AdaptiveQuiz
            subject={selectedSubject}
            onCancel={() => setView("package")}
            onCompleted={handleQuizCompleted}
          />
        );

      case "feedback":
        return (
          <FeedbackBand
            result={quizResult}
            onRetry={() => setView("package")} // go back to package
            onExploreNext={handleExploreNextSubject}
            onGoDashboard={handleGoToDashboard}
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">
          Progress Tracking Adaptive Visualizer
        </h1>
        <button
          className="text-sm px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-50"
          onClick={handleGoToDashboard}
        >
          View Dashboard
        </button>
      </header>

      <main className="flex-1 p-6 flex justify-center">
        <div className="w-full max-w-5xl">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
