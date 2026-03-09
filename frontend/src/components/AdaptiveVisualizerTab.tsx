/**
 * AdaptiveVisualizerTab
 *
 * Self-contained entry point for the Adaptive Progress Tracker.
 * Implements a full mastery-based learning loop:
 *   SubjectForm â†’ Diagnosis â†’ WeeklyPackage â†’ Quiz
 *     â†’ PASS: Mastery screen âœ“
 *     â†’ FAIL: Feedback â†’ RetryLearningPackage (simplified) â†’ Quiz (loop until pass)
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

  // â”€â”€ Mastery loop state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // retryCount tracks how many times each subject has been failed (key = subjectId)
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  // masteredSubjects tracks subjects the student has passed
  const [masteredSubjects, setMasteredSubjects] = useState<string[]>([]);

  // â”€â”€ Load persisted session on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    (async () => {
      try {
        setStatus({ type: "loading", message: "Loading your sessionâ€¦" });
        // Load weak subjects from the academic profile
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

        // Restore quiz history from session
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

  // â”€â”€ Derived helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;

  /** How many attempts has the student made for the selected subject? */
  const currentAttemptNumber = selectedSubjectId
    ? (retryCount[selectedSubjectId] ?? 0) + 1
    : 1;

  /** Retry level â€” 1 = normal package, 2+ = simplified retry package */
  const currentLevel = currentAttemptNumber;

  // â”€â”€ Subject submission â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Subjects loaded from Academic Profile  no manual submission needed

  // â”€â”€ Quiz completion (core mastery loop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      // âœ“ Mastered â€” add to mastered list
      setMasteredSubjects((prev) =>
        prev.includes(result.subjectId) ? prev : [...prev, result.subjectId]
      );
      setView("mastery");
    } else {
      // âœ— Failed â€” increment retry count, go to feedback
      setRetryCount((prev) => ({
        ...prev,
        [result.subjectId]: (prev[result.subjectId] ?? 0) + 1,
      }));
      setView("feedback");
    }
  };

  // â”€â”€ Start retraining (from feedback screen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleStartRetraining = () => {
    setView("retryPackage");
  };

  // â”€â”€ Reset session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleReset = async () => {
    try {
      await adaptiveApi.resetSession();
    } catch { /* ignore */ }
    setQuizHistory([]);
    setQuizResult(null);
    setSelectedSubjectId(null);
    setRetryCount({});
    setMasteredSubjects([]);
    // Re-fetch weak subjects from the academic profile
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

  // â”€â”€ Page background per view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pageBg: Record<AdaptiveView, string> = {
    diagnosis:     "from-slate-50 via-red-50 to-orange-50",
    weeklyPackage: "from-slate-50 via-indigo-50 to-sky-50",
    retryPackage:  "from-slate-50 via-orange-50 to-red-50",
    quiz:          "from-slate-50 via-rose-50 to-amber-50",
    feedback:      "from-slate-50 via-red-50 to-orange-50",
    dashboard:     "from-slate-50 via-cyan-50 to-blue-50",
    mastery:       "from-slate-50 via-emerald-50 to-teal-50",
  };

  // â”€â”€ Mastery celebration screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const MasteryScreen = () => {
    const subject = selectedSubject;
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
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
              <p className="text-xs text-emerald-700">Band {quizResult.band} Â· {quizResult.score}/{quizResult.total} correct</p>
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 transition"
            >
              Continue to Next Subject â†’
            </button>
            <button
              onClick={() => setView("dashboard")}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              View Progress Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  // â”€â”€ Render current view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderContent = () => {
    switch (view) {
      case "diagnosis":
        return (
          <WeakSubjectDiagnosis
            subjects={subjects}
            onStartPlan={(id) => {
              setSelectedSubjectId(id);
              // If this subject was already fully retried, go to retry package directly
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

  // â”€â”€ Tab navigation breadcrumb â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const navItems: { label: string; view: AdaptiveView }[] = [
    { label: "Diagnosis", view: "diagnosis" },
    { label: "Dashboard", view: "dashboard" },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${pageBg[view]} -m-4 md:-m-8`} style={{ margin: 0, padding: "0 0 2rem" }}>
      {/* Dotted overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-20 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Sub-header */}
      <div className="relative z-10 border-b bg-white/70 backdrop-blur px-4 md:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 max-w-5xl mx-auto">
          <div>
            <h2 className="text-base font-bold text-slate-900">Progress Tracking Adaptive Visualizer</h2>
            {user && (
              <p className="text-xs text-slate-600 mt-0.5">
                Logged in as <span className="font-semibold">{user.firstName ?? user.email}</span>
                {masteredSubjects.length > 0 && (
                  <span className="ml-2 text-emerald-600 font-semibold">
                    Â· {masteredSubjects.length} mastered âœ“
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
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  view === n.view
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {n.label}
              </button>
            ))}
            <button
              onClick={handleReset}
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
              title="Reset session and start over"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Status banner */}
        {status.type !== "idle" && (
          <div
            className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              status.type === "loading"
                ? "bg-amber-100 text-amber-900"
                : status.type === "success"
                ? "bg-emerald-100 text-emerald-900"
                : "bg-red-100 text-red-900"
            }`}
          >
            {status.message}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-0 max-w-5xl mx-auto px-4 md:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdaptiveVisualizerTab;
