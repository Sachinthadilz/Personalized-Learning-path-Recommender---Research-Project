// Shared types for the Adaptive Visualizer feature

export type AdaptiveView =
  | "diagnosis"
  | "weeklyPackage"
  | "retryPackage"
  | "quiz"
  | "feedback"
  | "dashboard"
  | "mastery";

export interface SubjectPerformance {
  id: string;
  name: string;
  difficulty: number;  // 1–5 (auto-derived from marks if marks provided)
  confidence: number;  // 1–5 (auto-derived from marks if marks provided)
  marks?: number;      // 0–100 actual assessment score
  grade?: string;      // A/B/C/D/E/F
  isWeak?: boolean;    // true when marks < 50 (or difficulty ≥ 3 / confidence ≤ 2)
}

export interface QuizResult {
  subjectId: string;
  score: number;
  total: number;
  band: "A" | "B" | "C" | "D";
  attemptNumber?: number;  // which attempt (1 = first try, 2+ = retraining)
  passed?: boolean;
}

export interface StudyResource {
  id: string;
  type: "mindmap" | "timetable" | "notes" | "game";
  title: string;
  description: string;
}
