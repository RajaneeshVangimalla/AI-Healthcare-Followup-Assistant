function StatCard({ title, value, detail, tone = "teal" }) {
  const tones = {
    teal: "border-l-teal-600",
    red: "border-l-red-500",
    amber: "border-l-amber-500",
    blue: "border-l-blue-500",
    green: "border-l-emerald-500",
  };

  return (
    <article
      className={`rounded-lg border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${
        tones[tone] || tones.teal
      }`}
    >
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <strong className="mt-3 block text-3xl font-semibold tracking-normal text-slate-950">
        {value}
      </strong>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

export default StatCard;
