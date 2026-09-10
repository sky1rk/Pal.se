import { apiClient } from "./client";
import type {
  Prediction,
  PredictionHistoryItem,
  PredictionRequest,
  PredictionsEnvelope,
} from "../types/prediction";

export async function getPredictions(): Promise<PredictionHistoryItem[]> {
  const envelope = await apiClient<PredictionsEnvelope>("/predictions");
  return envelope.predictions;
}

export async function createPrediction(
  payload: PredictionRequest,
): Promise<Prediction> {
  return apiClient<Prediction>("/predictions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
