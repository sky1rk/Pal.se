import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-theme-white">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-sm text-theme-gray">Page not found.</p>
      <Link to="/dashboard" className="text-sm font-semibold text-theme-maroon">
        Go to dashboard
      </Link>
    </div>
  );
}
