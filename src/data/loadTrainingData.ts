import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import type { TrainingRecord } from "../types";

export const loadTrainingData = async (): Promise<TrainingRecord[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<TrainingRecord>("/final_training_dataset_mapped.csv", {
      download: true,
      header: true,
      complete: (result: ParseResult<TrainingRecord>) => {
        resolve(result.data);
      },
      error: (err: any) => {
        reject(err);
      },
    });
  });
};
