import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  archivePatient,
  listPatients,
  onDataChanged,
  restorePatient,
} from "../api/predictions";
import { ApiError } from "../api/client";
import type { PatientRow } from "../types/predictions";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import RiskBadge from "../components/ui/RiskBadge";
import { inputClass } from "../components/ui/inputStyles";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  PencilIcon,
  PatientsIcon,
  RestoreIcon,
  SearchIcon,
} from "../components/ui/icons";

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-theme-light-gray" />
        </td>
      ))}
    </tr>
  );
}

export default function Patients() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [pendingArchive, setPendingArchive] = useState<PatientRow | null>(null);
  const [isActing, setIsActing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRows(await listPatients(showArchived));
      setError(null);
    } catch {
      setError("Could not load patients.");
    } finally {
      setIsLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    refresh();
    return onDataChanged(refresh);
  }, [refresh]);

  const high = rows.filter((r) => r.latest_risk_label === "HIGH RISK").length;
  const moderate = rows.filter((r) => r.latest_risk_label === "MODERATE RISK").length;
  const low = rows.filter((r) => r.latest_risk_label === "LOW RISK").length;

  const stats = [
    { label: "Total patients", value: rows.length, tone: "text-theme-ink-soft", bar: "bg-theme-maroon" },
    { label: "High risk", value: high, tone: "text-risk-high-fg", bar: "bg-risk-high-fg" },
    { label: "Moderate risk", value: moderate, tone: "text-risk-moderate-fg", bar: "bg-risk-moderate-fg" },
    { label: "Low risk", value: low, tone: "text-risk-low-fg", bar: "bg-risk-low-fg" },
  ];

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => row.patient_id.toLowerCase().includes(term));
  }, [rows, query]);

  async function handleArchive(): Promise<void> {
    if (!pendingArchive) return;
    setIsActing(true);
    setError(null);
    try {
      await archivePatient(pendingArchive.patient_id);
      setPendingArchive(null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not archive patient.");
      setPendingArchive(null);
    } finally {
      setIsActing(false);
    }
  }

  async function handleRestore(row: PatientRow): Promise<void> {
    setIsActing(true);
    setError(null);
    try {
      await restorePatient(row.patient_id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not restore patient.");
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Manage and monitor neonatal patients across your unit."
        actions={
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-theme-crimson px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-theme-crimson-hover"
          >
            New assessment
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden p-5">
            <span className={`absolute inset-x-0 top-0 h-1 ${stat.bar}`} aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-gray">
              {stat.label}
            </p>
            <p className={`mt-2 text-3xl font-extrabold tracking-tight ${stat.tone}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-theme-ink-soft">
              Patient registry
            </h2>
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                showArchived
                  ? "border-theme-crimson/30 bg-theme-crimson/10 text-theme-crimson"
                  : "border-theme-line bg-theme-white text-theme-gray hover:bg-theme-light-gray"
              }`}
              aria-pressed={showArchived}
            >
              <ArchiveIcon className="h-3.5 w-3.5" />
              {showArchived ? "Hide archived" : "Show archived"}
            </button>
          </div>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-gray" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by patient ID…"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <tbody className="divide-y divide-theme-line">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonRow key={index} />
                ))}
              </tbody>
            </table>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<PatientsIcon className="h-5 w-5" />}
            title={showArchived ? "No patients yet" : "No active patients"}
            description={
              showArchived
                ? "Run a prediction from the dashboard to register your first patient."
                : "Run a prediction from the dashboard, or show archived patients."
            }
            action={
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg border border-theme-line bg-theme-white px-4 py-2.5 text-sm font-semibold text-theme-ink-soft transition-colors hover:bg-theme-light-gray"
              >
                Go to dashboard
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="h-5 w-5" />}
            title="No matching patients"
            description="Try a different patient ID."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-y border-theme-line text-[11px] uppercase tracking-wide text-theme-gray">
                  <th className="px-6 py-3 font-semibold">Patient</th>
                  <th className="px-6 py-3 font-semibold">Sex</th>
                  <th className="px-6 py-3 font-semibold">GA (wk)</th>
                  <th className="px-6 py-3 font-semibold">Weight (g)</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Risk level</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-line">
                {filtered.map((row) => {
                  const archived = row.status === "Archived";
                  return (
                    <tr
                      key={row.patient_id}
                      className={`transition-colors hover:bg-theme-light-gray/60 ${
                        archived ? "opacity-70" : ""
                      }`}
                    >
                      <td className="px-6 py-3 font-semibold text-theme-ink-soft">
                        {row.patient_id}
                      </td>
                      <td className="px-6 py-3 text-theme-gray">{row.sex || "—"}</td>
                      <td className="px-6 py-3 text-theme-gray">
                        {row.gestational_age_weeks ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-theme-gray">{row.birth_weight_g ?? "—"}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            archived
                              ? "bg-amber-50 text-amber-700"
                              : "bg-theme-light-gray text-theme-gray"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              archived ? "bg-amber-500" : "bg-theme-gray"
                            }`}
                            aria-hidden="true"
                          />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <RiskBadge label={row.latest_risk_label} short />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/patients/${encodeURIComponent(row.patient_id)}/edit`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-theme-ink-soft transition-colors hover:bg-black/5"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          {archived ? (
                            <button
                              type="button"
                              onClick={() => handleRestore(row)}
                              disabled={isActing}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-theme-crimson transition-colors hover:bg-theme-crimson/10 disabled:opacity-60"
                            >
                              <RestoreIcon className="h-3.5 w-3.5" />
                              Restore
                            </button>
                          ) : (
                            <>
                              <Link
                                to={`/monitor?patient=${encodeURIComponent(row.patient_id)}`}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-theme-ink-soft transition-colors hover:bg-black/5"
                              >
                                Monitor
                                <ChevronRightIcon className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setPendingArchive(row)}
                                disabled={isActing}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-theme-gray transition-colors hover:bg-black/5 hover:text-theme-ink-soft disabled:opacity-60"
                              >
                                <ArchiveIcon className="h-3.5 w-3.5" />
                                Archive
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={pendingArchive !== null}
        tone="danger"
        title={pendingArchive ? `Archive ${pendingArchive.patient_id}?` : "Archive patient?"}
        description="The patient is hidden from the active registry but kept on record. You can restore it later."
        confirmLabel="Archive"
        busy={isActing}
        onConfirm={handleArchive}
        onCancel={() => setPendingArchive(null)}
      />
    </div>
  );
}
