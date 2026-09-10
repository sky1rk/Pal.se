import { apiClient } from "./client";
import type { Patient, PatientsEnvelope } from "../types/patient";

export async function getPatients(): Promise<Patient[]> {
  const envelope = await apiClient<PatientsEnvelope>("/patients");
  return envelope.patients;
}
