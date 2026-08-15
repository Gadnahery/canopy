import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import type { Capture } from "../types";

export default function TrendChart({ captures, height = 224 }: { captures: Capture[]; height?: number }) {
  const data = captures
    .filter((c) => c.status === "done" && c.canopy_pct != null)
    .slice(0, 40).reverse()
    .map((c) => ({ t: format(new Date(c.created_at), "MMM d HH:mm"), pct: c.canopy_pct as number }));

  if (data.length === 0)
    return <div className="flex items-center justify-center text-sm text-text-secondary" style={{ height }}>No measurements yet.</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8BC34A" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8BC34A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#00000008" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: "#263238", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" tick={{ fill: "#263238", fontSize: 11 }} tickLine={false} axisLine={false} width={46} />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid #DDE7DE", borderRadius: 8, color: "#263238" }}
            formatter={(v: number) => [`${v.toFixed(1)}%`, "Canopy"]}
          />
          <Area type="monotone" dataKey="pct" stroke="#1B5E20" strokeWidth={2.5} fill="url(#cg)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
