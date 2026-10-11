import { READING_VITALS, VITAL_FIELDS } from "./vitalSigns";
import type { VitalReading } from "./vitalSigns";

export type FieldKind = "text" | "number" | "select" | "checkbox";

export interface FieldSpec {
  name: string;
  label: string;
  kind: FieldKind;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FieldSection {
  title: string;
  fields: FieldSpec[];
}

export const YES_NO = [
  { value: "", label: "Select…" },
  { value: "1", label: "Yes" },
  { value: "0", label: "No" },
];

// NOTE: "respiratory_distress" (double "s") is the literal feature name in
// the saved XGBoost artifact — keep that spelling.
export const SECTIONS: FieldSection[] = [
  {
    title: "Patient & Birth",
    fields: [
      { name: "patient_id", label: "Patient ID", kind: "text", placeholder: "NEO-2024-001" },
      {
        name: "sex",
        label: "Sex",
        kind: "select",
        options: [
          { value: "", label: "Select…" },
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
        ],
      },
      { name: "gestational_age_weeks", label: "Gestational age (weeks)", kind: "number" },
      { name: "birth_weight_g", label: "Birth weight (g)", kind: "number" },
      {
        name: "delivery_mode",
        label: "Delivery mode",
        kind: "select",
        options: [
          { value: "", label: "Select…" },
          { value: "vaginal", label: "Vaginal" },
          { value: "cesarean", label: "Cesarean" },
        ],
      },
      {
        name: "place_of_birth",
        label: "Place of birth",
        kind: "select",
        options: [
          { value: "", label: "Select…" },
          { value: "this_facility", label: "This facility" },
          { value: "other_facility", label: "Other facility" },
          { value: "home", label: "Home" },
          { value: "in_transit", label: "In transit" },
        ],
      },
      { name: "multiple_birth", label: "Multiple birth", kind: "checkbox" },
      { name: "age_at_onset_hours", label: "Age at onset (hours)", kind: "number" },
      { name: "apgar_1min", label: "APGAR 1 min", kind: "number" },
      { name: "apgar_5min", label: "APGAR 5 min", kind: "number" },
      { name: "resuscitation_at_birth", label: "Resuscitation at birth", kind: "checkbox" },
    ],
  },
  {
    title: "Maternal",
    fields: [
      { name: "maternal_age_years", label: "Maternal age (years)", kind: "number" },
      { name: "anc_4plus", label: "ANC 4+ visits", kind: "select", options: YES_NO },
      { name: "prom_over_18h", label: "PROM over 18h", kind: "select", options: YES_NO },
      { name: "maternal_fever", label: "Maternal fever", kind: "select", options: YES_NO },
      { name: "maternal_uti", label: "Maternal UTI", kind: "checkbox" },
      { name: "maternal_hiv", label: "Maternal HIV", kind: "checkbox" },
      { name: "unclean_cord_care", label: "Unclean cord care", kind: "checkbox" },
    ],
  },
  {
    title: "Neonatal Signs",
    fields: [
      { name: "poor_feeding", label: "Poor feeding", kind: "checkbox" },
      { name: "lethargy", label: "Lethargy", kind: "checkbox" },
      { name: "convulsions", label: "Convulsions", kind: "checkbox" },
      { name: "respiratory_distress", label: "Respiratory distress", kind: "checkbox" },
      { name: "jaundice", label: "Jaundice", kind: "checkbox" },
      { name: "bulging_fontanelle", label: "Bulging fontanelle", kind: "checkbox" },
      { name: "abdominal_distension", label: "Abdominal distension", kind: "checkbox" },
      { name: "umbilical_redness", label: "Umbilical redness", kind: "checkbox" },
      { name: "skin_pustules", label: "Skin pustules", kind: "checkbox" },
    ],
  },
  {
    title: "Laboratory",
    fields: [
      { name: "crp_mg_l", label: "CRP (mg/L)", kind: "number" },
      { name: "wbc_count", label: "WBC count", kind: "number" },
      { name: "platelet_count", label: "Platelet count", kind: "number" },
    ],
  },
  {
    title: "Vital Signs",
    fields: [...VITAL_FIELDS],
  },
  {
    title: "Treatment",
    fields: [
      { name: "central_venous_line", label: "Central venous line", kind: "select", options: YES_NO },
      { name: "inotrope", label: "Inotrope", kind: "select", options: YES_NO },
      { name: "intubate", label: "Intubated", kind: "select", options: YES_NO },
      { name: "duration_days", label: "Duration (days)", kind: "number" },
      { name: "oxygen_therapy", label: "Oxygen therapy", kind: "checkbox" },
    ],
  },
];

export const VITAL_SIGNS_SECTION_TITLE = "Vital Signs";

// Sections a user may edit after creation (excludes Vital Signs, which is
// temporal and captured via the Monitor tab / earlier-readings panel).
export const STATIC_SECTIONS: FieldSection[] = SECTIONS.filter(
  (section) => section.title !== VITAL_SIGNS_SECTION_TITLE,
);

export function initialValues(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const section of SECTIONS) {
    for (const field of section.fields) {
      values[field.name] = field.kind === "checkbox" ? "0" : "";
    }
  }
  return values;
}

// Map earlier readings onto the TFT temporal keys ({vital}_{hour}h). Backend
// PredictionIn allows extra keys, so these are safely ignored until wired.
export function buildReadingPayload(readings: VitalReading[]): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const reading of readings) {
    if (!reading.hour) continue;
    for (const vital of READING_VITALS) {
      const raw = reading[vital.key].trim();
      if (!raw) continue;
      if (vital.key === "blood_pressure") {
        const [systolic, diastolic] = raw.split("/");
        if (systolic?.trim()) payload[`systolic_bp_mmhg_${reading.hour}h`] = systolic.trim();
        if (diastolic?.trim()) payload[`diastolic_bp_mmhg_${reading.hour}h`] = diastolic.trim();
      } else {
        payload[`${vital.key}_${reading.hour}h`] = raw;
      }
    }
  }
  return payload;
}
