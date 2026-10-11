import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import AuthSubmitButton from "../components/auth/AuthSubmitButton";
import BrandMasthead from "../components/auth/BrandMasthead";
import GlassCard from "../components/auth/GlassCard";
import PasswordField from "../components/auth/PasswordField";
import { FieldLabel, TextField } from "../components/auth/fields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SERVICES = [
  { image: "/images/time.png", label: "Real-time Monitoring" },
  { image: "/images/deep.png", label: "Hybrid Deep Learning" },
  { image: "/images/xai.png", label: "Explainable AI Results" },
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const first = firstName.trim();
    const last = lastName.trim();
    const trimmedEmail = email.trim();
    if (!first || !last) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }
    setIsSubmitting(true);
    try {
      await signup({ first_name: first, last_name: last, email: trimmedEmail, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-theme-white lg:grid lg:grid-cols-[51fr_49fr]">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-theme-maroon text-theme-cream">
        <div className="flex min-h-full flex-col px-8 py-10 sm:px-12 lg:px-20 lg:py-16">
          <BrandMasthead />
          <h1 className="mt-10 lg:mt-16">
            <span className="block text-[20px] font-normal">Every baby needs a</span>
            <span className="block text-[32px] font-bold">pal.</span>
          </h1>

          <div className="relative mx-auto mt-6 hidden w-[300px] sm:block lg:mt-10">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0)_68%)]"
            />
            <img src="/images/rob.png" alt="" aria-hidden="true" className="relative z-[2] w-full object-cover" />
            <span aria-hidden="true" className="absolute -left-2 top-6 z-[3] h-12 w-12 rounded-full bg-[#b41919]/80 shadow-[0px_8px_40px_rgba(0,0,0,0.12)] backdrop-blur-[3.5px]" />
            <span aria-hidden="true" className="absolute right-8 top-2 z-[3] h-12 w-12 rounded-full bg-[#b41919]/80 shadow-[0px_8px_40px_rgba(0,0,0,0.12)] backdrop-blur-[3.5px]" />
            <span aria-hidden="true" className="absolute bottom-16 right-4 z-[3] h-[18px] w-[19px] rounded-full bg-white/80 shadow-[0px_8px_40px_rgba(0,0,0,0.12)] backdrop-blur-[3.5px]" />
          </div>

          <h2 className="mt-10 hidden text-center text-[35px] font-bold tracking-[-0.5px] text-[#f1eaea] sm:block lg:mt-12">
            Explore our Services
          </h2>
          <div className="mt-6 hidden grid-cols-3 justify-items-center gap-4 sm:grid">
            {SERVICES.map((s) => (
              <GlassCard key={s.label} className="w-[121px] rounded-[20px] p-2.5 opacity-75">
                <img src={s.image} alt="" aria-hidden="true" className="h-16 w-full rounded-[14px] object-cover" />
                <p className="mt-2 text-center text-[10px] font-medium leading-tight">{s.label}</p>
              </GlassCard>
            ))}
          </div>
          <p className="mt-auto hidden pt-16 text-[13px] opacity-60 lg:block">
            © 2026 PAL.SE — Early Onset Neonatal Sepsis Risk Prediction
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-12 lg:py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-[440px]">
          <h2 className="text-[32px] font-bold text-theme-ink">Create an account</h2>
          <p className="mt-2 text-[15px] text-theme-gray">Sign up to access the clinical dashboard</p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="firstName">FIRST NAME</FieldLabel>
              <TextField
                id="firstName"
                autoComplete="given-name"
                placeholder="Sarah"
                value={firstName}
                onChange={setFirstName}
              />
            </div>
            <div>
              <FieldLabel htmlFor="lastName">LAST NAME</FieldLabel>
              <TextField
                id="lastName"
                autoComplete="family-name"
                placeholder="Jenkins"
                value={lastName}
                onChange={setLastName}
              />
            </div>
          </div>

          <div className="mt-5">
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

          <div className="mt-5">
            <PasswordField
              id="password"
              label="PASSWORD"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={setPassword}
            />
          </div>

          <div className="mt-5">
            <PasswordField
              id="confirmPassword"
              label="RE-ENTER PASSWORD"
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </div>

          <label htmlFor="agree-terms" className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded accent-theme-crimson"
            />
            <span className="text-theme-gray">
              I agree to the{" "}
              <span className="font-medium text-theme-field-text underline">Terms &amp; Conditions</span> and{" "}
              <span className="font-medium text-theme-field-text underline">Privacy Policy</span>
            </span>
          </label>

          <div className="mt-8">
            <AuthSubmitButton loading={isSubmitting} loadingLabel="Creating account…">
              Sign Up
            </AuthSubmitButton>
          </div>

          <p className="mt-6 text-center text-sm text-theme-gray">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-theme-crimson hover:text-theme-crimson-hover">
              Sign in.
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
