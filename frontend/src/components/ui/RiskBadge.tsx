export type RiskLevel = "high" | "moderate" | "low";

export function toRiskLevel(label: string | null | undefined): RiskLevel {
  return String(label ?? "LOW RISK")
    .replace(" RISK", "")
    .toLowerCase() as RiskLevel;
}

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
