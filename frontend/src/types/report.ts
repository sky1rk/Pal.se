export interface Report {
  id: number;
  prediction_id: number;
  patient_id: string;
  title: string;
  summary: string;
  risk_label: string;
  probability: number;
  probability_percent?: number;
  created_at: string;
}

export interface ReportsEnvelope {
  reports: Report[];
}
