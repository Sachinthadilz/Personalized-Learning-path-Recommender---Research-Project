import React, { useEffect, useState } from "react";
import type {
  View,
  SubjectPerformance,
  QuizResult,
  StudyResource,
} from "../../types";

import { WeeklySubjectForm } from "../../components/progress-tracker/WeeklySubjectForm.tsx";
import { WeakSubjectDiagnosis } from "../../components/progress-tracker/WeakSubjectDiagnosis.tsx";
import { StudyPlan } from "../../components/progress-tracker/StudyPlan.tsx";
import { AdaptiveQuiz } from "../../components/progress-tracker/AdaptiveQuiz.tsx";
import { FeedbackBand } from "../../components/progress-tracker/FeedbackBand.tsx";
import { ProgressDashboard } from "../../components/progress-tracker/ProgressDashboard.tsx";
import WeeklyPackage from "../../components/progress-tracker/WeeklyPackage.tsx";

const API_BASE_URL = "http://localhost:4000";

type ApiStatus = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
};

interface ProgressTrackerModuleProps {
  studentName?: string;
  studentEmail?: string;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const errorPayload =
      payload as { error?: string; message?: string } | string | null;

    const msg =
      (typeof errorPayload === "object" && errorPayload?.error) ||
      (typeof errorPayload === "object" && errorPayload?.message) ||
      `Request failed (${res.status})`;

    throw new Error(msg);
  }

  return payload as T;
}

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

const ProgressTrackerModule: React.FC<ProgressTrackerModuleProps> = ({
  studentName: initialStudentName = "",
  studentEmail: initialStudentEmail = "",
}) => {
  const [view, setView] = useState<View>("subjectForm");
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [studentEmail, setStudentEmail] = useState<string>(initialStudentEmail);
  const [studentName, setStudentName] = useState<string>(initialStudentName);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    type: "idle",
    message: "",
  });

  const selectedSubject =
    subjects.find((subject) => subject.id === selectedSubjectId) ?? null;

  useEffect(() => {
    setStudentName(initialStudentName);
    setStudentEmail(initialStudentEmail);
  }, [initialStudentName, initialStudentEmail]);

  const createStudentInDb = async (name: string, email: string) => {
    if (!email) return;

    setApiStatus({
      type: "loading",
      message: "Saving student to database...",
    });

    try {
      await apiPost("/api/demo/student", { name, email });
      setApiStatus({
        type: "success",
        message: "Student saved to database",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";

      if (msg.includes("E11000") || msg.toLowerCase().includes("duplicate")) {
        setApiStatus({
          type: "success",
          message: "Student already exists. Continuing...",
        });
      } else {
        setApiStatus({
          type: "error",
          message: `Student save failed: ${msg}`,
        });
      }
    }
  };

  useEffect(() => {
    if (initialStudentEmail) {
      createStudentInDb(initialStudentName || "Student", initialStudentEmail);
    }
  }, [initialStudentEmail, initialStudentName]);

  const saveWeeklySubjectsToDb = async (data: SubjectPerformance[]) => {
    if (!studentEmail) {
      setApiStatus({
        type: "error",
        message: "Student email not found.",
      });
      return;
    }

    setApiStatus({
      type: "loading",
      message: "Saving weekly subjects to database...",
    });

    try {
      const week = 1;

      for (const subject of data) {
        await apiPost("/api/demo/weekly-subject", {
          studentEmail,
          week,
          subject: subject.name,
          grade: subject.grade,
        });
      }

      setApiStatus({
        type: "success",
        message: "Weekly subjects saved to database",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";

      if (msg.includes("E11000") || msg.toLowerCase().includes("duplicate")) {
        setApiStatus({
          type: "success",
          message: "Some weekly records already exist. Continuing...",
        });
      } else {
        setApiStatus({
          type: "error",
          message: `Weekly save failed: ${msg}`,
        });
      }
    }
  };

  const handleWeeklyFormSubmit = async (data: SubjectPerformance[]) => {
    await saveWeeklySubjectsToDb(data);

    const processed: SubjectPerformance[] = data.map((subject) => ({
      ...subject,
      isWeak: ["C-", "D+", "D", "F"].includes((subject.grade || "").toUpperCase()),
    }));

    setSubjects(processed);
    setView("diagnosis");
  };

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
    switch (view) {
      case "subjectForm":
        return (
          <WeeklySubjectForm
            subjects={[]}
            onSubmit={handleWeeklyFormSubmit}
            onSkip={() => setView("diagnosis")}
          />
        );

      case "diagnosis":
        return (
          <WeakSubjectDiagnosis
            subjects={subjects}
            onBack={() => setView("subjectForm")}
            onStartPlan={(id: string) => {
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
            resources={
              selectedSubject
                ? buildResourcesForSubject(selectedSubject.name)
                : []
            }
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
            onCompleted={(result: QuizResult) => {
              setQuizResult(result);
              setQuizHistory((prev) => [...prev, result]);
              setView("feedback");
            }}
          />
        );

      case "feedback":
        return (
          <FeedbackBand
            result={quizResult}
            subjectName={selectedSubject?.name ?? "Subject"}
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
            quizHistory={quizHistory}
            onBack={() => setView("diagnosis")}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${pageBg}`}>
      <div className="pointer-events-none fixed inset-0 opacity-25 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:18px_18px]" />

      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <h1 className="text-xl font-bold text-slate-900">
            Progress Tracking Adaptive Visualizer
          </h1>

          {apiStatus.type !== "idle" && (
            <div
              className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                apiStatus.type === "loading"
                  ? "bg-amber-100 text-amber-900"
                  : apiStatus.type === "success"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-red-100 text-red-900"
              }`}
            >
              {apiStatus.message}
            </div>
          )}
        </div>
      </header>

      <main className="relative z-0 px-4 py-8 md:px-6">
        <div className="mx-auto w-full max-w-6xl">{renderContent()}</div>
      </main>
    </div>
  );
};

export default ProgressTrackerModule;