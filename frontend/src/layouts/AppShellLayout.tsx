import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import Icon from "../components/ui/Icon";
import logoUrl from "../assets/images/logo.png";
import nameUrl from "../assets/images/name.png";

interface NavItem {
  label: string;
  to: string;
  icon: "dashboard" | "patients" | "reports";
  textClass: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: "dashboard", textClass: "text" },
  {
    label: "Patients",
    to: "/patients",
    icon: "patients",
    textClass: "text-wrapper",
  },
  { label: "Reports", to: "/reports", icon: "reports", textClass: "text-2" },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Neonatal Sepsis Prediction",
  "/patients": "Neonatal Sepsis Prediction",
  "/reports": "Generated EOS Reports",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "U";
}

export default function AppShellLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.name ?? "Dr. Sarah Jenkins";
  const displayRole = user?.role ?? "Pediatrician";

  async function handleLogout(): Promise<void> {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="aside-sidebar">
          <div className="group-2">
            <img className="image" src={logoUrl} alt="PAL.SE logo" />
            <img className="image-2" src={nameUrl} alt="PAL.SE" />
          </div>
          <nav className="nav">
            {NAV_ITEMS.map((item, index) => {
              const isActive = isActivePath(location.pathname, item.to);

              return (
                <div
                  key={item.to}
                  className={index === 0 ? "link-margin" : "link-wrapper"}
                >
                  <Link
                    to={item.to}
                    className={`${index === 0 ? "link" : "div"} sidebar-link${
                      isActive ? " is-active" : ""
                    }`}
                    aria-label={`Open ${item.label.toLowerCase()}`}
                  >
                    <Icon name={item.icon} />
                    <div className={item.textClass}>{item.label}</div>
                  </Link>
                </div>
              );
            })}
            <div className="link-margin-2"></div>
          </nav>
          <div className="button-margin">
            <a
              className="group"
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.preventDefault();
                void handleLogout();
              }}
            >
              <div className="div-wrapper">
                <div className="SVG">
                  <Icon name="logout" />
                </div>
              </div>
              <div className="text-3">Logout</div>
            </a>
          </div>
        </div>
        <div className="main-area">
          <header className="header-topbar">
            <div className="container-2">
              <div className="container-3">
                <span className="text-4">
                  {
                    NAV_ITEMS.find((i) => isActivePath(location.pathname, i.to))
                      ?.label
                  }
                </span>
              </div>
              <div className="margin">
                <div className="iconify-icon-wrapper">
                  <div className="div-wrapper-2">
                    <div className="vector-wrapper">
                      <Icon name="chevronRight" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="container-4">
                <div className="text-5">
                  {PAGE_TITLES[location.pathname] ?? ""}
                </div>
              </div>
            </div>
            <div className="container-wrapper">
              <div className="container-5">
                <div className="container-6">
                  <div className="container-7">
                    <div className="text-wrapper-2">{displayName}</div>
                  </div>
                  <div className="container-7">
                    <div className="text-wrapper-3">{displayRole}</div>
                  </div>
                </div>
                <Link
                  className="profile-avatar-link"
                  to={`/profile/${user?.id ?? "me"}`}
                  aria-label="Open profile page"
                >
                  <div className="background">
                    <div className="text-wrapper-4">
                      {initialsOf(displayName)}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </header>
          <div className="frame">
            <div className="content-area-wrapper">
              <div className="content-area">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isActivePath(currentPath: string, itemPath: string): boolean {
  if (itemPath === "/") {
    return (
      currentPath === "/" ||
      currentPath === "/monitor" ||
      currentPath === "/edit-record"
    );
  }
  return currentPath.startsWith(itemPath);
}
