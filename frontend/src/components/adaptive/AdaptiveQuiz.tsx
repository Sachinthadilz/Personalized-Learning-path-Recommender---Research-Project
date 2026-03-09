// AdaptiveQuiz  adaptive MCQ quiz for a selected subject
import React, { useEffect, useState } from "react";
import type { SubjectPerformance, QuizResult } from "./types";
import { authService } from "../../services/authService";

interface Props {
  subject: SubjectPerformance | null;
  onCancel: () => void;
  onCompleted: (result: QuizResult) => void;
  attemptNumber?: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

const computeBand = (score: number, passMark: number): QuizResult["band"] => {
  if (score >= passMark + 3) return "A";
  if (score >= passMark + 1) return "B";
  if (score >= passMark) return "C";
  return "D";
};

export const AdaptiveQuiz: React.FC<Props> = ({ subject, onCancel, onCompleted, attemptNumber = 1 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingMsg, setLoadingMsg] = useState("Loading quiz questions…");
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    if (!subject) return;
    setQuizError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setCompleted(false);
    setSelectedIndex(null);

    const toQuestions = (aiQs: { question: string; options: string[]; correctIndex: number }[]) =>
      aiQs.map((q, i) => ({ id: `ai-${i}`, text: q.question, options: q.options, correctIndex: q.correctIndex }));

    (async () => {
      try {
        // On retry attempts (attemptNumber > 1), always generate fresh questions — skip cache
        if (attemptNumber <= 1) {
          // 1. Check cache first (first attempt only)
          setLoadingMsg("Loading quiz questions…");
          const cached = await authService.getStudyMaterial(subject.name);
          if (cached?.data?.quizQuestions && cached.data.quizQuestions.length >= 5) {
            setQuestions(toQuestions(cached.data.quizQuestions));
            return;
          }
        } else {
          setLoadingMsg(`Generating new quiz for ${subject.name} using AI… (5-10 seconds)`);
        }

        // 2. Generate fresh questions via Groq (always on retry, or when no cache)
        if (attemptNumber <= 1) {
          setLoadingMsg(`Generating quiz for ${subject.name} using AI… (5-10 seconds)`);
        }
        const isRetry = attemptNumber > 1;
        const gen = await authService.generateStudyMaterial(subject.name, subject.marks, subject.grade, isRetry);
        if (gen?.data?.quizQuestions && gen.data.quizQuestions.length >= 5) {
          setQuestions(toQuestions(gen.data.quizQuestions));
          return;
        }

        // 3. Groq returned but quizQuestions still empty — try once more
        setLoadingMsg(`Retrying quiz generation for ${subject.name}…`);
        const retry = await authService.generateStudyMaterial(subject.name, subject.marks, subject.grade, isRetry);
        if (retry?.data?.quizQuestions && retry.data.quizQuestions.length >= 5) {
          setQuestions(toQuestions(retry.data.quizQuestions));
          return;
        }

        setQuizError(`Could not generate quiz questions for "${subject.name}". Please check your Groq API key and try again.`);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? err?.message ?? "";
        if (msg.includes("GROQ_API_KEY") || msg.includes("not configured")) {
          setQuizError("Groq API key is not configured. Please add your GROQ_API_KEY to backend-auth/.env and restart the server.");
        } else if (msg.includes("503") || msg.includes("fetch") || msg.includes("Network")) {
          setQuizError("Cannot reach the server. Make sure backend-auth is running on port 5001.");
        } else {
          setQuizError(`Failed to load quiz questions for "${subject.name}". ${msg || "Please try again."}`);
        }
      }
    })();
  }, [subject, attemptNumber]);

  if (!subject) {
    return (
      <div className="bg-white rounded-2xl shadow p-8 space-y-4">
        <p className="text-sm text-slate-700">No subject selected. Go back and choose a weak subject first.</p>
        <button className="text-sm text-indigo-600 hover:underline" onClick={onCancel}>
           Back
        </button>
      </div>
    );
  }

  if (quizError) {
    return (
      <div className="bg-white rounded-2xl shadow p-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <p className="text-sm text-red-700 text-center max-w-sm">{quizError}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="text-sm text-slate-500 hover:underline">Back</button>
          <button
            onClick={() => { setQuizError(null); setQuestions([]); }}
            className="text-sm px-4 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow p-12 flex flex-col items-center gap-4 text-slate-500">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-center max-w-xs">{loadingMsg}</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (selectedIndex === null) return;

    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    const newScore = score + (isCorrect ? 1 : 0);

    if (currentIndex + 1 < questions.length) {
      setScore(newScore);
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      return;
    }

    const total = questions.length;
    const passMark = Math.ceil(total * 0.5);
    const band = computeBand(newScore, passMark);

    setScore(newScore);
    setCompleted(true);
    onCompleted({ subjectId: subject.id, score: newScore, total, band, attemptNumber, passed: newScore >= passMark });
  };

  return (
    <div className="bg-white rounded-2xl shadow p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Weekly Quiz  {subject.name}</h2>
          <p className="text-sm text-slate-600 mt-1">Answer each question and submit when ready.</p>
        </div>
        <div className="flex items-center gap-2">
          {attemptNumber > 1 && (
            <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-3 py-1 font-semibold">
              Retraining Attempt #{attemptNumber}
            </span>
          )}
          {attemptNumber === 1 && (
            <span className="text-xs bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full px-3 py-1 font-medium">
              Attempt #1
            </span>
          )}
          <button className="text-sm text-slate-500 hover:underline" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>

      {!completed && (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-medium text-slate-800">{currentQuestion.text}</p>
            <div className="space-y-2">
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-4 py-2 rounded-lg border text-sm transition-colors ${
                    selectedIndex === idx
                      ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={selectedIndex === null}
              onClick={handleNext}
              className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                selectedIndex === null
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {currentIndex + 1 === questions.length ? "Finish Quiz" : "Next "}
            </button>
          </div>
        </>
      )}

      {completed && (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            You scored <span className="font-semibold">{score} / {questions.length}</span> for{" "}
            <span className="font-semibold">{subject.name}</span>. Loading your feedback
          </p>
        </div>
      )}
    </div>
  );
};