const ROWS = [
  { id: "NEO-2024-001", status: "Active", risk: "HIGH RISK" },
  { id: "NEO-2024-002", status: "Monitoring", risk: "MODERATE RISK" },
  { id: "NEO-2024-003", status: "Discharged", risk: "LOW RISK" },
];

export default function Patients() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Patients</h1>
      <p className="text-sm text-theme-gray">Protected placeholder for authenticated access-control testing.</p>
      <div className="overflow-hidden rounded-lg bg-theme-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-theme-light-gray text-xs uppercase text-theme-gray">
            <tr>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium">{r.id}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2">{r.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
