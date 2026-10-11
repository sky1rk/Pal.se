import { Link } from "react-router";
import { ArrowRightIcon } from "../components/ui/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-theme-light-gray px-6 text-center">
      <p className="text-7xl font-extrabold tracking-tight text-theme-maroon/15">404</p>
      <h1 className="text-xl font-bold text-theme-ink-soft">Page not found</h1>
      <p className="max-w-sm text-sm text-theme-gray">
        The page you are looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-theme-crimson px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-theme-crimson-hover"
      >
        Back to dashboard
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
