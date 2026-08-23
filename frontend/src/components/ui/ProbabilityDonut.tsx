interface ProbabilityDonutProps {
  /** Probability from 0 to 1; rendered as a rounded percentage. */
  probability: number;
  caption?: string;
}

function clampPercent(probability: number): number {
  if (Number.isNaN(probability)) return 0;
  return Math.max(0, Math.min(100, Math.round(probability * 100)));
}

export default function ProbabilityDonut({
  probability,
  caption,
}: ProbabilityDonutProps) {
  const percent = clampPercent(probability);

  return (
    <div
      className="container-33"
      style={{ "--risk-percent": percent } as React.CSSProperties}
    >
      <div className="background-8"></div>
      <div className="container-34">
        <div className="container-35">
          <div className="text-wrapper-45">{percent}%</div>
        </div>
        <div className="text-wrapper-46">{caption ?? "PROBABILITY"}</div>
      </div>
    </div>
  );
}
