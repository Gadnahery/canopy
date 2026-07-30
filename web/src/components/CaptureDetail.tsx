import { useState } from "react";
import { motion } from "framer-motion";
import type { Capture } from "../types";
import { imageUrl, supabase, BUCKET } from "../lib/supabase";
import StatusBadge from "./StatusBadge";

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-line/70 py-2 text-sm">
      <span className="text-white/40">{k}</span>
      <span className="tabular-nums text-white/85">{v}</span>
    </div>
  );
}

export default function CaptureDetail({ capture, onClose }: { capture: Capture; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const url = imageUrl(capture.image_path);
  const d = new Date(capture.created_at);

  async function reprocess() {
    setBusy(true); setMsg(null);
    const { data, error } = await supabase.functions.invoke("process-capture", { body: { capture_id: capture.id } });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (data?.ok) setMsg(`Recomputed: ${data.capture.canopy_pct}%`);
    else setMsg(data?.error ?? "Failed");
  }
  async function remove() {
    setBusy(true); setMsg(null);
    if (capture.image_path) await supabase.storage.from(BUCKET).remove([capture.image_path]);
    const { error } = await supabase.from("captures").delete().eq("id", capture.id);
    setBusy(false);
    if (error) setMsg(error.message); else onClose();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="card w-full max-w-2xl overflow-hidden rounded-b-none sm:rounded-3xl" onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3"><h3 className="text-sm font-semibold text-white">Capture detail</h3><StatusBadge status={capture.status} /></div>
          <button onClick={onClose} className="rounded-xl px-2 py-1 text-white/40 hover:bg-white/5 hover:text-white">✕</button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div>
            {url ? <img src={url} alt="capture" className="w-full rounded-2xl ring-1 ring-line" />
                 : <div className="flex aspect-video items-center justify-center rounded-2xl bg-raised text-white/30">no image</div>}
            <div className="mt-4 text-center">
              <div className="text-[11px] uppercase tracking-wider text-white/40">Canopy cover</div>
              <div className="text-5xl font-bold tabular-nums text-forest-300">{capture.canopy_pct != null ? `${capture.canopy_pct.toFixed(1)}%` : "—"}</div>
            </div>
          </div>
          <div>
            <Row k="Date" v={d.toLocaleDateString()} />
            <Row k="Time" v={d.toLocaleTimeString()} />
            <Row k="Device" v={capture.device_id ?? "—"} />
            <Row k="Method" v={capture.method ?? "—"} />
            <Row k="Threshold" v={capture.threshold != null ? String(capture.threshold) : "—"} />
            <Row k="Leaf px" v={capture.leaf_pixels?.toLocaleString() ?? "—"} />
            <Row k="Sky px" v={capture.sky_pixels?.toLocaleString() ?? "—"} />
            <Row k="Resolution" v={capture.width && capture.height ? `${capture.width}×${capture.height}` : "—"} />
            {capture.error && <div className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{capture.error}</div>}

            <button onClick={reprocess} disabled={busy || !capture.image_path} className="btn-primary mt-4 w-full disabled:opacity-40">
              {busy ? "Working…" : "Reprocess image"}
            </button>
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)} disabled={busy}
                className="btn mt-2 w-full border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 disabled:opacity-40">
                Delete capture
              </button>
            ) : (
              <div className="mt-2 flex gap-2">
                <button onClick={remove} disabled={busy} className="btn flex-1 bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-40">{busy ? "Deleting…" : "Confirm delete"}</button>
                <button onClick={() => setConfirmDel(false)} disabled={busy} className="btn-ghost">Cancel</button>
              </div>
            )}
            {msg && <p className="mt-2 text-center text-xs text-white/40">{msg}</p>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
