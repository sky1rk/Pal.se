const REPORTS = [
  { id: 1, title: "EOS Risk Report - NEO-2024-001", summary: "HIGH RISK at 78.0% probability." },
  { id: 2, title: "EOS Risk Report - NEO-2024-002", summary: "MODERATE RISK at 42.5% probability." },
];

export default function Reports() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-sm text-theme-gray">Protected placeholder for authenticated access-control testing.</p>
      <div className="space-y-3">
        {REPORTS.map((r) => (
          <article key={r.id} className="rounded-lg bg-theme-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">{r.title}</h2>
            <p className="mt-1 text-sm text-theme-gray">{r.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
