import trainingData from "./trainingData";

export interface TrainingRecord {
  studentId: string;
  subject: string;
  difficulty: number;
  confidence: number;
  quizScore: number;
  passMark: number;
  band: string;
}

export function getTrainingData(): TrainingRecord[] {
  return trainingData as TrainingRecord[];
}
