import type { TrainingRecord } from "./loadTrainingData";
import type { StudentInput } from "../types";

export function calculateWeaknessScore(
  quizScore: number,
  difficulty: number,
  confidence: number
): number {
  return (
    0.4 * (100 - quizScore) +
    0.3 * (difficulty * 20) +
    0.3 * ((5 - confidence) * 20)
  );
}

export function identifyWeakSubject(
  studentInput: StudentInput,
  trainingData: TrainingRecord[]
) {
  const subjectData = trainingData.filter(
    (d) => d.subject === studentInput.subject
  );

  if (subjectData.length === 0) return null;

  const avgQuizScore =
    subjectData.reduce((sum, d) => sum + d.quizScore, 0) /
    subjectData.length;

  const weaknessScore = calculateWeaknessScore(
    avgQuizScore,
    studentInput.difficulty,
    studentInput.confidence
  );

  return {
    subject: studentInput.subject,
    weaknessScore
  };
}
