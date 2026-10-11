import { apiFetch } from "./client";
import type {
  PatientDetail,
  PatientRow,
  PatientUpdateInput,
  PredictionPayload,
  PredictionResult,
  ReportRow,
  VitalReadingInput,
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

export async function listPatients(includeArchived = false): Promise<PatientRow[]> {
  const query = includeArchived ? "?include_archived=true" : "";
  const data = await apiFetch<{ patients: PatientRow[] }>(`/api/patients${query}`);
  return data.patients;
}

export async function getPatient(patientId: string): Promise<PatientDetail> {
  return apiFetch<PatientDetail>(`/api/patients/${encodeURIComponent(patientId)}`);
}

export async function updatePatient(
  patientId: string,
  updates: PatientUpdateInput,
): Promise<PredictionResult> {
  return apiFetch<PredictionResult>(`/api/patients/${encodeURIComponent(patientId)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function addVitalReading(
  patientId: string,
  reading: VitalReadingInput,
): Promise<PatientDetail> {
  return apiFetch<PatientDetail>(`/api/patients/${encodeURIComponent(patientId)}/readings`, {
    method: "POST",
    body: JSON.stringify(reading),
  });
}

export async function archivePatient(patientId: string): Promise<PatientDetail> {
  return apiFetch<PatientDetail>(`/api/patients/${encodeURIComponent(patientId)}/archive`, {
    method: "POST",
  });
}

export async function restorePatient(patientId: string): Promise<PatientDetail> {
  return apiFetch<PatientDetail>(`/api/patients/${encodeURIComponent(patientId)}/restore`, {
    method: "POST",
  });
}

export async function listReports(): Promise<ReportRow[]> {
  const data = await apiFetch<{ reports: ReportRow[] }>("/api/reports");
  return data.reports;
}

// Cross-tab sync, same contract as legacy static/js/system-state.js:
// BroadcastChannel("palse-updates") with localStorage fallback. A generic
// "data-changed" message keeps patients, reports and the dashboard in sync
// after predictions, edits, readings and (un)archiving.
const CHANNEL = "palse-updates";
const MESSAGE_TYPE = "data-changed";

export function notifyDataChanged(payload?: unknown): void {
  const message = { type: MESSAGE_TYPE, at: new Date().toISOString(), payload };
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

export function onDataChanged(callback: () => void): () => void {
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      if ((event.data as { type?: string })?.type === MESSAGE_TYPE) callback();
    };
  } catch {
    channel = null;
  }
  function handleStorage(event: StorageEvent): void {
    if (event.key !== "palse:last-update" || !event.newValue) return;
    try {
      if (JSON.parse(event.newValue).type === MESSAGE_TYPE) callback();
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
