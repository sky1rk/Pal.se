import { useCallback, useEffect, useState } from "react";
import { listReports, onDataChanged } from "../api/predictions";
import type { ReportRow } from "../types/predictions";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import RiskBadge from "../components/ui/RiskBadge";
import { AlertTriangleIcon, InboxIcon } from "../components/ui/icons";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function SkeletonCard() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-theme-light-gray" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-theme-light-gray" />
      </div>
      <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-theme-light-gray" />
      <div className="mt-2 h-3 w-full animate-pulse rounded bg-theme-light-gray" />
      <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-theme-light-gray" />
    </Card>
  );
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
    return onDataChanged(refresh);
  }, [refresh]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generated automatically with every prediction."
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" />}
            title="No reports yet"
            description="Clinical reports are created automatically when you run a prediction."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((report) => (
            <Card key={report.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-maroon/10 text-theme-maroon">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                    <path d="M15 3v4a2 2 0 0 0 2 2h2" />
                    <path d="M9 13h6" />
                    <path d="M9 17h4" />
                  </svg>
                </span>
                <RiskBadge label={report.risk_label} short />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-theme-ink-soft">{report.title}</h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-theme-gray">{report.summary}</p>

              <div className="mt-4 flex items-center justify-between border-t border-theme-line pt-3 text-xs text-theme-gray">
                <span className="font-semibold text-theme-ink-soft">{report.patient_id}</span>
                <span>{formatDate(report.created_at)}</span>
              </div>
              <p className="mt-1 text-xs text-theme-gray">
                {report.probability_percent.toFixed(1)}% EOS probability
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
