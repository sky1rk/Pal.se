import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-theme-crimson text-white shadow-sm hover:bg-theme-crimson-hover",
  secondary:
    "border border-theme-line bg-theme-white text-theme-ink-soft hover:bg-theme-light-gray",
  ghost: "text-theme-gray hover:bg-black/5 hover:text-theme-ink-soft",
  danger:
    "bg-[#b42318] text-white shadow-sm hover:bg-[#9a1e14] focus-visible:outline-[#b42318]",
};

export default function Button({
  variant = "primary",
  icon,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-crimson disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
