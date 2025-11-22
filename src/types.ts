// src/types.ts

export type View =
  | "login"
  | "subjectInfo"
  | "subjectForm"
  | "diagnosis"
  | "package"
  | "quiz"
  | "feedback"
  | "dashboard";

export interface SubjectPerformance {
  id: string;
  name: string;
  difficulty: number;
  confidence: number;
  comments?: string;
  isWeak?: boolean;
}

// ✨ NEW: separate type for quiz band
export type QuizBand = "A" | "B" | "C" | "FAIL";

export interface QuizResult {
  subjectId: string;
  subjectName: string;
  score: number;
  passMark: number;
  band: QuizBand;   // use QuizBand type
}

export interface StudyResource {
  id: string;
  type: "mindmap" | "notes" | "timetable" | "game";
  title: string;
  description: string;
}

export interface TrainingRecord {
  studentId: string;
  subject: string;
  difficulty: number;
  confidence: number;
  quizScore: number;
  passMark: number;
  band: "Critical Zone" | "Improvement Zone" | "Good Zone" | "Mastered Zone";
}