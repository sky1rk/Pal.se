import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ email: trimmed, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-theme-white">
      <aside className="hidden w-1/2 flex-col justify-between bg-theme-maroon p-12 text-theme-white lg:flex">
        <div>
          <p className="text-lg font-semibold">PAL.SE</p>
          <h1 className="mt-8 text-4xl font-bold leading-tight">
            Early-Onset Neonatal
            <br />
            Sepsis Risk Prediction
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/80">
            Clinical decision support to identify high-risk neonates and recommend timely interventions.
          </p>
        </div>
        <p className="text-xs text-white/60">© 2026 PAL.SE — Early Onset Neonatal Sepsis Risk Prediction</p>
      </aside>

      <main className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="mt-1 text-sm text-theme-gray">Sign in to access the clinical dashboard</p>
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold tracking-wide">
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="doctor@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-theme-light-gray px-3 py-2 text-sm outline-none focus:border-theme-maroon"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold tracking-wide">
              PASSWORD
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-theme-light-gray px-3 py-2 pr-16 text-sm outline-none focus:border-theme-maroon"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-theme-gray"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-theme-maroon py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>

          <p className="text-center text-sm text-theme-gray">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-theme-maroon">
              Sign up.
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
