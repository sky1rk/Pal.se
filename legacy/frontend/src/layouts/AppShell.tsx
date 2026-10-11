import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import BrandMasthead from "../components/auth/BrandMasthead";
import {
  CloseIcon,
  DashboardIcon,
  LogOutIcon,
  MenuIcon,
  MonitorIcon,
  PatientsIcon,
  ProfileIcon,
  ReportsIcon,
} from "../components/ui/icons";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { to: "/patients", label: "Patients", Icon: PatientsIcon },
  { to: "/reports", label: "Reports", Icon: ReportsIcon },
  { to: "/monitor", label: "Monitor", Icon: MonitorIcon },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Patients",
  "/reports": "Reports",
  "/monitor": "Monitor",
  "/profile": "Profile",
};

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "•";
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-white/15 text-white"
                : "text-theme-cream/75 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-theme-cream" aria-hidden="true" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter({
  onNavigate,
  onLogout,
}: {
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-white/10 pt-4">
      <NavLink
        to="/profile"
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive
              ? "bg-white/15 text-white"
              : "text-theme-cream/75 hover:bg-white/10 hover:text-white"
          }`
        }
      >
        <ProfileIcon className="h-5 w-5 shrink-0" />
        <span>Profile</span>
      </NavLink>
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-theme-cream/75 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOutIcon className="h-5 w-5 shrink-0" />
        <span>Log out</span>
      </button>
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title =
    TITLES[location.pathname] ??
    (location.pathname.startsWith("/patients/") ? "Edit patient" : "PAL.SE");

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const userBlock: ReactNode = user && (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-tight text-theme-ink-soft">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-theme-gray">{user.email}</p>
      </div>
      <Link
        to="/profile"
        aria-label="Open profile"
        className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-crimson"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-maroon text-xs font-bold text-white">
          {initials(user.first_name, user.last_name)}
        </span>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-theme-light-gray">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-theme-maroon px-4 py-5 lg:flex">
        <div className="px-2">
          <BrandMasthead compact />
        </div>
        <div className="mt-8 flex flex-1 flex-col">
          <NavItems />
        </div>
        <SidebarFooter onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col bg-theme-maroon px-4 py-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 px-2">
              <BrandMasthead compact />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-theme-cream/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="mt-8 flex flex-1 flex-col">
              <NavItems onNavigate={() => setDrawerOpen(false)} />
            </div>
            <SidebarFooter onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-theme-line bg-theme-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-theme-ink-soft transition-colors hover:bg-black/5 lg:hidden"
          >
            <MenuIcon />
          </button>
          <p className="truncate text-sm font-semibold text-theme-ink-soft">{title}</p>
          <div className="ml-auto">{userBlock}</div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
