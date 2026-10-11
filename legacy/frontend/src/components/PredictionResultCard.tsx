import type { PredictionResult } from "../types/predictions";
import Card from "./ui/Card";
import RiskBadge from "./ui/RiskBadge";
import { riskTier } from "./ui/risk";
import { CheckIcon } from "./ui/icons";

function barColor(label: string): string {
  const tier = riskTier(label);
  if (tier === "high") return "#b42318";
  if (tier === "moderate") return "#d97706";
  if (tier === "low") return "#1f7a45";
  return "#9a8f8c";
}

function ModelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-6 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-gray">{label}</p>
      <p className="mt-1 text-lg font-bold text-theme-ink-soft">{value}</p>
    </div>
  );
}

export default function PredictionResultCard({ result }: { result: PredictionResult }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="min-w-0">
          <RiskBadge label={result.risk_label} />
          <h2 className="mt-3 text-lg font-bold text-theme-ink-soft">{result.result_title}</h2>
          <p className="mt-1 max-w-xl text-sm text-theme-gray">{result.interpretation}</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-extrabold tracking-tight text-theme-ink-soft">
            {result.probability_percent.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-theme-gray">EOS probability</p>
        </div>
      </div>

      <div className="px-6">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-theme-light-gray">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(2, result.probability_percent))}%`,
              backgroundColor: barColor(result.risk_label),
            }}
          />
        </div>
        <div className="relative -mt-3 h-2">
          <span
            className="absolute top-0 h-2 w-0.5 -translate-x-1/2 rounded-full bg-theme-ink-soft/50"
            style={{ left: `${Math.min(100, Math.max(0, result.threshold * 100))}%` }}
            title="Decision threshold"
          />
        </div>
        <p className="mt-3 text-xs text-theme-gray">
          Decision threshold {(result.threshold * 100).toFixed(1)}%
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 divide-y divide-theme-line border-t border-theme-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <ModelStat label="XGBoost" value={`${(result.xgb_eos_probability * 100).toFixed(1)}%`} />
        <ModelStat
          label={`TFT · ${result.tft_source}`}
          value={`${(result.tft_eos_probability * 100).toFixed(1)}%`}
        />
        <ModelStat
          label="Classification"
          value={result.predicted_eos ? "EOS suspected" : "EOS unlikely"}
        />
      </div>

      {result.recommended_actions.length > 0 && (
        <div className="border-t border-theme-line px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-gray">
            Recommended actions
          </p>
          <ul className="mt-3 space-y-2">
            {result.recommended_actions.map((action) => (
              <li key={action} className="flex items-start gap-2.5 text-sm text-theme-ink-soft">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-theme-maroon/10 text-theme-maroon">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
