// src/types.ts

export type View =
  | "login"
  | "subjectForm"
  | "diagnosis"
  | "package"
  | "weeklyPackage" 
  | "quiz"
  | "feedback"
  | "dashboard";

export interface SubjectPerformance {
  id: string;
  name: string;
  difficulty: number;
  confidence: number;
  isWeak?: boolean;
}

export interface QuizResult {
  subjectId: string;
  score: number;
  total: number;
  band: "A" | "B" | "C" | "D";
}

export interface StudyResource {
  id: string;
  type: "mindmap" | "timetable" | "notes" | "game";
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
  band: string;
}
