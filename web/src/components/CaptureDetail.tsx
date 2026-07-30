import { useState } from "react";
import type { Capture } from "../types";
import { imageUrl, supabase, BUCKET } from "../lib/supabase";
import StatusBadge from "./StatusBadge";

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-2 text-sm">
      <span className="text-slate-400">{k}</span>
      <span className="tabular-nums text-slate-200">{v}</span>
    </div>
  );
}

export default function CaptureDetail({
  capture,
  onClose,
}: {
  capture: Capture;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const url = imageUrl(capture.image_path);

  async function remove() {
    setBusy(true);
    setMsg(null);
    if (capture.image_path) {
      await supabase.storage.from(BUCKET).remove([capture.image_path]);
    }
    const { error } = await supabase.from("captures").delete().eq("id", capture.id);
    setBusy(false);
    if (error) setMsg(error.message);
    else onClose(); // realtime DELETE event removes it from the list
  }

  async function reprocess() {
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.functions.invoke("process-capture", {
      body: { capture_id: capture.id },
    });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (data?.ok) setMsg(`Recomputed: ${data.capture.canopy_pct}%`);
    else setMsg(data?.error ?? "Failed");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Capture detail</h3>
            <StatusBadge status={capture.status} />
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/5 hover:text-white">✕</button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div>
            {url ? (
              <img src={url} alt="capture" className="w-full rounded-xl ring-1 ring-white/10" />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl bg-ink-700 text-slate-500">
                no image
              </div>
            )}
            <div className="mt-4 text-center">
              <div className="text-xs uppercase tracking-wider text-slate-400">Canopy cover</div>
              <div className="text-5xl font-bold text-canopy-400 tabular-nums">
                {capture.canopy_pct != null ? `${capture.canopy_pct.toFixed(1)}%` : "—"}
              </div>
            </div>
          </div>

          <div>
            <Row k="Device" v={capture.device_id ?? "—"} />
            <Row k="Method" v={capture.method ?? "—"} />
            <Row k="Threshold" v={capture.threshold != null ? String(capture.threshold) : "—"} />
            <Row k="Leaf pixels" v={capture.leaf_pixels?.toLocaleString() ?? "—"} />
            <Row k="Sky pixels" v={capture.sky_pixels?.toLocaleString() ?? "—"} />
            <Row k="Resolution" v={capture.width && capture.height ? `${capture.width}×${capture.height}` : "—"} />
            <Row k="Captured" v={new Date(capture.created_at).toLocaleString()} />
            <Row k="Processed" v={capture.processed_at ? new Date(capture.processed_at).toLocaleString() : "—"} />
            {capture.error && (
              <div className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{capture.error}</div>
            )}

            <button
              onClick={reprocess}
              disabled={busy || !capture.image_path}
              className="mt-4 w-full rounded-xl bg-canopy-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-canopy-500 disabled:opacity-40"
            >
              {busy ? "Working…" : "Reprocess image"}
            </button>

            {!confirmDel ? (
              <button
                onClick={() => setConfirmDel(true)}
                disabled={busy}
                className="mt-2 w-full rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-40"
              >
                Delete capture
              </button>
            ) : (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={remove}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-40"
                >
                  {busy ? "Deleting…" : "Confirm delete"}
                </button>
                <button
                  onClick={() => setConfirmDel(false)}
                  disabled={busy}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            )}
            {msg && <p className="mt-2 text-center text-xs text-slate-400">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
