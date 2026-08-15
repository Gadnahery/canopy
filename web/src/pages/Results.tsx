import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useCaptures } from "../hooks/useCaptures";
import TrendChart from "../components/TrendChart";

function Metric({ label, value, i }: { label: string; value: string; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4 text-center">
      <div className="text-2xl font-bold tabular-nums text-white sm:text-3xl">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-white/40">{label}</div>
    </motion.div>
  );
}

export default function Results() {
  const { captures } = useCaptures(300);
  const done = useMemo(() => captures.filter((c) => c.status === "done" && c.canopy_pct != null), [captures]);

  const vals = done.map((c) => c.canopy_pct as number);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const min = vals.length ? Math.min(...vals) : null;
  const max = vals.length ? Math.max(...vals) : null;

  // distribution in 10% buckets
  const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${i * 10 + 10}`, count: 0, mid: i * 10 + 5 }));
  vals.forEach((v) => { const idx = Math.min(9, Math.floor(v / 10)); buckets[idx].count++; });

  return (
    <div className="space-y-6">
      <header>
          <h1 className="text-xl font-semibold text-text sm:text-2xl">Results</h1>
          <p className="text-sm text-text-secondary">Analytics across {done.length} measurements</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric i={0} label="Average" value={avg != null ? `${avg.toFixed(1)}%` : "—"} />
        <Metric i={1} label="Minimum" value={min != null ? `${min.toFixed(1)}%` : "—"} />
        <Metric i={2} label="Maximum" value={max != null ? `${max.toFixed(1)}%` : "—"} />
        <Metric i={3} label="Readings" value={String(done.length)} />
      </div>

      <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text">Canopy cover over time</h2>
        <TrendChart captures={captures} height={260} />
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-white/80">Distribution</h2>
        <h2 className="mb-4 text-sm font-semibold text-text">Distribution</h2>
        {done.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-text-secondary">No data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buckets} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <XAxis dataKey="range" tick={{ fill: "#263238", fontSize: 10 }} tickLine={false} axisLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fill: "#263238", fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ background: "#ffffff", border: "1px solid #DDE7DE", borderRadius: 8, color: "#263238" }} formatter={(v: number) => [`${v}`, "captures"]} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {buckets.map((b, i) => <Cell key={i} fill={`rgba(27,94,32,${0.25 + (b.mid / 100) * 0.6})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
