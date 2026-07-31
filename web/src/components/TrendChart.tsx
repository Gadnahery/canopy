import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import type { Capture } from "../types";

export default function TrendChart({ captures, height = 224 }: { captures: Capture[]; height?: number }) {
  const data = captures
    .filter((c) => c.status === "done" && c.canopy_pct != null)
    .slice(0, 40).reverse()
    .map((c) => ({ t: format(new Date(c.created_at), "MMM d HH:mm"), pct: c.canopy_pct as number }));

  if (data.length === 0)
    return <div className="flex items-center justify-center text-sm text-white/30" style={{ height }}>No measurements yet.</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#ffffff0d" vertical={false} />
        <XAxis dataKey="t" tick={{ fill: "#ffffff55", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={26} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" tick={{ fill: "#ffffff55", fontSize: 11 }} tickLine={false} axisLine={false} width={46} />
        <Tooltip
          contentStyle={{ background: "#0d1310", border: "1px solid #1e2a22", borderRadius: 14, color: "#e6f2ea" }}
          formatter={(v: number) => [`${v.toFixed(1)}%`, "Canopy"]}
        />
        <Area type="monotone" dataKey="pct" stroke="#4ade80" strokeWidth={2.5} fill="url(#cg)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
