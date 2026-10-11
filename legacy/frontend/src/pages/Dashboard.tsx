import { useCallback, useEffect, useState } from "react";
import {
  createPrediction,
  listPredictions,
  notifyDataChanged,
  onDataChanged,
} from "../api/predictions";
import { ApiError } from "../api/client";
import type { PredictionResult } from "../types/predictions";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import RiskBadge from "../components/ui/RiskBadge";
import Spinner from "../components/ui/Spinner";
import PredictionResultCard from "../components/PredictionResultCard";
import SectionGrid from "../components/SectionGrid";
import VitalSignsPanel from "../components/VitalSignsPanel";
import { buildReadingPayload, initialValues, SECTIONS } from "../components/patientForm";
import { VITAL_SIGNS_SECTION_TITLE } from "../components/patientForm";
import { createReading, VITAL_TIMEPOINTS } from "../components/vitalSigns";
import type { ReadingVitalKey, VitalReading } from "../components/vitalSigns";
import { AlertTriangleIcon, ArrowRightIcon, InboxIcon } from "../components/ui/icons";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function Dashboard() {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [readings, setReadings] = useState<VitalReading[]>([]);
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
    return onDataChanged(refreshHistory);
  }, [refreshHistory]);

  function setField(name: string, value: string): void {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function addReading(): void {
    const used = new Set(readings.map((reading) => reading.hour));
    const next = VITAL_TIMEPOINTS.find((hour) => !used.has(String(hour)));
    if (next === undefined) return;
    setReadings((prev) => [...prev, createReading(next)]);
  }

  function removeReading(id: string): void {
    setReadings((prev) => prev.filter((reading) => reading.id !== id));
  }

  function updateReading(id: string, field: ReadingVitalKey | "hour", value: string): void {
    setReadings((prev) =>
      prev.map((reading) => (reading.id === id ? { ...reading, [field]: value } : reading)),
    );
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const prediction = await createPrediction({ ...values, ...buildReadingPayload(readings) });
      setResult(prediction);
      notifyDataChanged(prediction);
      await refreshHistory();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Prediction failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Enter clinical details and calculate the EOS risk score."
      />

      {result && <PredictionResultCard result={result} />}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {SECTIONS.map((section, index) => (
          <Card key={section.title} className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-maroon/10 text-xs font-bold text-theme-maroon">
                {index + 1}
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wide text-theme-ink-soft">
                {section.title}
              </h2>
            </div>
            {section.title === VITAL_SIGNS_SECTION_TITLE ? (
              <VitalSignsPanel
                values={values}
                setField={setField}
                readings={readings}
                onAddReading={addReading}
                onRemoveReading={removeReading}
                onUpdateReading={updateReading}
              />
            ) : (
              <SectionGrid section={section} values={values} setField={setField} />
            )}
          </Card>
        ))}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
            icon={isSubmitting ? <Spinner /> : <ArrowRightIcon className="h-4 w-4" />}
          >
            {isSubmitting ? "Generating…" : "Calculate risk score"}
          </Button>
        </div>
      </form>

      <Card>
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-theme-ink-soft">
            Prediction history
          </h2>
        </div>
        {history.length === 0 ? (
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" />}
            title="No predictions yet"
            description="Completed risk assessments will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-y border-theme-line text-[11px] uppercase tracking-wide text-theme-gray">
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Patient</th>
                  <th className="px-6 py-3 font-semibold">Risk level</th>
                  <th className="px-6 py-3 text-right font-semibold">Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-line">
                {history.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-theme-light-gray/60">
                    <td className="px-6 py-3 text-theme-gray">{formatDate(row.created_at)}</td>
                    <td className="px-6 py-3 font-medium text-theme-ink-soft">{row.patient_id}</td>
                    <td className="px-6 py-3">
                      <RiskBadge label={row.risk_label} short />
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-theme-ink-soft">
                      {row.probability_percent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
