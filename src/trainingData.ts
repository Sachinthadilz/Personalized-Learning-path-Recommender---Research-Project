import type { TrainingRecord } from "./types";

export const getTrainingData = async (): Promise<TrainingRecord[]> => {
  const response = await fetch("/final_training_dataset_mapped.csv");
  const text = await response.text();

  const lines = text.trim().split("\n");

  return lines.slice(1).map((line) => {
    const values = line.split(",");

    return {
      studentId: values[0],
      subject: values[1],
      difficulty: Number(values[2]),
      confidence: Number(values[3]),
      quizScore: Number(values[4]),
      passMark: Number(values[5]),
      band: values[6],
    };
  });
};
