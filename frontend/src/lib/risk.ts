export type RiskLevel = "high" | "moderate" | "low";

export function toRiskLevel(label: string | null | undefined): RiskLevel {
  return String(label ?? "LOW RISK")
    .replace(" RISK", "")
    .toLowerCase() as RiskLevel;
}
