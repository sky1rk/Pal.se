import { useCallback, useEffect, useState } from "react";
import { listReports, onPredictionCreated } from "../api/predictions";
import type { ReportRow } from "../types/predictions";

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function Reports() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRows(await listReports());
      setError(null);
    } catch {
      setError("Could not load reports.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return onPredictionCreated(refresh);
  }, [refresh]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-sm text-theme-gray">
        Generated automatically with every prediction.
      </p>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-theme-gray">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-theme-gray">No reports generated yet.</p>
        ) : (
          rows.map((r) => (
            <article key={r.id} className="rounded-lg bg-theme-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold">{r.title}</h2>
              <p className="mt-1 text-sm text-theme-gray">{r.summary}</p>
              <p className="mt-1 text-xs text-theme-gray">
                {r.patient_id} · {formatDate(r.created_at)} · {r.risk_label} ·{" "}
                {r.probability_percent.toFixed(1)}%
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
