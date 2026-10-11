import { RISK_BADGE_STYLES, RISK_LABELS, riskTier } from "./risk";

export default function RiskBadge({
  label,
  short = false,
  className = "",
}: {
  label?: string | null;
  short?: boolean;
  className?: string;
}) {
  const tier = riskTier(label);
  const text = short ? RISK_LABELS[tier].replace(" RISK", "") : RISK_LABELS[tier];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${RISK_BADGE_STYLES[tier]} ${className}`}
    >
      {text}
    </span>
  );
}