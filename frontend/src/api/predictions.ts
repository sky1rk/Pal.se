import { apiFetch } from "./client";
import type {
  PatientRow,
  PredictionPayload,
  PredictionResult,
  ReportRow,
} from "../types/predictions";

export async function createPrediction(payload: PredictionPayload): Promise<PredictionResult> {
  return apiFetch<PredictionResult>("/api/predictions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listPredictions(limit = 20): Promise<PredictionResult[]> {
  const data = await apiFetch<{ predictions: PredictionResult[] }>(
    `/api/predictions?limit=${limit}`,
  );
  return data.predictions;
}

export async function listPatients(): Promise<PatientRow[]> {
  const data = await apiFetch<{ patients: PatientRow[] }>("/api/patients");
  return data.patients;
}

export async function listReports(): Promise<ReportRow[]> {
  const data = await apiFetch<{ reports: ReportRow[] }>("/api/reports");
  return data.reports;
}

// Cross-tab sync, same contract as legacy static/js/system-state.js:
// BroadcastChannel("palse-updates") with localStorage fallback.
const CHANNEL = "palse-updates";

export function notifyPredictionCreated(payload: unknown): void {
  const message = { type: "prediction-created", at: new Date().toISOString(), payload };
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // BroadcastChannel unavailable (older browsers) — localStorage only.
  }
  try {
    localStorage.setItem("palse:last-update", JSON.stringify(message));
  } catch {
    // Storage unavailable (private mode) — in-tab refresh already happened.
  }
}

export function onPredictionCreated(callback: () => void): () => void {
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      if ((event.data as { type?: string })?.type === "prediction-created") callback();
    };
  } catch {
    channel = null;
  }
  function handleStorage(event: StorageEvent): void {
    if (event.key !== "palse:last-update" || !event.newValue) return;
    try {
      if (JSON.parse(event.newValue).type === "prediction-created") callback();
    } catch {
      // Ignore malformed payloads from other tabs.
    }
  }
  window.addEventListener("storage", handleStorage);
  return () => {
    channel?.close();
    window.removeEventListener("storage", handleStorage);
  };
}
