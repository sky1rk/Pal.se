import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-black/5 bg-theme-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}
