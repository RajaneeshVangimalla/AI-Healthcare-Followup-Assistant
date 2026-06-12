import { riskBadgeClasses } from "../utils/healthMetrics";

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-bold uppercase tracking-wide ${
        tones[tone] || tones.neutral
      }`}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ level }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-bold uppercase tracking-wide ${riskBadgeClasses(
        level
      )}`}
    >
      {level} Risk
    </span>
  );
}

export default Badge;
