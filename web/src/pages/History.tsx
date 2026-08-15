import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useCaptures } from "../hooks/useCaptures";
import CaptureCard from "../components/CaptureCard";
import CaptureDetail from "../components/CaptureDetail";
import type { Capture } from "../types";

type Filter = "all" | "done" | "error";

export default function History() {
  const { captures, loading } = useCaptures(300);
  const [sel, setSel] = useState<Capture | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(
    () => captures.filter((c) => (filter === "all" ? true : filter === "done" ? c.status === "done" : c.status === "error")),
    [captures, filter]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text sm:text-2xl">Capture History</h1>
          <p className="text-sm text-text-secondary">{captures.length} records</p>
        </div>
        <div className="flex gap-1 rounded-full border border-line bg-surface/60 p-1 text-xs">
          {(["all", "done", "error"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 font-medium capitalize transition ${filter === f ? "bg-primary/10 text-primary" : "text-text-secondary hover:text-text"}`}>
              {f}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="card p-16 text-center text-text-secondary">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="card p-16 text-center text-text-secondary">No captures{filter !== "all" ? ` (${filter})` : ""} yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((c, i) => <CaptureCard key={c.id} c={c} i={i} onClick={() => setSel(c)} />)}
        </div>
      )}

      <AnimatePresence>{sel && <CaptureDetail capture={sel} onClose={() => setSel(null)} />}</AnimatePresence>
    </div>
  );
}
