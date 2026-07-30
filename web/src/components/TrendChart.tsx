import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import type { Capture } from "../types";

export default function TrendChart({ captures }: { captures: Capture[] }) {
  const data = captures
    .filter((c) => c.status === "done" && c.canopy_pct != null)
    .slice(0, 40)
    .reverse()
    .map((c) => ({
      t: format(new Date(c.created_at), "MMM d HH:mm"),
      pct: c.canopy_pct as number,
    }));

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">Canopy cover over time</h2>
        <span className="text-xs text-slate-500">last {data.length} measurements</span>
      </div>
      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-500">
          No measurements yet — trigger a capture on the device.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              contentStyle={{ background: "#111a2b", border: "1px solid #ffffff14", borderRadius: 12, color: "#e2e8f0" }}
              formatter={(v: number) => [`${v.toFixed(1)}%`, "Canopy"]}
            />
            <Area type="monotone" dataKey="pct" stroke="#4ade80" strokeWidth={2} fill="url(#g)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
