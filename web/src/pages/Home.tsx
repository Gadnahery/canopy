import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCaptures } from "../hooks/useCaptures";
import { useDevices } from "../hooks/useDevices";
import { isConfigured, imageUrl } from "../lib/supabase";
import DeviceStatus from "../components/DeviceStatus";
import StatCards from "../components/StatCards";
import TrendChart from "../components/TrendChart";
import CaptureCard from "../components/CaptureCard";
import CaptureDetail from "../components/CaptureDetail";
import { RefreshIcon, TreeIcon } from "../components/icons";
import type { Capture } from "../types";

export default function Home() {
  const { captures, reload } = useCaptures();
  const devices = useDevices();
  const [sel, setSel] = useState<Capture | null>(null);
  const latest = captures.find((c) => c.status === "done" && c.canopy_pct != null);
  const live = captures.some((c) => ["requested", "uploading", "uploaded", "processing"].includes(c.status));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10 md:hidden">
            <TreeIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text sm:text-2xl">CANOPIX</h1>
            <p className="text-sm text-text-secondary">Forest Canopy Analysis</p>
          </div>
        </div>
        <button onClick={reload} className="btn-ghost h-10 w-10 !px-0"><RefreshIcon className="h-5 w-5" /></button>
      </header>

      {!isConfigured && (
        <div className="card border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/90">
          Supabase isn't configured — set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
        </div>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Device Status</h2>
          <span className={`chip ${live ? "bg-amber-500/15 text-amber-300" : "bg-forest-500/15 text-forest-300"}`}>
            <span className={`h-1.5 w-1.5 rounded-full bg-current ${live ? "animate-pulse" : ""}`} />
            {live ? "Capturing…" : "Idle"}
          </span>
        </div>
        <DeviceStatus devices={devices} />
      </section>

      {/* hero latest + stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card relative overflow-hidden p-5 lg:col-span-1">
          <div className="text-[11px] uppercase tracking-wider text-text-secondary">Latest capture</div>
          {latest ? (
            <>
              <div className="mt-1 text-5xl font-bold tabular-nums text-primary">{latest.canopy_pct!.toFixed(1)}%</div>
              <div className="mt-1 text-xs text-text-secondary">{new Date(latest.created_at).toLocaleString()}</div>
              {imageUrl(latest.image_path) && (
                <img src={imageUrl(latest.image_path)!} alt="" className="mt-4 h-28 w-full rounded-2xl object-cover ring-1 ring-line" />
              )}
            </>
          ) : (
            <div className="mt-6 text-sm text-text-secondary">No measurements yet — press the device button to capture.</div>
          )}
        </motion.div>
        <div className="lg:col-span-2">
          <StatCards captures={captures} />
          <div className="card mt-4 p-4">
            <div className="mb-2 text-sm font-semibold text-text">Trend</div>
            <TrendChart captures={captures} height={180} />
          </div>
        </div>
      </div>

      {/* recent */}
      {captures.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Recent analyses</h2>
            <Link to="/history" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {captures.slice(0, 4).map((c, i) => <CaptureCard key={c.id} c={c} i={i} onClick={() => setSel(c)} />)}
          </div>
        </section>
      )}

      <AnimatePresence>{sel && <CaptureDetail capture={sel} onClose={() => setSel(null)} />}</AnimatePresence>
    </div>
  );
}
