/**
 * AdaptiveVisualizerTab
 *
 * Self-contained entry point for the Adaptive Progress Tracker.
 * Implements a full mastery-based learning loop:
 *   SubjectForm -> Diagnosis -> WeeklyPackage -> Quiz
 *     -> PASS: Mastery screen
 *     -> FAIL: Feedback -> RetryLearningPackage (simplified) -> Quiz (loop until pass)
 */
import React, { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { adaptiveApi } from "./adaptive/adaptiveApi";
import { authService } from "../services/authService";
import { WeakSubjectDiagnosis } from "./adaptive/WeakSubjectDiagnosis";
import WeeklyPackage from "./adaptive/WeeklyPackage";
import { AdaptiveQuiz } from "./adaptive/AdaptiveQuiz";
import { FeedbackBand } from "./adaptive/FeedbackBand";
import { ProgressDashboard } from "./adaptive/ProgressDashboard";
import RetryLearningPackage from "./adaptive/RetryLearningPackage";
import type { AdaptiveView, SubjectPerformance, QuizResult } from "./adaptive/types";

type StatusType = "idle" | "loading" | "success" | "error";
interface Status { type: StatusType; message: string }

interface Props {
  profileVersion?: number;
}

const gradeFromMarks = (m: number): string => {
  if (m >= 70) return "A";
  if (m >= 60) return "B";
  if (m >= 50) return "C";
  if (m >= 40) return "D";
  if (m >= 30) return "E";
  return "F";
};
const difficultyFromMarks = (m: number): number =>
  Math.max(1, Math.min(5, 5 - Math.floor(m / 25)));
const confidenceFromMarks = (m: number): number =>
  Math.max(1, Math.min(5, Math.ceil(m / 25)));

const AdaptiveVisualizerTab: React.FC<Props> = ({ profileVersion = 0 }) => {
  const { user } = useAuth();

  const [view, setView] = useState<AdaptiveView>("diagnosis");
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });

  // -- Mastery loop state ---------------------------------------------------
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const [masteredSubjects, setMasteredSubjects] = useState<string[]>([]);

  // -- Load persisted session on mount -------------------------------------
  useEffect(() => {
    (async () => {
      try {
        setStatus({ type: "loading", message: "Loading your session..." });
        const profileRes = await authService.getAcademicProfile();
        const weakSubjs = profileRes.data?.weakSubjects ?? [];
        setSubjects(weakSubjs.map((w) => ({
          id: w.name.trim().toLowerCase().replace(/\s+/g, "-"),
          name: w.name,
          marks: w.marks,
          grade: w.grade || gradeFromMarks(w.marks),
          difficulty: difficultyFromMarks(w.marks),
          confidence: confidenceFromMarks(w.marks),
          isWeak: w.marks < 50,
        })));

        const session = await adaptiveApi.getSession();
        if (session.quizHistory?.length > 0) {
          setQuizHistory(session.quizHistory);
          const counts: Record<string, number> = {};
          const mastered: string[] = [];
          for (const r of session.quizHistory) {
            if (r.passed) {
              if (!mastered.includes(r.subjectId)) mastered.push(r.subjectId);
            } else {
              counts[r.subjectId] = (counts[r.subjectId] ?? 0) + 1;
            }
          }
          setRetryCount(counts);
          setMasteredSubjects(mastered);
        }
        setStatus({ type: "idle", message: "" });
      } catch {
        setStatus({ type: "idle", message: "" });
      }
    })();
  }, [profileVersion]);

  // -- Derived helpers -----------------------------------------------------
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;

  const currentAttemptNumber = selectedSubjectId
    ? (retryCount[selectedSubjectId] ?? 0) + 1
    : 1;

  const currentLevel = currentAttemptNumber;

  // -- Quiz completion (core mastery loop) ---------------------------------
  const handleQuizCompleted = async (result: QuizResult) => {
    const passMark = Math.ceil(result.total * 0.5);
    const passed = result.score >= passMark;
    const enriched: QuizResult = { ...result, passed, attemptNumber: currentAttemptNumber };

    setQuizResult(enriched);
    const updated = [...quizHistory, enriched];
    setQuizHistory(updated);

    try {
      await adaptiveApi.saveQuizResult(enriched);
    } catch {
      // non-critical
    }

    if (passed) {
      setMasteredSubjects((prev) =>
        prev.includes(result.subjectId) ? prev : [...prev, result.subjectId]
      );
      setView("mastery");
    } else {
      setRetryCount((prev) => ({
        ...prev,
        [result.subjectId]: (prev[result.subjectId] ?? 0) + 1,
      }));
      setView("feedback");
    }
  };

  // -- Start retraining (from feedback screen) -----------------------------
  const handleStartRetraining = () => {
    setView("retryPackage");
  };

  // -- Reset session -------------------------------------------------------
  const handleReset = async () => {
    try {
      await adaptiveApi.resetSession();
    } catch { /* ignore */ }
    setQuizHistory([]);
    setQuizResult(null);
    setSelectedSubjectId(null);
    setRetryCount({});
    setMasteredSubjects([]);
    try {
      const profileRes = await authService.getAcademicProfile();
      const weakSubjs = profileRes.data?.weakSubjects ?? [];
      setSubjects(weakSubjs.map((w) => ({
        id: w.name.trim().toLowerCase().replace(/\s+/g, "-"),
        name: w.name,
        marks: w.marks,
        grade: w.grade || gradeFromMarks(w.marks),
        difficulty: difficultyFromMarks(w.marks),
        confidence: confidenceFromMarks(w.marks),
        isWeak: w.marks < 50,
      })));
    } catch {
      setSubjects([]);
    }
    setView("diagnosis");
  };

  // -- Mastery celebration screen ------------------------------------------
  const MasteryScreen = () => {
    const subject = selectedSubject;
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-10 max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Mastery Achieved!</h2>
            <p className="text-slate-500 text-sm mt-2">
              You passed <span className="font-bold text-emerald-600">{subject?.name ?? "this subject"}</span>{" "}
              {currentAttemptNumber > 1 && `after ${currentAttemptNumber} attempts`}!
            </p>
          </div>
          {quizResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 space-y-1">
              <p className="text-3xl font-black text-emerald-600">
                {Math.round((quizResult.score / quizResult.total) * 100)}%
              </p>
              <p className="text-xs text-emerald-700">
                {`Band ${quizResult.band} \u00B7 ${quizResult.score}/${quizResult.total} correct`}
              </p>
            </div>
          )}
          <p className="text-sm text-slate-600">
            {masteredSubjects.length > 1
              ? `You've now mastered ${masteredSubjects.length} subjects. Keep going!`
              : "This is your first mastered subject. Keep going!"}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setView("diagnosis")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 transition"
            >
              Continue to Next Subject
            </button>
            <button
              onClick={() => setView("dashboard")}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              View Progress Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -- Render current view -------------------------------------------------
  const renderContent = () => {
    switch (view) {
      case "diagnosis":
        return (
          <WeakSubjectDiagnosis
            subjects={subjects}
            onStartPlan={(id) => {
              setSelectedSubjectId(id);
              const attempts = retryCount[id] ?? 0;
              setView(attempts > 0 ? "retryPackage" : "weeklyPackage");
            }}
            onGoDashboard={() => setView("dashboard")}
          />
        );

      case "weeklyPackage":
        return (
          <WeeklyPackage
            subjectName={selectedSubject?.name ?? "Subject"}
            marks={selectedSubject?.marks}
            grade={selectedSubject?.grade}
            onBack={() => setView("diagnosis")}
            onStartQuiz={() => setView("quiz")}
          />
        );

      case "retryPackage":
        return (
          <RetryLearningPackage
            subjectName={selectedSubject?.name ?? "Subject"}
            level={Math.max(2, currentLevel)}
            attemptNumber={currentAttemptNumber}
            onStartQuiz={() => setView("quiz")}
            onBack={() => setView("diagnosis")}
          />
        );

      case "quiz":
        return (
          <AdaptiveQuiz
            subject={selectedSubject}
            onCancel={() => setView(currentLevel > 1 ? "retryPackage" : "weeklyPackage")}
            onCompleted={handleQuizCompleted}
            attemptNumber={currentAttemptNumber}
          />
        );

      case "feedback":
        return (
          <FeedbackBand
            result={quizResult}
            subjectName={selectedSubject?.name ?? "Subject"}
            onStartRetraining={handleStartRetraining}
            onExploreNext={() => setView("diagnosis")}
            onGoDashboard={() => setView("dashboard")}
            attemptNumber={currentAttemptNumber}
          />
        );

      case "mastery":
        return <MasteryScreen />;

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

  // -- Tab navigation ------------------------------------------------------
  const navItems: { label: string; view: AdaptiveView }[] = [
    { label: "Diagnosis", view: "diagnosis" },
    { label: "Dashboard", view: "dashboard" },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Sub-header */}
      <div className="rounded-2xl bg-white border border-blue-100 shadow-sm px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Progress Tracking Adaptive Visualizer
            </h2>
            {user && (
              <p className="text-xs text-slate-500 mt-0.5">
                Logged in as <span className="font-semibold text-slate-700">{user.firstName ?? user.email}</span>
                {masteredSubjects.length > 0 && (
                  <span className="ml-2 text-emerald-600 font-semibold">
                    {`\u00B7 ${masteredSubjects.length} mastered \u2713`}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {navItems.map((n) => (
              <button
                key={n.view}
                onClick={() => setView(n.view)}
                className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all duration-200 ${
                  view === n.view
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {n.label}
              </button>
            ))}
            <button
              onClick={handleReset}
              className="text-xs px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 font-semibold"
              title="Reset session and start over"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Status banner */}
        {status.type !== "idle" && (
          <div
            className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              status.type === "loading"
                ? "bg-blue-100 text-blue-800"
                : status.type === "success"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status.message}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdaptiveVisualizerTab;