import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useCaptures } from "../hooks/useCaptures";
import { useDevices, isOnline } from "../hooks/useDevices";
import { isConfigured, imageUrl } from "../lib/supabase";
import CaptureDetail from "../components/CaptureDetail";
import TrendChart from "../components/TrendChart";
import { RefreshIcon, TreeIcon } from "../components/icons";
import type { Capture } from "../types";

const activeStates = ["requested", "uploading", "uploaded", "processing"];

function density(value: number | null | undefined) {
  if (value == null) return { label: "Awaiting analysis", tone: "text-text-secondary", note: "A completed capture will appear here." };
  if (value >= 70) return { label: "High Canopy Density", tone: "text-primary", note: "The area is predominantly covered by tree canopy." };
  if (value >= 40) return { label: "Moderate Canopy Density", tone: "text-warning", note: "The area has a balanced canopy and open-sky coverage." };
  return { label: "Low Canopy Density", tone: "text-error", note: "The area has more open sky than canopy cover." };
}

function ProgressRing({ value }: { value: number | null | undefined }) {
  const pct = value ?? 0;
  return <div className="relative grid h-48 w-48 place-items-center rounded-full" style={{ background: `conic-gradient(#2E7D32 ${pct * 3.6}deg, #E5EEE5 0deg)` }}>
    <div className="grid h-[calc(100%-14px)] w-[calc(100%-14px)] place-items-center rounded-full bg-surface text-center">
      <div><div className="text-4xl font-bold tracking-tight text-primary">{value != null ? `${value.toFixed(1)}%` : "--"}</div><div className="mt-1 text-[11px] font-bold tracking-wider text-text-secondary">CANOPY COVER</div></div>
    </div>
  </div>;
}

export default function Home() {
  const { captures, reload } = useCaptures();
  const devices = useDevices();
  const [sel, setSel] = useState<Capture | null>(null);
  const latest = captures.find((c) => c.status === "done" && c.canopy_pct != null) ?? captures[0];
  const live = captures.some((c) => activeStates.includes(c.status));
  const connected = devices.some(isOnline);
  const state = density(latest?.canopy_pct);
  const image = latest?.image_path ? imageUrl(latest.image_path) : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-text">Welcome to CANOPIX <TreeIcon className="h-6 w-6 text-primary" /></h1><p className="mt-1 text-sm text-text-secondary">Smart analysis for accurate forest canopy measurement</p></div>
        <button onClick={reload} className="btn-ghost" aria-label="Refresh dashboard"><RefreshIcon className="h-5 w-5" />Refresh data</button>
      </header>

      {!isConfigured && <div className="card border-warning/30 bg-warning/10 p-4 text-sm text-text">Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to display live hardware data.</div>}

      <section className="card overflow-hidden p-0">
        <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <WorkflowStep icon="◉" title="DEVICE" value={connected ? "Connected" : "Offline"} complete={connected} />
          <WorkflowStep icon="▣" title="IMAGE RECEIVED" value={latest ? new Date(latest.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Waiting"} complete={!!latest} />
          <WorkflowStep icon={live ? "◌" : "◉"} title="PROCESSING" value={live ? "In progress" : latest?.status === "done" ? "Completed" : "Waiting"} complete={!live && latest?.status === "done"} />
          <WorkflowStep icon="✓" title="ANALYSIS" value={latest?.status === "done" ? "Complete" : "Pending"} complete={latest?.status === "done"} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="card p-4 sm:p-5 xl:col-span-4">
          <CardHeading title="Latest capture" badge={latest ? "New" : undefined} />
          {image ? <img onClick={() => latest && setSel(latest)} src={image} alt="Latest canopy capture" className="mt-4 h-64 w-full cursor-pointer rounded-xl object-cover" /> : <EmptyImage label="Waiting for a hardware image capture" />}
          <p className="mt-3 text-xs text-text-secondary">{latest ? `${new Date(latest.created_at).toLocaleString()} · Image received from CANOPIX device` : "The image is captured by the physical CANOPIX hardware."}</p>
        </article>

        <article className="card flex flex-col items-center p-4 text-center sm:p-5 xl:col-span-3"><CardHeading title="Analysis result" /><div className="mt-4"><ProgressRing value={latest?.canopy_pct} /></div><div className="mt-4 w-full rounded-xl border border-line bg-bg-light p-3 text-left"><div className={`font-semibold ${state.tone}`}>{state.label}</div><p className="mt-1 text-xs text-text-secondary">{state.note}</p></div></article>

        <article className="card p-4 sm:p-5 xl:col-span-5"><CardHeading title="Canopy visualization" /><div className="relative mt-4">{image ? <><img onClick={() => latest && setSel(latest)} src={image} alt="Processed canopy visualization" className="h-64 w-full cursor-pointer rounded-xl object-cover saturate-[1.35] contrast-110" /><div className="pointer-events-none absolute inset-0 rounded-xl bg-primary/10 mix-blend-multiply" /></> : <EmptyImage label="Processed visualization will appear after analysis" />}</div><div className="mt-3 flex gap-5 text-xs text-text-secondary"><span><i className="mr-1 inline-block h-3 w-3 rounded-sm bg-success align-middle" />Canopy {latest?.canopy_pct != null ? `(${latest.canopy_pct.toFixed(1)}%)` : ""}</span><span><i className="mr-1 inline-block h-3 w-3 rounded-sm border border-line bg-bg-light align-middle" />Open sky {latest?.canopy_pct != null ? `(${(100 - latest.canopy_pct).toFixed(1)}%)` : ""}</span></div></article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card p-5"><CardHeading title="Measurement summary" /><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Summary label="Canopy cover" value={latest?.canopy_pct != null ? `${latest.canopy_pct.toFixed(1)}%` : "--"} /><Summary label="Open sky" value={latest?.canopy_pct != null ? `${(100 - latest.canopy_pct).toFixed(1)}%` : "--"} /><Summary label="Density status" value={latest?.canopy_pct != null ? state.label.replace(" Canopy Density", "") : "--"} /><Summary label="Analysis quality" value={latest?.status === "done" ? "Good" : "Waiting"} /></div><div className="mt-4 rounded-lg bg-bg-light px-3 py-2 text-xs text-success">✓ {latest?.status === "done" ? "Analysis completed successfully and synced with device." : "The workflow will update automatically when the hardware sends a capture."}</div></article>
        <article className="card p-5"><div className="flex items-center justify-between"><CardHeading title="Recent analyses" /><Link to="/history" className="text-xs font-semibold text-primary hover:underline">View all</Link></div><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-line text-text-secondary"><tr><th className="pb-2 font-medium">Date & time</th><th className="pb-2 font-medium">Canopy cover</th><th className="pb-2 font-medium">Status</th></tr></thead><tbody>{captures.slice(0, 4).map((c) => <tr key={c.id} className="border-b border-line/70 last:border-0"><td className="py-2.5 text-text-secondary">{new Date(c.created_at).toLocaleString()}</td><td className="py-2.5 font-medium text-text">{c.canopy_pct != null ? `${c.canopy_pct.toFixed(1)}%` : "--"}</td><td className="py-2.5"><span className={c.status === "done" ? "text-success" : "text-warning"}>● {c.status === "done" ? density(c.canopy_pct).label.replace(" Canopy Density", "") : c.status}</span></td></tr>)}{captures.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-text-secondary">No analyses yet.</td></tr>}</tbody></table></div></article>
      </section>

      <section className="card p-5"><CardHeading title="Canopy cover over time" /><div className="mt-4"><TrendChart captures={captures} height={260} /></div></section>
      <AnimatePresence>{sel && <CaptureDetail capture={sel} onClose={() => setSel(null)} />}</AnimatePresence>
    </div>
  );
}

function CardHeading({ title, badge }: { title: string; badge?: string }) { return <div className="flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-wide text-text">{title}</h2>{badge && <span className="chip bg-bg-light text-success">{badge}</span>}</div>; }
function EmptyImage({ label }: { label: string }) { return <div className="mt-4 grid h-64 place-items-center rounded-xl border border-dashed border-line bg-bg-light p-6 text-center text-sm text-text-secondary">{label}</div>; }
function WorkflowStep({ icon, title, value, complete }: { icon: string; title: string; value: string; complete: boolean }) { return <div className="flex items-center gap-3 p-4"><span className={`grid h-10 w-10 place-items-center rounded-full border-2 text-xl ${complete ? "border-success bg-bg-light text-success" : "border-line bg-surface text-text-secondary"}`}>{icon}</span><div><div className="text-[11px] font-bold tracking-wide text-text">{title}</div><div className={complete ? "text-sm font-semibold text-success" : "text-sm font-medium text-text-secondary"}>{value}</div></div></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-line bg-surface p-3 text-center"><div className="text-[11px] font-medium text-text-secondary">{label}</div><div className="mt-1 text-base font-bold text-primary">{value}</div></div>; }
