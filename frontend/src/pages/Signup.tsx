import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const inputCls =
    "w-full rounded-md border border-gray-300 bg-theme-light-gray px-3 py-2 text-sm outline-none focus:border-theme-maroon";

  return (
    <div className="flex min-h-screen bg-theme-white">
      <aside className="hidden w-1/2 flex-col justify-between bg-theme-maroon p-12 text-theme-white lg:flex">
        <div>
          <p className="text-lg font-semibold">PAL.SE</p>
          <h1 className="mt-8 text-4xl font-bold leading-tight">
            Every baby needs a<br />
            pal.
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/80">
            Sign up to access real-time monitoring, hybrid deep learning, and explainable AI results.
          </p>
        </div>
        <p className="text-xs text-white/60">© 2026 PAL.SE — Early Onset Neonatal Sepsis Risk Prediction</p>
      </aside>

      <main className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Create an account</h2>
            <p className="mt-1 text-sm text-theme-gray">Sign up to access the clinical dashboard</p>
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-xs font-semibold tracking-wide">
                FIRST NAME
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                required
                placeholder="Sarah"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-xs font-semibold tracking-wide">
                LAST NAME
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                required
                placeholder="Jenkins"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

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
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold tracking-wide">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Create a password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-xs font-semibold tracking-wide">
              RE-ENTER PASSWORD
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-theme-maroon py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Sign Up"}
          </button>

          <p className="text-center text-sm text-theme-gray">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-theme-maroon">
              Sign in.
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
