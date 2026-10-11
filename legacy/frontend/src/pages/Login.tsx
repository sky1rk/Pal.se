import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import AuthSubmitButton from "../components/auth/AuthSubmitButton";
import BrandMasthead from "../components/auth/BrandMasthead";
import GlassCard from "../components/auth/GlassCard";
import PasswordField from "../components/auth/PasswordField";
import { FieldLabel, TextField } from "../components/auth/fields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATS = [
  { value: "24hrs", caption: "Monitor first hours of life" },
  { value: "15+", caption: "Clinical Variables for Accuracy" },
  { value: "Unlimited", caption: "Assessments" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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
      await login({ email: trimmed, password, remember_me: rememberMe });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-theme-white lg:grid lg:grid-cols-[51fr_49fr]">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-theme-maroon text-theme-cream">
        <div className="flex min-h-full flex-col px-8 sm:px-12 lg:px-20 lg:pt-8 lg:pb-2">
          <BrandMasthead />
          <h1 className="mt-10 max-w-[464px] text-4xl font-bold leading-[1.2] tracking-[-0.5px] lg:mt-24 lg:text-[44px] lg:leading-[52.8px]">
            Early-Onset Neonatal
            <br />
            Sepsis Risk Prediction
          </h1>
          <p className="mt-6 max-w-[466px] text-[18px] leading-[28.8px] opacity-80">
            Clinical Decision Support System powered by machine learning to
            identify high-risk neonates and recommend timely interventions.
          </p>
          <div className="mt-10 hidden grid-cols-3 gap-4 sm:grid lg:mt-14">
            {STATS.map((s) => (
              <GlassCard key={s.value} className="rounded-lg p-6">
                <p className="text-[28px] font-bold leading-none">{s.value}</p>
                <p className="mt-3 text-[13px] font-medium leading-snug opacity-70">
                  {s.caption}
                </p>
              </GlassCard>
            ))}
          </div>
          <p className="mt-auto hidden pt-16 text-[13px] opacity-60 lg:block">
            © 2026 PAL.SE — Early Onset Neonatal Sepsis Risk Prediction
          </p>
        </div>
        <img
          src="/images/rob1.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-28 hidden w-[380px] rotate-[-20deg] object-cover lg:block"
        />
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-12 lg:py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-[420px]">
          <h2 className="text-[28px] font-bold text-theme-ink">Welcome back</h2>
          <p className="mt-2 text-[15px] text-theme-gray">
            Sign in to access the clinical dashboard
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="mt-10">
            <FieldLabel htmlFor="email">EMAIL ADDRESS</FieldLabel>
            <TextField
              id="email"
              type="email"
              autoComplete="email"
              placeholder="doctor@hospital.org"
              value={email}
              onChange={setEmail}
            />
          </div>

          <div className="mt-6">
            <PasswordField
              id="password"
              label="PASSWORD"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
            />
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="text-[13px] font-medium text-theme-crimson hover:text-theme-crimson-hover"
            >
              Forgot password?
            </button>
          </div>

          <label
            htmlFor="remember-me"
            className="mt-1 flex cursor-pointer items-center gap-3 text-sm text-theme-gray"
          >
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-[18px] w-[18px] cursor-pointer rounded accent-theme-crimson"
            />
            Remember me
          </label>

          <div className="mt-6">
            <AuthSubmitButton loading={isSubmitting} loadingLabel="Signing in…">
              Sign In
            </AuthSubmitButton>
          </div>

          <p className="mt-6 text-center text-[13px] text-theme-gray">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-theme-crimson hover:text-theme-crimson-hover"
            >
              Sign up.
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
