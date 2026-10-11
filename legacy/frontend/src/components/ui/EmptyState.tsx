import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-theme-light-gray text-theme-gray">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-theme-ink-soft">{title}</p>
        {description && <p className="mt-1 text-sm text-theme-gray">{description}</p>}
      </div>
      {action}
    </div>
  );
}
