import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { getPatient, notifyDataChanged, updatePatient } from "../api/predictions";
import { ApiError } from "../api/client";
import type { PatientDetail, PredictionResult } from "../types/predictions";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import PredictionResultCard from "../components/PredictionResultCard";
import RiskBadge from "../components/ui/RiskBadge";
import SectionGrid from "../components/SectionGrid";
import Spinner from "../components/ui/Spinner";
import { STATIC_SECTIONS, initialValues } from "../components/patientForm";
import type { FieldKind } from "../components/patientForm";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckIcon,
  HeartPulseIcon,
  InboxIcon,
} from "../components/ui/icons";

// Patient ID is immutable; drop it from the editable form.
const EDIT_SECTIONS = STATIC_SECTIONS.map((section) => ({
  ...section,
  fields: section.fields.filter((field) => field.name !== "patient_id"),
}));

function fieldString(value: unknown, kind: FieldKind): string {
  if (value === undefined || value === null) return kind === "checkbox" ? "0" : "";
  if (typeof value === "boolean") return value ? "1" : "0";
  const text = String(value);
  if (kind === "checkbox") {
    const normalized = text.trim().toLowerCase();
    if (normalized === "1" || normalized === "true") return "1";
    if (normalized === "0" || normalized === "false" || normalized === "") return "0";
    return text;
  }
  return text;
}

export default function PatientEdit() {
  const { patientId = "" } = useParams<{ patientId: string }>();

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setNotFound(false);
      setLoadError(null);
      try {
        const detail = await getPatient(patientId);
        if (!active) return;
        setPatient(detail);
        const next = initialValues();
        const payload = detail.payload ?? {};
        for (const section of EDIT_SECTIONS) {
          for (const field of section.fields) {
            if (Object.prototype.hasOwnProperty.call(payload, field.name)) {
              next[field.name] = fieldString(payload[field.name], field.kind);
            }
          }
        }
        setValues(next);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setLoadError("Could not load this patient.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [patientId]);

  const updates = useMemo(() => {
    const next: Record<string, string> = {};
    for (const section of EDIT_SECTIONS) {
      for (const field of section.fields) {
        next[field.name] = values[field.name] ?? "";
      }
    }
    return next;
  }, [values]);

  function setField(name: string, value: string): void {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleConfirmSave(): Promise<void> {
    setIsSaving(true);
    setSaveError(null);
    try {
      const prediction = await updatePatient(patientId, updates);
      setResult(prediction);
      setConfirmOpen(false);
      notifyDataChanged(prediction);
      setPatient((prev) =>
        prev
          ? {
              ...prev,
              latest_risk_label: prediction.risk_label,
              latest_probability: prediction.probability,
              latest_probability_percent: prediction.probability_percent,
              latest_prediction_id: prediction.id,
            }
          : prev,
      );
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Could not save changes. Please try again.",
      );
      setConfirmOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit patient" description="Loading clinical record…" />
        <Card className="p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-theme-light-gray" />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-11 animate-pulse rounded bg-theme-light-gray" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit patient" />
        <Card>
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" />}
            title="Patient not found"
            description="This patient may have been removed or belongs to another account."
            action={
              <Link
                to="/patients"
                className="inline-flex items-center gap-2 rounded-lg border border-theme-line bg-theme-white px-4 py-2.5 text-sm font-semibold text-theme-ink-soft transition-colors hover:bg-theme-light-gray"
              >
                Back to patients
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit patient" />
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 rounded-lg border border-theme-line bg-theme-white px-4 py-2.5 text-sm font-semibold text-theme-ink-soft transition-colors hover:bg-theme-light-gray"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit patient"
        description="Correct static clinical variables. Saving recomputes the EOS risk score."
        actions={
          <Link
            to="/patients"
            className="inline-flex items-center gap-2 rounded-lg border border-theme-line bg-theme-white px-4 py-2.5 text-sm font-semibold text-theme-ink-soft transition-colors hover:bg-theme-light-gray"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to patients
          </Link>
        }
      />

      {patient && (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-theme-ink-soft">{patientId}</h2>
              <RiskBadge label={patient.latest_risk_label} />
            </div>
            <p className="mt-1 text-sm text-theme-gray">
              Patient ID is permanent. Vital signs are recorded in the Monitor tab.
            </p>
          </div>
          {patient.updated_at && (
            <p className="text-xs text-theme-gray">
              Last updated {new Date(patient.updated_at).toLocaleString()}
            </p>
          )}
        </Card>
      )}

      {saveError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-theme-white px-4 py-3 text-xs text-theme-gray">
        <HeartPulseIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Vital signs are temporal and edited from the{" "}
          <Link
            to={`/monitor?patient=${encodeURIComponent(patientId)}`}
            className="font-semibold text-theme-crimson hover:text-theme-crimson-hover"
          >
            Monitor
          </Link>{" "}
          tab.
        </span>
      </div>

      {result && <PredictionResultCard result={result} />}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSaveError(null);
          setConfirmOpen(true);
        }}
        className="space-y-6"
      >
        {EDIT_SECTIONS.map((section, index) => (
          <Card key={section.title} className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-maroon/10 text-xs font-bold text-theme-maroon">
                {index + 1}
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wide text-theme-ink-soft">
                {section.title}
              </h2>
            </div>
            <SectionGrid section={section} values={values} setField={setField} />
          </Card>
        ))}

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link
            to="/patients"
            className="inline-flex items-center justify-center rounded-lg border border-theme-line bg-theme-white px-4 py-2.5 text-sm font-semibold text-theme-ink-soft transition-colors hover:bg-theme-light-gray"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto"
            icon={isSaving ? <Spinner /> : <CheckIcon className="h-4 w-4" />}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Save changes and recompute risk?"
        description="The updated variables will be saved and a new EOS risk assessment will be generated for this patient."
        confirmLabel="Save & recompute"
        busy={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
