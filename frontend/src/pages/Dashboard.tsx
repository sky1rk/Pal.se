import { useCallback, useEffect, useState } from "react";
import {
  createPrediction,
  listPredictions,
  notifyPredictionCreated,
  onPredictionCreated,
} from "../api/predictions";
import { ApiError } from "../api/client";
import type { PredictionResult } from "../types/predictions";

type FieldKind = "text" | "number" | "select" | "checkbox";

interface FieldSpec {
  name: string;
  label: string;
  kind: FieldKind;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface FieldSection {
  title: string;
  fields: FieldSpec[];
}

const YES_NO = [
  { value: "", label: "Select…" },
  { value: "1", label: "Yes" },
  { value: "0", label: "No" },
];

// NOTE: "respiratory_distress" (double "s") is the literal feature name in
// the saved XGBoost artifact — keep that spelling.
const SECTIONS: FieldSection[] = [
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
    fields: [
      { name: "temperature_c", label: "Temperature (°C)", kind: "number" },
      { name: "heart_rate_bpm", label: "Heart rate (bpm)", kind: "number" },
      {
        name: "blood_pressure",
        label: "Blood pressure (SBP/DBP)",
        kind: "text",
        placeholder: "70/42",
      },
      { name: "oxygen_saturation_pct", label: "Oxygen saturation (%)", kind: "number" },
      { name: "respiratory_rate_bpm", label: "Respiratory rate (/min)", kind: "number" },
    ],
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

function initialValues(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const section of SECTIONS) {
    for (const field of section.fields) {
      values[field.name] = field.kind === "checkbox" ? "0" : "";
    }
  }
  return values;
}

function riskStyle(riskLabel: string): string {
  if (riskLabel === "HIGH RISK") return "bg-red-100 text-red-800";
  if (riskLabel === "MODERATE RISK") return "bg-amber-100 text-amber-800";
  return "bg-green-100 text-green-800";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-theme-maroon focus:outline-none";

export default function Dashboard() {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await listPredictions(6));
    } catch {
      // History is secondary; the form stays usable when it fails.
    }
  }, []);

  useEffect(() => {
    refreshHistory();
    return onPredictionCreated(refreshHistory);
  }, [refreshHistory]);

  function setField(name: string, value: string): void {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const prediction = await createPrediction({ ...values });
      setResult(prediction);
      notifyPredictionCreated(prediction);
      await refreshHistory();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Prediction failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-theme-gray">
          Enter clinical details and calculate the EOS risk score.
        </p>
      </div>

      {result && (
        <section className="rounded-lg bg-theme-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${riskStyle(result.risk_label)}`}
            >
              {result.risk_label}
            </span>
            <span className="text-3xl font-bold">{result.probability_percent.toFixed(1)}%</span>
            <span className="text-sm font-medium">{result.result_title}</span>
          </div>
          <p className="mt-3 text-sm">{result.interpretation}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-theme-gray">
            {result.recommended_actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-theme-gray">
            XGBoost {(result.xgb_eos_probability * 100).toFixed(1)}% · TFT{" "}
            {(result.tft_eos_probability * 100).toFixed(1)}% ({result.tft_source}) · Threshold{" "}
            {(result.threshold * 100).toFixed(1)}%
          </p>
        </section>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-lg bg-theme-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">{section.title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.fields.map((field) => (
                <label key={field.name} className="block text-sm">
                  <span className="mb-1 block font-medium">{field.label}</span>
                  {field.kind === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={values[field.name] === "1"}
                      onChange={(e) => setField(field.name, e.target.checked ? "1" : "0")}
                      className="h-5 w-5 accent-[#5b1616]"
                    />
                  ) : field.kind === "select" ? (
                    <select
                      value={values[field.name]}
                      onChange={(e) => setField(field.name, e.target.value)}
                      className={inputClass}
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.kind}
                      value={values[field.name]}
                      placeholder={field.placeholder}
                      onChange={(e) => setField(field.name, e.target.value)}
                      className={inputClass}
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-theme-maroon px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "GENERATING…" : "CALCULATE RISK SCORE"}
        </button>
      </form>

      <section className="rounded-lg bg-theme-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">Prediction history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-theme-gray">No predictions yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-theme-gray">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Patient</th>
                <th className="py-2">Level</th>
                <th className="py-2">Prob</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="py-2">{formatDate(row.created_at)}</td>
                  <td className="py-2 font-medium">{row.patient_id}</td>
                  <td className="py-2">{row.risk_label.replace(" RISK", "")}</td>
                  <td className="py-2">{row.probability_percent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
