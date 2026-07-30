import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import type { Device } from "../types";
import { isOnline } from "../hooks/useDevices";

function DeviceCard({ d, i }: { d: Device; i: number }) {
  const online = isOnline(d);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      className="card flex items-center gap-4 p-4"
    >
      <div className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ${online ? "bg-forest-500/15 text-forest-300" : "bg-white/5 text-white/40"}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-forest-400 animate-pulse-ring" : "bg-white/30"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{d.name ?? d.id}</div>
        <div className="text-xs text-white/40">
          {d.kind === "camera" ? "ESP32-CAM · camera" : "ESP32 · button + LCD"}
        </div>
      </div>
      <div className="text-right">
        <div className={`chip ${online ? "bg-forest-500/15 text-forest-300" : "bg-white/5 text-white/40"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-forest-400" : "bg-white/40"}`} />
          {online ? "Online" : "Offline"}
        </div>
        <div className="mt-1 text-[11px] text-white/30">
          {d.last_seen ? `seen ${formatDistanceToNow(new Date(d.last_seen), { addSuffix: true })}` : "no heartbeat yet"}
        </div>
      </div>
    </motion.div>
  );
}

export default function DeviceStatus({ devices }: { devices: Device[] }) {
  if (devices.length === 0) {
    return <div className="card p-4 text-sm text-white/40">No devices registered yet.</div>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {devices.map((d, i) => <DeviceCard key={d.id} d={d} i={i} />)}
    </div>
  );
}
