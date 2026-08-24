import { toRiskLevel } from "../../lib/risk";

interface RiskBadgeProps {
  label: string | null | undefined;
}

export default function RiskBadge({ label }: RiskBadgeProps) {
  return (
    <span className={`palse-risk ${toRiskLevel(label)}`}>
      {String(label ?? "LOW RISK").replace(" RISK", "")}
    </span>
  );
}
