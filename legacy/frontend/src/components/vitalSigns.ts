export interface VitalFieldSpec {
  name: string;
  label: string;
  kind: "text" | "number";
  placeholder?: string;
}

// Current/latest vitals — shared with the Dashboard form so the payload keys
// stay in one place.
export const VITAL_FIELDS: VitalFieldSpec[] = [
  { name: "temperature_c", label: "Temperature (°C)", kind: "number" },
  { name: "heart_rate_bpm", label: "Heart rate (bpm)", kind: "number" },
  { name: "blood_pressure", label: "Blood pressure (SBP/DBP)", kind: "text", placeholder: "70/42" },
  { name: "oxygen_saturation_pct", label: "Oxygen saturation (%)", kind: "number" },
  { name: "respiratory_rate_bpm", label: "Respiratory rate (/min)", kind: "number" },
];

// TFT temporal timepoints (hours since birth) — see backend ml/tft_inference.py.
export const VITAL_TIMEPOINTS = [0, 4, 8, 12, 16, 20] as const;

export const READING_VITALS = [
  { key: "temperature_c", label: "Temp (°C)", placeholder: "36.8" },
  { key: "heart_rate_bpm", label: "HR (bpm)", placeholder: "140" },
  { key: "blood_pressure", label: "BP (SBP/DBP)", placeholder: "70/42" },
  { key: "oxygen_saturation_pct", label: "SpO₂ (%)", placeholder: "97" },
  { key: "respiratory_rate_bpm", label: "RR (/min)", placeholder: "45" },
] as const;

export type ReadingVitalKey = (typeof READING_VITALS)[number]["key"];

export interface VitalReading {
  id: string;
  hour: string;
  temperature_c: string;
  heart_rate_bpm: string;
  blood_pressure: string;
  oxygen_saturation_pct: string;
  respiratory_rate_bpm: string;
}

export function createReading(hour: number): VitalReading {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `reading-${hour}-${Date.now()}`;
  return {
    id,
    hour: String(hour),
    temperature_c: "",
    heart_rate_bpm: "",
    blood_pressure: "",
    oxygen_saturation_pct: "",
    respiratory_rate_bpm: "",
  };
}

// Reconstruct temporal readings from a stored payload's {vital}_{hour}h keys.
// Only timepoints with at least one value are returned, ordered by hour.
export function readingsFromPayload(
  payload: Record<string, unknown> | null | undefined,
): VitalReading[] {
  if (!payload) return [];
  const readings: VitalReading[] = [];
  for (const hour of VITAL_TIMEPOINTS) {
    const get = (key: string): string => {
      const value = payload[`${key}_${hour}h`];
      return value === undefined || value === null ? "" : String(value).trim();
    };
    const systolic = get("systolic_bp_mmhg");
    const diastolic = get("diastolic_bp_mmhg");
    const blood_pressure =
      systolic && diastolic ? `${systolic}/${diastolic}` : systolic || diastolic;
    const reading = createReading(hour);
    reading.temperature_c = get("temperature_c");
    reading.heart_rate_bpm = get("heart_rate_bpm");
    reading.blood_pressure = blood_pressure;
    reading.oxygen_saturation_pct = get("oxygen_saturation_pct");
    reading.respiratory_rate_bpm = get("respiratory_rate_bpm");
    const hasAny = READING_VITALS.some((vital) => reading[vital.key] !== "");
    if (hasAny) readings.push(reading);
  }
  return readings.sort((a, b) => Number(a.hour) - Number(b.hour));
}
