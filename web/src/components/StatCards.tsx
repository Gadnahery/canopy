import type { Capture } from "../types";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export default function StatCards({ captures }: { captures: Capture[] }) {
  const done = captures.filter((c) => c.status === "done" && c.canopy_pct != null);
  const latest = done[0];
  const avg =
    done.length > 0
      ? done.reduce((s, c) => s + (c.canopy_pct ?? 0), 0) / done.length
      : null;
  const today = captures.filter(
    (c) => new Date(c.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat
        label="Latest canopy"
        value={latest?.canopy_pct != null ? `${latest.canopy_pct.toFixed(1)}%` : "—"}
        sub={latest ? new Date(latest.created_at).toLocaleString() : "no captures yet"}
      />
      <Stat
        label="Average cover"
        value={avg != null ? `${avg.toFixed(1)}%` : "—"}
        sub={`over ${done.length} measurement${done.length === 1 ? "" : "s"}`}
      />
      <Stat label="Total captures" value={String(captures.length)} sub="all time" />
      <Stat label="Captured today" value={String(today)} sub="rolling calendar day" />
    </div>
  );
}
