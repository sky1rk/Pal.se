import { useAuth } from "../auth/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-theme-gray">
        Protected placeholder. Signed in as <span className="font-semibold">{user?.email}</span>.
      </p>
      <div className="rounded-lg bg-theme-white p-6 shadow-sm">
        <p className="text-sm">Risk-score widgets and prediction history will live here.</p>
      </div>
    </div>
  );
}
