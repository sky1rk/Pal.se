import { useRef, useState } from "react";
import type { DragEvent } from "react";
import Button from "./ui/Button";
import { inputClass, labelClass } from "./ui/inputStyles";
import {
  CheckIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "./ui/icons";
import { READING_VITALS, VITAL_FIELDS, VITAL_TIMEPOINTS } from "./vitalSigns";
import type { ReadingVitalKey, VitalReading } from "./vitalSigns";

interface VitalSignsPanelProps {
  values: Record<string, string>;
  setField: (name: string, value: string) => void;
  readings: VitalReading[];
  onAddReading: () => void;
  onRemoveReading: (id: string) => void;
  onUpdateReading: (
    id: string,
    field: ReadingVitalKey | "hour",
    value: string,
  ) => void;
}

type Mode = "manual" | "csv";

export default function VitalSignsPanel({
  values,
  setField,
  readings,
  onAddReading,
  onRemoveReading,
  onUpdateReading,
}: VitalSignsPanelProps) {
  const [mode, setMode] = useState<Mode>("manual");
  const [csvName, setCsvName] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hourCounts = readings.reduce<Record<string, number>>((acc, reading) => {
    if (reading.hour) acc[reading.hour] = (acc[reading.hour] ?? 0) + 1;
    return acc;
  }, {});

  function handleFiles(file: File | null): void {
    if (!file) return;
    // Mock only: no parsing happens. Row count is a rough placeholder.
    setCsvName(file.name);
    setCsvRows(Math.max(1, Math.round(file.size / 48)));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files?.[0] ?? null);
  }

  function clearCsv(): void {
    setCsvName(null);
    setCsvRows(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Vital sign entry mode"
        className="inline-flex rounded-lg border border-theme-line bg-theme-light-gray/60 p-0.5"
      >
        {(
          [
            { value: "manual", label: "Manual entry" },
            { value: "csv", label: "Upload CSV" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
            onClick={() => setMode(tab.value)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors ${mode === tab.value
              ? "bg-white text-theme-ink-soft shadow-sm"
              : "text-theme-gray hover:text-theme-ink-soft"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "manual" ? (
        <>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-theme-maroon" />
              <p className="text-sm font-semibold text-theme-ink-soft">
                Latest reading
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {VITAL_FIELDS.map((field) => (
                <label key={field.name} className="block">
                  <span className={labelClass}>{field.label}</span>
                  <input
                    type={field.kind}
                    value={values[field.name] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      setField(field.name, event.target.value)
                    }
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-theme-line bg-theme-light-gray/40 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-theme-ink-soft">
                  Earlier readings
                </p>
                <p className="text-xs text-theme-gray">
                  Add vitals measured at earlier timepoints (hours since birth).
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                icon={<PlusIcon className="h-4 w-4" />}
                onClick={onAddReading}
                disabled={readings.length >= VITAL_TIMEPOINTS.length}
              >
                Add reading
              </Button>
            </div>

            {readings.length === 0 ? (
              <p className="mt-3 text-sm text-theme-gray">
                No earlier readings added yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {readings.map((reading, index) => {
                  const duplicate =
                    Boolean(reading.hour) && hourCounts[reading.hour] > 1;
                  return (
                    <div
                      key={reading.id}
                      className="rounded-lg border border-theme-line bg-white p-3.5 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-theme-gray">
                            Time
                          </span>
                          <select
                            value={reading.hour}
                            onChange={(event) =>
                              onUpdateReading(
                                reading.id,
                                "hour",
                                event.target.value,
                              )
                            }
                            className={`${inputClass} w-auto py-1.5 ${duplicate
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                              : ""
                              }`}
                          >
                            {VITAL_TIMEPOINTS.map((hour) => (
                              <option key={hour} value={String(hour)}>
                                {hour} h
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-theme-gray">
                            after birth
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => onRemoveReading(reading.id)}
                          aria-label={`Remove reading ${index + 1}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-theme-gray transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {READING_VITALS.map((vital) => (
                          <label key={vital.key} className="block">
                            <span className={labelClass}>{vital.label}</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reading[vital.key]}
                              placeholder={vital.placeholder}
                              onChange={(event) =>
                                onUpdateReading(
                                  reading.id,
                                  vital.key,
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </label>
                        ))}
                      </div>
                      {duplicate && (
                        <p className="mt-2 text-xs text-red-600">
                          Two readings share the {reading.hour} h timepoint.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files?.[0] ?? null)}
          />
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${dragActive
              ? "border-theme-crimson bg-theme-cream/60"
              : "border-theme-line bg-theme-light-gray/40"
              }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-theme-maroon/10 text-theme-maroon">
              <UploadIcon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-theme-ink-soft">
              Upload a vitals CSV
            </p>
            <p className="mt-1 text-xs text-theme-gray">
              Drag and drop a .csv file here, or
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose file
            </Button>
          </div>

          {csvName && (
            <div className="mt-3 flex items-start gap-3 rounded-lg border border-theme-line bg-white px-4 py-3 text-sm shadow-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-risk-low-bg text-risk-low-fg">
                <CheckIcon className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-theme-ink-soft">
                  {csvName}
                </p>
                <p className="text-xs text-theme-gray">
                  {csvRows} readings detected (preview only — nothing was
                  imported).
                </p>
              </div>
              <button
                type="button"
                onClick={clearCsv}
                className="ml-auto shrink-0 text-xs font-semibold text-theme-gray hover:text-theme-ink-soft"
              >
                Clear
              </button>
            </div>
          )}

          {/* <div className="mt-3 flex items-start gap-2 rounded-lg bg-theme-light-gray/60 px-3.5 py-2.5 text-xs text-theme-gray"> */}
          {/*   <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> */}
          {/*   <span> */}
          {/*     CSV import is a preview for now. Enter readings manually above — uploaded vitals will */}
          {/*     map to the model's timepoints later. */}
          {/*   </span> */}
          {/* </div> */}
        </div>
      )}
    </div>
  );
}
