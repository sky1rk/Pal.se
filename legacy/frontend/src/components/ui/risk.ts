export type RiskTier = "high" | "moderate" | "low" | "unknown";

export function riskTier(label?: string | null): RiskTier {
  if (!label) return "unknown";
  const value = label.toUpperCase();
  if (value.includes("HIGH")) return "high";
  if (value.includes("MODERATE")) return "moderate";
  if (value.includes("LOW")) return "low";
  return "unknown";
}

export const RISK_BADGE_STYLES: Record<RiskTier, string> = {
  high: "bg-risk-high-bg text-risk-high-fg",
  moderate: "bg-risk-moderate-bg text-risk-moderate-fg",
  low: "bg-risk-low-bg text-risk-low-fg",
  unknown: "bg-theme-light-gray text-theme-gray",
};

export const RISK_LABELS: Record<RiskTier, string> = {
  high: "HIGH RISK",
  moderate: "MODERATE RISK",
  low: "LOW RISK",
  unknown: "—",
};