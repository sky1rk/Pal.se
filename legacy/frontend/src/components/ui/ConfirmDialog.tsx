import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Button from "./Button";
import { AlertTriangleIcon, CloseIcon } from "./icons";

type Tone = "default" | "danger";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const iconClass =
    tone === "danger"
      ? "bg-[#fde7e7] text-[#b42318]"
      : "bg-theme-maroon/10 text-theme-maroon";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-theme-line bg-theme-white shadow-xl outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 p-5">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
            <AlertTriangleIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-base font-bold text-theme-ink-soft"
            >
              {title}
            </h2>
            {description && (
              <div className="mt-1.5 text-sm text-theme-gray">{description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-theme-gray transition-colors hover:bg-black/5 hover:text-theme-ink-soft disabled:opacity-60"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-theme-line px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={busy} className="sm:w-auto">
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
            className="sm:w-auto"
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
