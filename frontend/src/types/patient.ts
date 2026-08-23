// patient record
// POST /api/predictions -> response contains every column of the patients table
// GET /api/patients -> list adds latest_probability_percent
export interface Patient {
  patient_id: string;
  sex?: string | null;
  gestational_age_weeks?: number | null;
  birth_weight_g?: number | null;
  age_at_onset_hours?: number | null;
  status?: string | null;
  latest_risk_label?: string | null;
  latest_probability?: number | null;
  latest_probability_percent?: number;
  latest_prediction_id?: number | null;
  payload_json?: string; // serialized original req payload (only in full records)
  created_at?: string;
  updated_at?: string;
}

export interface PatientsEnvelope {
  patients: Patient[];
}
