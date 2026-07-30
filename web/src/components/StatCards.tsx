import { motion } from "framer-motion";
import type { Capture } from "../types";

function Stat({ label, value, sub, i }: { label: string; value: string; sub?: string; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      className="card p-4 sm:p-5"
    >
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums text-white sm:text-3xl">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-white/30">{sub}</div>}
    </motion.div>
  );
}

export default function StatCards({ captures }: { captures: Capture[] }) {
  const done = captures.filter((c) => c.status === "done" && c.canopy_pct != null);
  const latest = done[0];
  const avg = done.length ? done.reduce((s, c) => s + (c.canopy_pct ?? 0), 0) / done.length : null;
  const today = captures.filter((c) => new Date(c.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat i={0} label="Latest" value={latest?.canopy_pct != null ? `${latest.canopy_pct.toFixed(1)}%` : "—"} sub={latest ? new Date(latest.created_at).toLocaleDateString() : "no data"} />
      <Stat i={1} label="Average" value={avg != null ? `${avg.toFixed(1)}%` : "—"} sub={`${done.length} reading${done.length === 1 ? "" : "s"}`} />
      <Stat i={2} label="Total" value={String(captures.length)} sub="all time" />
      <Stat i={3} label="Today" value={String(today)} sub="captures" />
    </div>
  );
}
