import { useState } from "react";
import { useNavigate } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import { ApiError } from "../api/client";
import type { ProfileUpdateInput } from "../types/auth";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import PasswordField from "../components/auth/PasswordField";
import Spinner from "../components/ui/Spinner";
import { inputClass, labelClass } from "../components/ui/inputStyles";
import {
  AlertTriangleIcon,
  CheckIcon,
  LogOutIcon,
  MailIcon,
  PencilIcon,
  ProfileIcon,
  ShieldIcon,
  TrashIcon,
} from "../components/ui/icons";

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "•";
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-theme-light-gray text-theme-gray">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-gray">{label}</p>
        <p className="truncate text-sm font-medium text-theme-ink-soft">{value}</p>
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  const styles =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700";
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {tone === "success" ? (
        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}

export default function Profile() {
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function handleSave(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    if (!firstName.trim() || !lastName.trim()) {
      setSaveError("First and last name are required.");
      return;
    }
    if (!email.trim()) {
      setSaveError("Email is required.");
      return;
    }

    const input: ProfileUpdateInput = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
    };

    const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword);
    if (wantsPasswordChange) {
      if (!currentPassword) {
        setSaveError("Enter your current password to change it.");
        return;
      }
      if (newPassword.length < 8) {
        setSaveError("New password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setSaveError("New passwords do not match.");
        return;
      }
      input.current_password = currentPassword;
      input.new_password = newPassword;
    }

    setIsSaving(true);
    try {
      await updateProfile(input);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaveSuccess(
        wantsPasswordChange ? "Profile and password updated." : "Profile updated.",
      );
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not update your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Could not delete your account.");
      setDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profile" description="Your account details and session." />

      <Card className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-theme-maroon text-2xl font-bold text-white">
          {initials(user.first_name, user.last_name)}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-theme-ink-soft">
            {user.first_name} {user.last_name}
          </h2>
          <p className="mt-0.5 truncate text-sm text-theme-gray">{user.email}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-theme-maroon/10 px-2.5 py-1 text-[11px] font-semibold text-theme-maroon">
            <ShieldIcon className="h-3.5 w-3.5" />
            Clinician
          </span>
        </div>
      </Card>

      {deleteError && <Banner tone="error">{deleteError}</Banner>}

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-maroon/10 text-theme-maroon">
            <PencilIcon className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wide text-theme-ink-soft">
            Edit profile
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {saveError && <Banner tone="error">{saveError}</Banner>}
          {saveSuccess && <Banner tone="success">{saveSuccess}</Banner>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>First name</span>
              <input
                type="text"
                value={firstName}
                autoComplete="given-name"
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Last name</span>
              <input
                type="text"
                value={lastName}
                autoComplete="family-name"
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="rounded-xl border border-theme-line bg-theme-light-gray/40 p-4">
            <div className="mb-4 flex items-center gap-2">
              <ShieldIcon className="h-4 w-4 text-theme-gray" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-theme-gray">
                Change password
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <PasswordField
                id="current-password"
                label="Current password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={setCurrentPassword}
                required={false}
              />
              <PasswordField
                id="new-password"
                label="New password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={setNewPassword}
                required={false}
              />
              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required={false}
              />
            </div>
            <p className="mt-3 text-xs text-theme-gray">
              Leave these blank to keep your current password.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto"
              icon={isSaving ? <Spinner /> : <CheckIcon className="h-4 w-4" />}
            >
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="divide-y divide-theme-line">
        <DetailRow
          icon={<ProfileIcon className="h-4 w-4" />}
          label="Full name"
          value={`${user.first_name} ${user.last_name}`}
        />
        <DetailRow icon={<MailIcon className="h-4 w-4" />} label="Email" value={user.email} />
        <DetailRow icon={<ShieldIcon className="h-4 w-4" />} label="Account ID" value={user.id} />
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="secondary"
          icon={<LogOutIcon className="h-4 w-4" />}
          onClick={handleLogout}
          className="w-full sm:w-auto"
        >
          Log out
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/dashboard")}
          className="w-full sm:w-auto"
        >
          Back to dashboard
        </Button>
      </div>

      <Card className="border-red-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#b42318]">
              <AlertTriangleIcon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-theme-ink-soft">Delete account</h2>
              <p className="mt-0.5 max-w-md text-xs text-theme-gray">
                Deactivates your account and signs you out. Your data is retained and can be
                restored by an administrator.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            icon={<TrashIcon className="h-4 w-4" />}
            onClick={() => setDeleteOpen(true)}
            className="w-full shrink-0 sm:w-auto"
          >
            Delete account
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        tone="danger"
        title="Delete your account?"
        description="Your account will be deactivated and you will be signed out. This can be reversed by an administrator."
        confirmLabel="Delete account"
        cancelLabel="Keep account"
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
