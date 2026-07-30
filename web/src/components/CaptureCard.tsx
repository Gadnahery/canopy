import { motion } from "framer-motion";
import { format } from "date-fns";
import type { Capture } from "../types";
import { imageUrl } from "../lib/supabase";
import StatusBadge from "./StatusBadge";

// colour the % by density
function tone(p: number | null) {
  if (p == null) return "text-white/40";
  if (p >= 70) return "text-forest-300";
  if (p >= 40) return "text-forest-400";
  return "text-amber-300";
}

export default function CaptureCard({ c, i, onClick }: { c: Capture; i: number; onClick: () => void }) {
  const url = imageUrl(c.image_path);
  const d = new Date(c.created_at);
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
      whileHover={{ y: -3 }} onClick={onClick}
      className="card group overflow-hidden text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-raised">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/30">no image</div>
        )}
        <div className="absolute left-2 top-2"><StatusBadge status={c.status} /></div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-3">
          <span className={`text-3xl font-bold tabular-nums ${tone(c.canopy_pct)}`}>
            {c.canopy_pct != null ? `${c.canopy_pct.toFixed(1)}%` : "—"}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between px-3.5 py-2.5 text-xs text-white/50">
        <span>{format(d, "MMM d, yyyy")}</span>
        <span className="tabular-nums">{format(d, "HH:mm")}</span>
      </div>
    </motion.button>
  );
}
