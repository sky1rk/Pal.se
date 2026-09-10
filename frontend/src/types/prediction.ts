import type { Patient } from "./patient";
import type { Report } from "./report";

// union types
export type BinaryFlag = 0 | 1 | boolean;
export type Sex = "male" | "female";
export type DeliveryMode =
  | "vaginal"
  | "spontaneous_vaginal"
  | "assisted_vaginal"
  | "cesarean"
  | "caesarean"
  | "caesarean_section";
export type PlaceOfBirth =
  "home" | "in_transit" | "other_facility" | "this_facility";
export type RiskLabel = "HIGH RISK" | "MODERATE RISK" | "LOW RISK";
export type TftSource = "live_tft" | "temporal_vitals_fallback";

// dashboard json contract
export interface PredictionRequest {
  patient_id?: string;
  sex?: Sex;
  gestational_age_weeks?: number;
  birth_weight_g?: number;
  delivery_mode?: DeliveryMode;
  place_of_birth?: PlaceOfBirth;
  maternal_age_years?: number;
  apgar_1min?: number;
  apgar_5min?: number;
  resuscitation_at_birth?: BinaryFlag;
  prom_over_18h?: BinaryFlag;
  maternal_fever?: BinaryFlag;
  maternal_uti?: BinaryFlag;
  unclean_cord_care?: BinaryFlag;
  maternal_hiv?: BinaryFlag;
  multiple_birth?: BinaryFlag;
  anc_4plus?: BinaryFlag;
  age_at_onset_hours?: number;
  temperature_c?: number;
  poor_feeding?: BinaryFlag;
  lethargy?: BinaryFlag;
  respiratory_distress?: BinaryFlag;
  convulsions?: BinaryFlag;
  abdominal_distension?: BinaryFlag;
  jaundice?: BinaryFlag;
  umbilical_redness?: BinaryFlag;
  skin_pustules?: BinaryFlag;
  bulging_fontanelle?: BinaryFlag;
  crp_mg_l?: number;
  wbc_count?: number;
  platelet_count?: number;
  heart_rate_bpm?: number;
  oxygen_saturation_pct?: number;
  respiratory_rate_bpm?: number;
  /** Free-form string accepted by the backend, e.g. "70/42". */
  blood_pressure?: string;
  central_venous_line?: BinaryFlag;
  inotrope?: BinaryFlag;
  intubate?: BinaryFlag;
  duration_days?: number;
  oxygen_therapy?: BinaryFlag;
}

// shape returned by GET /api/predictions
export interface PredictionHistoryItem {
  id: number;
  patient_id: string;
  probability: number;
  probability_percent: number;
  risk_label: RiskLabel;
  result_title: string;
  predicted_eos: boolean;
  threshold: number;
  xgb_eos_probability: number;
  tft_eos_probability: number;
  tft_source: TftSource;
  interpretation: string;
  recommended_actions: string[];
  payload_json: string;
  created_at: string;
}

// envelope returned by GET /api/predictions
export interface PredictionsEnvelope {
  predictions: PredictionHistoryItem[];
}

// full shape returned by POST /api/predictions
export interface Prediction {
  id: number;
  patient_id: string;
  probability: number;
  probability_percent: number;
  risk_label: RiskLabel;
  result_title: string;
  predicted_eos: boolean;
  threshold: number;
  xgb_eos_probability: number;
  tft_eos_probability: number;
  tft_source: TftSource;
  interpretation: string;
  recommended_actions: string[];
  created_at: string;
  patient: Patient;
  report: Report;
}
