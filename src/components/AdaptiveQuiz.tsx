// src/components/AdaptiveQuiz.tsx
import React, { useState } from "react";
import type { SubjectPerformance, QuizResult, QuizBand } from "../types";

interface Props {
  subject: SubjectPerformance | null;
  onCancel: () => void;
  onCompleted: (result: QuizResult) => void;
}

type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
};

// Build subject-specific questions
const buildQuestionsForSubject = (subjectName: string): Question[] => {
  const key = subjectName.toLowerCase().trim();

  if (key === "oop" || key === "oopp" || key === "object oriented programming") {
    return [
      {
        id: "oop-1",
        text: "Which OOP concept allows a subclass to provide a specific implementation of a method already defined in its superclass?",
        options: ["Encapsulation", "Abstraction", "Inheritance", "Polymorphism"],
        correctIndex: 3,
      },
      {
        id: "oop-2",
        text: "In OOP, grouping data and methods that operate on that data into a single unit is called:",
        options: ["Encapsulation", "Overloading", "Aggregation", "Association"],
        correctIndex: 0,
      },
      {
        id: "oop-3",
        text: "Which keyword in Java is used to create a subclass?",
        options: ["extends", "implements", "inherits", "super"],
        correctIndex: 0,
      },
    ];
  }

  if (key === "ip" || key === "internet programming") {
    return [
      {
        id: "ip-1",
        text: "Which protocol is mainly used to transfer web pages over the Internet?",
        options: ["FTP", "HTTP/HTTPS", "SMTP", "SSH"],
        correctIndex: 1,
      },
      {
        id: "ip-2",
        text: "Which HTML tag is used to create a hyperlink?",
        options: ["<link>", "<a>", "<href>", "<url>"],
        correctIndex: 1,
      },
      {
        id: "ip-3",
        text: "In client–server architecture, the browser acts as the:",
        options: ["Server", "Proxy", "Client", "Router"],
        correctIndex: 2,
      },
    ];
  }

  if (key === "se" || key === "software engineering") {
    return [
      {
        id: "se-1",
        text: "Which model is also known as the 'classic' software development model?",
        options: ["Spiral model", "V-model", "Waterfall model", "Incremental model"],
        correctIndex: 2,
      },
      {
        id: "se-2",
        text: "In requirement engineering, SRS stands for:",
        options: [
          "Software Requirement Specification",
          "System Requirement Statement",
          "Software Review Session",
          "System Review Specification",
        ],
        correctIndex: 0,
      },
      {
        id: "se-3",
        text: "Which of the following is NOT a functional requirement?",
        options: [
          "Login feature",
          "Report generation",
          "System shall respond within 2 seconds",
          "Password reset",
        ],
        correctIndex: 2,
      },
    ];
  }

  // Default generic quiz if no subject-specific bank
  return [
    {
      id: "gen-1",
      text: `Which of the following best describes the main goal of ${subjectName}?`,
      options: [
        "To confuse students",
        "To provide a structured way of thinking",
        "To remove the need for exams",
        "To replace all other subjects",
      ],
      correctIndex: 1,
    },
    {
      id: "gen-2",
      text: `When studying ${subjectName}, which strategy is usually MOST effective?`,
      options: [
        "Memorise everything the night before",
        "Do regular practice questions and review mistakes",
        "Ignore lectures and only read slides",
        "Rely only on friends' notes",
      ],
      correctIndex: 1,
    },
  ];
};

// Convert numeric score to band: "A" | "B" | "C" | "FAIL"
// 👉 A/B/C only when score >= passMark; otherwise FAIL
const computeBand = (score: number, passMark: number): QuizBand => {
  // Well above pass mark
  if (score >= passMark + 3) return "A";
  // Above pass mark
  if (score >= passMark + 1) return "B";
  // Just at pass mark
  if (score >= passMark) return "C";
  // Anything below pass mark
  return "FAIL";
};

export const AdaptiveQuiz: React.FC<Props> = ({
  subject,
  onCancel,
  onCompleted,
}) => {
  if (!subject) {
    return (
      <div className="bg-white rounded-2xl shadow p-8 w-full space-y-4">
        <p className="text-sm text-slate-700">
          No subject selected. Please go back and choose a weak subject first.
        </p>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={onCancel}
        >
          Back
        </button>
      </div>
    );
  }

  const questions = buildQuestionsForSubject(subject.name);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (selectedIndex === null) return;

    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    const newScore = score + (isCorrect ? 1 : 0);

    // more questions left
    if (currentIndex + 1 < questions.length) {
      setScore(newScore);
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      return;
    }

    // finished quiz
    const totalQuestions = questions.length;
    const passMark = Math.ceil(totalQuestions * 0.5); // 50% of questions
    const band = computeBand(newScore, passMark);

    const result: QuizResult = {
      subjectId: subject.id,
      subjectName: subject.name,
      score: newScore,
      passMark,
      band,
    };

    setScore(newScore);
    setCompleted(true);
    onCompleted(result);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-8 w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Weekly Quiz – {subject.name}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Answer the following questions related to{" "}
            <span className="font-semibold">{subject.name}</span>.
          </p>
        </div>
        <button
          className="text-sm text-slate-500 hover:underline"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      {!completed && (
        <>
          <div className="text-xs text-slate-500">
            Question {currentIndex + 1} of {questions.length}
          </div>

          <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-medium text-slate-800">
              {currentQuestion.text}
            </p>

            <div className="space-y-2">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={selectedIndex === null}
              onClick={handleNext}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                selectedIndex === null
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {currentIndex + 1 === questions.length ? "Finish Quiz" : "Next"}
            </button>
          </div>
        </>
      )}

      {completed && (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            You scored{" "}
            <span className="font-semibold">
              {score} / {questions.length}
            </span>{" "}
            for {subject.name}.
          </p>
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={onCancel}
          >
            Back to Study Package
          </button>
        </div>
      )}
    </div>
  );
};
