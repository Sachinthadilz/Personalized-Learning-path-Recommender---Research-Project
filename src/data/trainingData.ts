// src/data/trainingData.ts
import type { TrainingRecord } from "../types";
import { loadTrainingData } from "./loadTrainingData";

export const getTrainingData = async (): Promise<TrainingRecord[]> => {
  const data = await loadTrainingData();
  return data;
};
