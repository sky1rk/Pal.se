import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  addVitalReading,
  getPatient,
  listPatients,
  listPredictions,
  notifyDataChanged,
  onDataChanged,
} from "../api/predictions";
import { ApiError } from "../api/client";
import type {
  PatientDetail,
  PatientRow,
  PredictionResult,
  VitalReadingInput,
} from "../types/predictions";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import RiskBadge from "../components/ui/RiskBadge";
import Spinner from "../components/ui/Spinner";
import { inputClass, labelClass } from "../components/ui/inputStyles";
import {
  ArrowRightIcon,
  CheckIcon,
  DropletIcon,
  HeartPulseIcon,
  InfoIcon,
  MonitorIcon,
  PlusIcon,
  ThermometerIcon,
  WindIcon,
} from "../components/ui/icons";
import {
  READING_VITALS,
  VITAL_TIMEPOINTS,
  createReading,
  readingsFromPayload,
} from "../components/vitalSigns";
import type { ReadingVitalKey, VitalReading } from "../components/vitalSigns";

interface TrendPoint {
  hour: number;
  value: number;
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0) return <span className="text-xs text-theme-gray">—</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  if (values.length === 1) {
    const y = 8;
    return (
      <svg viewBox="0 0 32 16" className="h-5 w-12" fill="none" aria-hidden="true">
        <circle cx="16" cy={y} r="2.4" fill={color} />
      </svg>
    );
  }
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 32},${15 - ((v - min) / range) * 13}`)
    .join(" ");
  return (
    <svg viewBox="0 0 32 16" className="h-5 w-12" fill="none" aria-hidden="true">
      <polyline
        points={points}
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendChart({
  title,
  unit,
  points,
  color,
}: {
  title: string;
  unit: string;
  points: TrendPoint[];
  color: string;
}) {
  const width = 560;
  const height = 180;
  const padX = 14;
  const padY = 18;

  if (points.length < 2) {
    return (
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-theme-ink-soft">{title}</h2>
        <p className="mt-6 mb-6 text-center text-sm text-theme-gray">
          Record at least two readings to see this trend.
        </p>
      </Card>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (width - padX * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = padX + i * step;
    const y = padY + (1 - (p.value - min) / range) * (height - padY * 2);
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `${padX},${height} ${line} ${width - padX},${height}`;
  const firstHour = points[0].hour;
  const lastHour = points[points.length - 1].hour;

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-theme-ink-soft">{title}</h2>
        <span className="text-xs text-theme-gray">Last: {points[points.length - 1].value} {unit}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 w-full"
        role="img"
        aria-label={`${title} trend`}
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={width}
            y1={height * fraction}
            y2={height * fraction}
            stroke="#e8e3dd"
            strokeWidth={1}
          />
        ))}
        <polygon points={area} fill={color} opacity={0.12} />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-theme-gray">
        <span>{firstHour}h</span>
        <span>{lastHour}h</span>
      </div>
    </Card>
  );
}

function PatientChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-gray">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-theme-ink-soft">{value}</p>
    </div>
  );
}

const METRIC_CONFIG = [
  {
    key: "heart_rate_bpm" as const,
    label: "Heart rate",
    unit: "bpm",
    Icon: HeartPulseIcon,
    tone: "text-risk-high-fg",
    bg: "bg-risk-high-bg",
    color: "#b42318",
  },
  {
    key: "temperature_c" as const,
    label: "Temperature",
    unit: "°C",
    Icon: ThermometerIcon,
    tone: "text-risk-moderate-fg",
    bg: "bg-risk-moderate-bg",
    color: "#d97706",
  },
  {
    key: "oxygen_saturation_pct" as const,
    label: "O2 saturation",
    unit: "%",
    Icon: DropletIcon,
    tone: "text-theme-maroon",
    bg: "bg-theme-maroon/10",
    color: "#5b1616",
  },
  {
    key: "respiratory_rate_bpm" as const,
    label: "Resp rate",
    unit: "/min",
    Icon: WindIcon,
    tone: "text-theme-maroon",
    bg: "bg-theme-maroon/10",
    color: "#5b1616",
  },
];

export default function Monitor() {
  const [params] = useSearchParams();
  const requested = params.get("patient");

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [detailState, setDetailState] = useState<PatientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<VitalReading>(() => createReading(VITAL_TIMEPOINTS[0]));
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [patientList, predictionList] = await Promise.all([
        listPatients(),
        listPredictions(50),
      ]);
      setPatients(patientList);
      setPredictions(predictionList);
      setError(null);
    } catch {
      setError("Could not load monitoring data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return onDataChanged(refresh);
  }, [refresh]);

  const patient =
    patients.find((row) => row.patient_id === requested) ?? patients[0] ?? null;
  const latest = patient
    ? predictions.find((prediction) => prediction.patient_id === patient.patient_id) ?? null
    : null;

  const selectedId = patient?.patient_id ?? null;
  const selectedUpdatedAt = patient?.updated_at ?? null;

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    getPatient(selectedId)
      .then((data) => {
        if (active) setDetailState(data);
      })
      .catch(() => {
        if (active) setDetailState(null);
      });
    return () => {
      active = false;
    };
  }, [selectedId, selectedUpdatedAt]);

  // Only trust detail that matches the currently selected patient.
  const detail = selectedId && detailState?.patient_id === selectedId ? detailState : null;
  const readings = useMemo(() => readingsFromPayload(detail?.payload), [detail]);

  function seriesFor(key: ReadingVitalKey): TrendPoint[] {
    return readings
      .map((reading) => ({ hour: Number(reading.hour), value: Number.parseFloat(reading[key]) }))
      .filter((point) => Number.isFinite(point.value))
      .sort((a, b) => a.hour - b.hour);
  }

  function updateDraft(field: ReadingVitalKey | "hour", value: string): void {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddReading(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!patient) return;
    const payload: VitalReadingInput = { hour: Number(draft.hour) };
    let hasValue = false;
    for (const vital of READING_VITALS) {
      const raw = draft[vital.key].trim();
      if (!raw) continue;
      payload[vital.key] = raw;
      hasValue = true;
    }
    if (!hasValue) {
      setAddError("Enter at least one vital sign value.");
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      const updated = await addVitalReading(patient.patient_id, payload);
      setDetailState(updated);
      setDraft(createReading(Number(draft.hour)));
      notifyDataChanged();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Could not save the reading.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vital Signs Monitor"
        description={patient ? `Monitoring ${patient.patient_id}` : "Continuous neonatal observation"}
        actions={
          <Link
            to="/patients"
            className="inline-flex items-center gap-2 rounded-lg border border-theme-line bg-theme-white px-4 py-2.5 text-sm font-semibold text-theme-ink-soft transition-colors hover:bg-theme-light-gray"
          >
            All patients
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <Card className="p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-theme-light-gray" />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded bg-theme-light-gray" />
            ))}
          </div>
        </Card>
      ) : !patient ? (
        <Card>
          <EmptyState
            icon={<MonitorIcon className="h-5 w-5" />}
            title="No patients to monitor"
            description="Register a patient by running a prediction from the dashboard."
            action={
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-theme-crimson px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-theme-crimson-hover"
              >
                Go to dashboard
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-theme-ink-soft">{patient.patient_id}</h2>
                  <RiskBadge label={patient.latest_risk_label} />
                </div>
                <p className="mt-1 text-sm text-theme-gray">
                  Latest assessment{" "}
                  {patient.updated_at ? new Date(patient.updated_at).toLocaleString() : "—"}
                </p>
              </div>
              <Link
                to={`/patients/${encodeURIComponent(patient.patient_id)}/edit`}
                className="inline-flex items-center gap-2 rounded-lg border border-theme-line bg-theme-white px-3.5 py-2 text-xs font-semibold text-theme-ink-soft transition-colors hover:bg-theme-light-gray"
              >
                Edit patient
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-theme-line pt-5 sm:grid-cols-4">
              <PatientChip label="Sex" value={patient.sex || "—"} />
              <PatientChip
                label="Gestational age"
                value={patient.gestational_age_weeks ? `${patient.gestational_age_weeks} wk` : "—"}
              />
              <PatientChip
                label="Birth weight"
                value={patient.birth_weight_g ? `${patient.birth_weight_g} g` : "—"}
              />
              <PatientChip label="Status" value={patient.status} />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {METRIC_CONFIG.map((metric) => {
              const points = seriesFor(metric.key);
              const latestValue = points.length ? points[points.length - 1].value : null;
              return (
                <Card key={metric.label} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${metric.bg} ${metric.tone}`}
                      >
                        <metric.Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-theme-gray">
                        {metric.label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight text-theme-ink-soft">
                        {latestValue === null ? "—" : latestValue}
                      </span>
                      <span className="text-sm font-medium text-theme-gray">{metric.unit}</span>
                    </div>
                    <Sparkline values={points.map((p) => p.value)} color={metric.color} />
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-theme-ink-soft">
              Record a reading
            </h2>
            <p className="mt-1 text-xs text-theme-gray">
              Add a vital-sign reading at a TFT timepoint. This does not change the risk score.
            </p>
            {addError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}
            <form
              onSubmit={handleAddReading}
              className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            >
              <label className="block">
                <span className={labelClass}>Timepoint</span>
                <select
                  value={draft.hour}
                  onChange={(e) => updateDraft("hour", e.target.value)}
                  className={inputClass}
                >
                  {VITAL_TIMEPOINTS.map((hour) => (
                    <option key={hour} value={String(hour)}>
                      {hour}h
                    </option>
                  ))}
                </select>
              </label>
              {READING_VITALS.map((vital) => (
                <label key={vital.key} className="block">
                  <span className={labelClass}>{vital.label}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={draft[vital.key]}
                    placeholder={vital.placeholder}
                    onChange={(e) => updateDraft(vital.key, e.target.value)}
                    className={inputClass}
                  />
                </label>
              ))}
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={isAdding}
                  className="w-full"
                  icon={isAdding ? <Spinner /> : <PlusIcon className="h-4 w-4" />}
                >
                  {isAdding ? "Saving…" : "Add reading"}
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="px-6 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-theme-ink-soft">
                Recorded readings
              </h2>
            </div>
            {readings.length === 0 ? (
              <EmptyState
                icon={<MonitorIcon className="h-5 w-5" />}
                title="No readings recorded"
                description="Use the form above to add the first vital-sign reading."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-y border-theme-line text-[11px] uppercase tracking-wide text-theme-gray">
                      <th className="px-6 py-3 font-semibold">Timepoint</th>
                      <th className="px-6 py-3 font-semibold">Temp (°C)</th>
                      <th className="px-6 py-3 font-semibold">HR (bpm)</th>
                      <th className="px-6 py-3 font-semibold">BP</th>
                      <th className="px-6 py-3 font-semibold">SpO₂ (%)</th>
                      <th className="px-6 py-3 font-semibold">RR (/min)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-line">
                    {readings.map((reading) => (
                      <tr key={reading.id} className="transition-colors hover:bg-theme-light-gray/60">
                        <td className="px-6 py-3 font-semibold text-theme-ink-soft">
                          {reading.hour}h
                        </td>
                        <td className="px-6 py-3 text-theme-gray">
                          {reading.temperature_c || "—"}
                        </td>
                        <td className="px-6 py-3 text-theme-gray">
                          {reading.heart_rate_bpm || "—"}
                        </td>
                        <td className="px-6 py-3 text-theme-gray">
                          {reading.blood_pressure || "—"}
                        </td>
                        <td className="px-6 py-3 text-theme-gray">
                          {reading.oxygen_saturation_pct || "—"}
                        </td>
                        <td className="px-6 py-3 text-theme-gray">
                          {reading.respiratory_rate_bpm || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TrendChart
              title="Heart Rate"
              unit="bpm"
              points={seriesFor("heart_rate_bpm")}
              color="#b42318"
            />
            <TrendChart
              title="Temperature"
              unit="°C"
              points={seriesFor("temperature_c")}
              color="#d97706"
            />
            <TrendChart
              title="Oxygen Saturation"
              unit="%"
              points={seriesFor("oxygen_saturation_pct")}
              color="#5b1616"
            />
            <TrendChart
              title="Respiratory Rate"
              unit="/min"
              points={seriesFor("respiratory_rate_bpm")}
              color="#5b1616"
            />
          </div>

          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-theme-ink-soft">
              Latest assessment
            </h2>
            {latest ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <RiskBadge label={latest.risk_label} />
                  <span className="text-2xl font-extrabold tracking-tight text-theme-ink-soft">
                    {latest.probability_percent.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium text-theme-gray">{latest.result_title}</span>
                </div>
                <p className="text-sm text-theme-gray">{latest.interpretation}</p>
                {latest.recommended_actions.length > 0 && (
                  <ul className="space-y-2">
                    {latest.recommended_actions.map((action) => (
                      <li key={action} className="flex items-start gap-2.5 text-sm text-theme-ink-soft">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-theme-maroon/10 text-theme-maroon">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-theme-gray">
                No prediction recorded for this patient yet.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
