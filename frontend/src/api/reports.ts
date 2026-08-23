import { apiClient } from "./client";
import type { Report, ReportsEnvelope } from "../types/report";

export async function getReports(): Promise<Report[]> {
  const envelope = await apiClient<ReportsEnvelope>("/reports");
  return envelope.reports;
}
