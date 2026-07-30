import { useState } from "react";
import { useCaptures } from "./hooks/useCaptures";
import StatCards from "./components/StatCards";
import TrendChart from "./components/TrendChart";
import HistoryTable from "./components/HistoryTable";
import CaptureDetail from "./components/CaptureDetail";
import { isConfigured } from "./lib/supabase";
import type { Capture } from "./types";

export default function App() {
  const { captures, loading, error, reload } = useCaptures();
  const [selected, setSelected] = useState<Capture | null>(null);
  const live = captures.some((c) => c.status === "processing" || c.status === "uploaded");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-canopy-500/15 text-2xl ring-1 ring-canopy-500/25">
            🌳
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Canopy Densitometer</h1>
            <p className="text-sm text-slate-400">Live tree-canopy cover measurements</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`chip ${live ? "bg-amber-500/15 text-amber-300" : "bg-canopy-500/15 text-canopy-300"}`}>
            <span className={`h-1.5 w-1.5 rounded-full bg-current ${live ? "animate-pulse" : ""}`} />
            {live ? "Capture in progress" : "Idle · listening"}
          </span>
          <button
            onClick={reload}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
          >
            Refresh
          </button>
        </div>
      </header>

      {!isConfigured && (
        <div className="mb-6 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Supabase isn't configured yet — copy <code>.env.example</code> to{" "}
          <code>.env.local</code> and set <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code>, then restart <code>npm run dev</code>.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <StatCards captures={captures} />
        <TrendChart captures={captures} />
        {loading ? (
          <div className="card p-16 text-center text-slate-500">Loading…</div>
        ) : (
          <HistoryTable captures={captures} onSelect={setSelected} />
        )}
      </div>

      <footer className="mt-10 text-center text-xs text-slate-600">
        ESP32-CAM · Supabase Edge Functions · Otsu sky/leaf segmentation
      </footer>

      {selected && <CaptureDetail capture={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
