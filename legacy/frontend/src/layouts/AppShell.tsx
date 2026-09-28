import { Link, Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "•";
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-theme-light-gray">
      <aside className="flex w-60 flex-col bg-theme-maroon p-6 text-theme-white">
        <p className="text-lg font-bold">PAL.SE</p>
        <nav className="mt-8 space-y-2 text-sm">
          <Link to="/dashboard" className="block rounded px-3 py-2 hover:bg-white/10">
            Dashboard
          </Link>
          <Link to="/patients" className="block rounded px-3 py-2 hover:bg-white/10">
            Patients
          </Link>
          <Link to="/reports" className="block rounded px-3 py-2 hover:bg-white/10">
            Reports
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto rounded border border-white/30 px-3 py-2 text-sm hover:bg-white/10"
        >
          Log out
        </button>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-theme-white px-8 py-4">
          <p className="text-sm text-theme-gray">Clinical Dashboard</p>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {user.first_name} {user.last_name}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-maroon text-xs font-bold text-white">
                {initials(user.first_name, user.last_name)}
              </span>
            </div>
          )}
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
