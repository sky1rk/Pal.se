export type PredictionPayload = Record<string, string | number>;

export interface PredictionPatient {
  patient_id: string;
  sex: string | null;
  gestational_age_weeks: number | null;
  birth_weight_g: number | null;
  age_at_onset_hours: number | null;
  status: string;
  latest_risk_label: string | null;
  latest_probability: number | null;
  latest_probability_percent: number | null;
  latest_prediction_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PredictionReport {
  id: number;
  prediction_id: number;
  patient_id: string;
  title: string;
  summary: string;
  risk_label: string;
  probability: number;
  probability_percent: number;
  created_at: string | null;
}

export interface PredictionResult {
  id: number;
  patient_id: string;
  probability: number;
  probability_percent: number;
  risk_label: string;
  result_title: string;
  predicted_eos: boolean;
  threshold: number;
  xgb_eos_probability: number;
  tft_eos_probability: number;
  tft_source: string;
  interpretation: string;
  recommended_actions: string[];
  created_at: string | null;
  patient?: PredictionPatient | null;
  report?: PredictionReport | null;
}

export interface PatientRow {
  patient_id: string;
  sex: string | null;
  gestational_age_weeks: number | null;
  birth_weight_g: number | null;
  age_at_onset_hours: number | null;
  status: string;
  latest_risk_label: string | null;
  latest_probability: number | null;
  latest_probability_percent: number | null;
  latest_prediction_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReportRow {
  id: number;
  prediction_id: number;
  patient_id: string;
  title: string;
  summary: string;
  risk_label: string;
  probability: number;
  probability_percent: number;
  created_at: string | null;
}
