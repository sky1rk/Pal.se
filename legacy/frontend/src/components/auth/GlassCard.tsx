import type { ReactNode } from "react";

export default function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white/8 backdrop-blur-[2px] ${className}`}>
      {children}
    </div>
  );
}
