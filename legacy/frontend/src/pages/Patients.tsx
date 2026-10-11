import { useCallback, useEffect, useState } from "react";
import { listPatients, onPredictionCreated } from "../api/predictions";
import type { PatientRow } from "../types/predictions";

export default function Patients() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRows(await listPatients());
      setError(null);
    } catch {
      setError("Could not load patients.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return onPredictionCreated(refresh);
  }, [refresh]);

  const high = rows.filter((r) => r.latest_risk_label === "HIGH RISK").length;
  const moderate = rows.filter((r) => r.latest_risk_label === "MODERATE RISK").length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Patients</h1>
      <p className="text-sm text-theme-gray">
        {rows.length} total · {high} high risk · {moderate} moderate risk
      </p>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden rounded-lg bg-theme-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-theme-light-gray text-xs uppercase text-theme-gray">
            <tr>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Sex</th>
              <th className="px-4 py-2">GA (wk)</th>
              <th className="px-4 py-2">Weight (g)</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-4 text-theme-gray" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-theme-gray" colSpan={6}>
                  No patients yet. Run a prediction from the dashboard.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.patient_id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium">{r.patient_id}</td>
                  <td className="px-4 py-2">{r.sex || "—"}</td>
                  <td className="px-4 py-2">{r.gestational_age_weeks ?? "—"}</td>
                  <td className="px-4 py-2">{r.birth_weight_g ?? "—"}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2">{r.latest_risk_label || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
