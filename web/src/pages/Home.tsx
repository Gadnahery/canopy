import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useCaptures } from "../hooks/useCaptures";
import { useDevices, isOnline } from "../hooks/useDevices";
import { isConfigured, imageUrl, supabase } from "../lib/supabase";
import CaptureDetail from "../components/CaptureDetail";
import TrendChart from "../components/TrendChart";
import { CameraIcon, CheckCircleIcon, CloudIcon, DeviceIcon, RefreshIcon, SpinnerIcon, TargetIcon, TreeIcon, LoadingDots } from "../components/icons";
import type { ComponentType, ReactNode } from "react";
import type { Capture } from "../types";

const activeStates = ["requested", "uploading", "uploaded", "processing"];
const value = (n: number | null | undefined) => n == null ? "--" : `${n.toFixed(1)}%`;

function density(n: number | null | undefined) {
  if (n == null) return { label: "Awaiting analysis", short: "Waiting", note: "A completed capture will appear here.", tone: "text-text-secondary" };
  if (n >= 70) return { label: "High Canopy Density", short: "High", note: "The area is predominantly covered by tree canopy.", tone: "text-primary" };
  if (n >= 40) return { label: "Moderate Canopy Density", short: "Moderate", note: "The area has balanced canopy and open-sky coverage.", tone: "text-warning" };
  return { label: "Low Canopy Density", short: "Low", note: "The area has more open sky than canopy cover.", tone: "text-error" };
}

function ProgressRing({ pct }: { pct: number | null | undefined }) {
  const progress = pct ?? 0;
  return <div className="grid h-44 w-44 place-items-center rounded-full" style={{ background: `conic-gradient(#2E7D32 ${progress * 3.6}deg, #E5EEE5 0deg)` }}><div className="grid h-[calc(100%-14px)] w-[calc(100%-14px)] place-items-center rounded-full bg-surface text-center"><div><div className="text-4xl font-bold text-primary">{value(pct)}</div><div className="mt-1 text-[11px] font-bold tracking-wide text-text">CANOPY COVER</div></div></div></div>;
}

function LiveViewHero({ latest, connected, live }: { latest: Capture | undefined; connected: boolean; live: boolean }) {
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const image = latest?.image_path ? imageUrl(latest.image_path) : null;

  async function handleTrigger() {
    setTriggering(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("captures")
        .insert({ device_id: "canopy-01", status: "requested" });
      if (err) throw err;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to trigger capture");
    } finally {
      setTimeout(() => setTriggering(false), 2000);
    }
  }

  return (
    <article className="card relative overflow-hidden bg-slate-950 text-white p-5 border-slate-800 shadow-xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Side: Live View Finder */}
        <div className="relative flex-1 aspect-[16/10] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner group min-h-[220px]">
          {image ? (
            <img src={image} alt="Live view" className={`h-full w-full object-cover transition duration-700 ${live ? "scale-[1.01]" : ""}`} />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              <CameraIcon className="h-12 w-12 stroke-[1.2]" />
            </div>
          )}
          
          {/* Rule of Thirds Gridlines */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-b border-white/30" />
            <div className="border-r border-white/30" />
            <div className="border-r border-white/30" />
            <div className="" />
          </div>

          {/* Central Aiming Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-white/50 rounded-full" />
            </div>
          </div>

          {/* Top Info Bar Overlay */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                connected 
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30" 
                  : "bg-slate-900/60 text-slate-400 border-slate-800"
              }`}>
                {connected && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />}
                {connected ? "LIVE" : "DEVICE OFFLINE"}
              </span>
              <span className="bg-slate-900/60 border border-slate-800 text-[9px] text-slate-300 font-mono px-2 py-0.5 rounded-md backdrop-blur-md">
                {latest ? new Date(latest.created_at).toLocaleTimeString() : "--:--:--"}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 text-[9px] text-slate-300 font-mono px-2 py-0.5 rounded-md backdrop-blur-md">
              <span>ISO 100</span>
              <span>•</span>
              <span>F/2.2</span>
              <span>•</span>
              <span>SVGA</span>
            </div>
          </div>

          {/* Bottom Info Bar Overlay */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-900/60 border border-slate-800 text-[9px] text-slate-300 font-mono px-2 py-0.5 rounded-md backdrop-blur-md">
              DEV: canopy-01
            </div>
            <div className="bg-slate-900/60 border border-slate-800 text-[9px] text-slate-300 font-mono px-2 py-0.5 rounded-md backdrop-blur-md">
              {latest ? `${latest.width || 800}x${latest.height || 600}` : "800x600"}
            </div>
          </div>

          {/* Processing overlay */}
          {live && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[1px] text-white">
              <SpinnerIcon className="h-10 w-10 animate-spin text-primary" />
              <span className="mt-2.5 text-xs font-semibold drop-shadow-md inline-flex items-center">
                Processing new capture<LoadingDots />
              </span>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (latest) {
                    await supabase
                      .from("captures")
                      .update({ status: "error", error: "Capture cancelled by user" })
                      .eq("id", latest.id);
                  }
                }}
                className="mt-3.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold transition pointer-events-auto"
              >
                Cancel Process
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Quick Stats & Trigger Actions */}
        <div className="flex flex-col justify-between w-full lg:w-80">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Field Monitor</h2>
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
            </div>
            
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              CANOPIX-CAM
              <span className="text-[9px] font-mono border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">V1.0</span>
            </h1>
            
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Wirelessly monitor canopy density, trigger ESP32-CAM captures, and run automated segmentation.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-slate-300">
              <div className="bg-slate-900/50 border border-slate-800 p-2.5 rounded-xl">
                <div className="text-[9px] text-slate-500 font-medium">LATEST COVER</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{value(latest?.canopy_pct)}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <div className="text-[9px] text-slate-500 font-medium">DEVICE STATUS</div>
                <div className="text-lg font-bold mt-0.5 text-slate-200">
                  {connected ? "Online" : "Offline"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <button
              onClick={handleTrigger}
              disabled={triggering || live || !connected}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl text-xs transition duration-200 shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              {triggering ? (
                <span className="inline-flex items-center">
                  Triggering Hardware<LoadingDots />
                </span>
              ) : live ? (
                <span className="inline-flex items-center">
                  Processing Capture<LoadingDots />
                </span>
              ) : !connected ? (
                <span>Device Offline (Capture Disabled)</span>
              ) : (
                <>
                  <CameraIcon className="h-4 w-4" />
                  Trigger Remote Capture
                </>
              )}
            </button>
            {error && <p className="text-center text-[10px] text-rose-400 font-medium">{error}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const { captures, reload } = useCaptures();
  const devices = useDevices();
  const [selected, setSelected] = useState<Capture | null>(null);
  const latest = captures[0];
  const live = latest && activeStates.includes(latest.status);
  const connected = devices.some(isOnline);
  const image = latest?.image_path ? imageUrl(latest.image_path) : null;
  const state = latest?.status === "invalid"
    ? { label: "Image rejected", short: "Invalid", note: latest.error ?? "Not a valid canopy image.", tone: "text-warning" }
    : live
      ? { label: <span className="inline-flex items-center">Processing image<LoadingDots /></span>, short: "Processing", note: "CLIP validation & canopy coverage calculation are running.", tone: "text-warning animate-pulse" }
      : density(latest?.canopy_pct);
  const completed = latest?.status === "done";

  return <div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="flex items-center gap-2 text-[22px] font-bold tracking-tight text-text">Welcome to CANOPIX <TreeIcon className="h-5 w-5 text-primary" /></h1><p className="mt-1 text-xs text-text-secondary">Smart analysis for accurate forest canopy measurement</p></div><button onClick={reload} className="btn-ghost text-xs" aria-label="Refresh data"><RefreshIcon className="h-4 w-4" />Refresh</button></header>
    {!isConfigured && <div className="card border-warning/30 bg-warning/10 p-4 text-sm text-text">Supabase is not configured. Add the environment variables to display live hardware data.</div>}

    <section className="card overflow-hidden p-0"><div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"><FlowStep Icon={DeviceIcon} title="DEVICE" result={connected ? "Connected" : "Offline"} done={connected} /><FlowStep Icon={CameraIcon} title="IMAGE RECEIVED" result={latest ? new Date(latest.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Waiting"} done={!!latest} /><FlowStep Icon={SpinnerIcon} title="PROCESSING" result={live ? <span className="inline-flex items-center">In progress<LoadingDots /></span> : completed ? "Completed" : "Waiting"} done={!live && completed} spinning={live} /><FlowStep Icon={CheckCircleIcon} title="ANALYSIS" result={completed ? "Complete" : "Pending"} done={completed} /></div></section>

    <LiveViewHero latest={latest} connected={connected} live={live} />


    <section className="grid gap-4 xl:grid-cols-[1.28fr_1fr_1.33fr]">
      <article className="card p-4">
        <Heading title="Latest capture" tag={latest ? "New" : undefined} />
        <div className="relative mt-3">
          {image ? (
            <>
              <img onClick={() => latest && setSelected(latest)} src={image} alt="Latest canopy image received from the device" className={`h-56 w-full cursor-pointer rounded-md object-cover ${live ? "opacity-60 blur-[1px]" : ""}`} />
              {live && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 rounded-md text-white backdrop-blur-[1px]">
                  <SpinnerIcon className="h-8 w-8 animate-spin text-white" />
                  <span className="mt-2 text-xs font-semibold drop-shadow-md inline-flex items-center">Processing image<LoadingDots /></span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (latest) {
                        await supabase
                          .from("captures")
                          .update({ status: "error", error: "Capture cancelled by user" })
                          .eq("id", latest.id);
                      }
                    }}
                    className="mt-3 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-semibold transition"
                  >
                    Cancel Process
                  </button>
                </div>
              )}
            </>
          ) : (
            <ImageEmpty label="Waiting for a hardware image capture" />
          )}
        </div>
        <p className="mt-3 text-[11px] text-text-secondary">{latest ? `${new Date(latest.created_at).toLocaleString()} | Image received from CANOPIX device` : "Images are captured by the physical CANOPIX hardware."}</p>
      </article>
      <article className="card flex flex-col items-center p-4 text-center"><Heading title="Analysis result" /><div className="mt-4"><ProgressRing pct={latest?.canopy_pct} /></div><div className="mt-3 w-full rounded-md border border-line bg-bg-light p-3 text-left"><div className={`font-semibold ${state.tone}`}>{state.label}</div><p className="mt-1 text-[11px] text-text-secondary">{state.note}</p></div></article>
      <article className="card p-4"><Heading title="Canopy visualization" /><div className="relative mt-3">{image ? <><img onClick={() => latest && setSelected(latest)} src={image} alt="Canopy visualization" className="h-56 w-full cursor-pointer rounded-md object-cover saturate-[1.4] contrast-110" /><div className="pointer-events-none absolute inset-0 rounded-md bg-primary/10 mix-blend-multiply" /></> : <ImageEmpty label="Visualization will appear after analysis" />}</div><div className="mt-3 flex gap-5 text-[11px] text-text-secondary"><span><i className="mr-1 inline-block h-3 w-3 rounded-sm bg-success align-middle" />Canopy {latest?.canopy_pct != null && `(${value(latest.canopy_pct)})`}</span><span><i className="mr-1 inline-block h-3 w-3 rounded-sm border border-line bg-bg-light align-middle" />Open Sky {latest?.canopy_pct != null && `(${value(100 - latest.canopy_pct)})`}</span></div></article>
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <article className="card p-4"><Heading title="Measurement summary" /><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric Icon={TreeIcon} label="Canopy Cover" result={value(latest?.canopy_pct)} /><Metric Icon={CloudIcon} label="Open Sky" result={value(latest?.canopy_pct == null ? null : 100 - latest.canopy_pct)} /><Metric Icon={TreeIcon} label="Density Status" result={state.short} /><Metric Icon={TargetIcon} label="Analysis Quality" result={completed ? "Good" : "Waiting"} /></div><div className="mt-3 rounded-md bg-bg-light px-3 py-2 text-[11px] text-success">Analysis {completed ? "completed successfully and synced with device." : "will update when the hardware sends a capture."}</div></article>
      <article className="card p-4"><div className="flex items-center justify-between"><Heading title="Recent analyses" /><Link to="/history" className="text-[11px] font-semibold text-primary hover:underline">View All</Link></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[360px] text-left text-[11px]"><thead className="border-b border-line bg-bg-light text-text-secondary"><tr><th className="px-2 py-2 font-medium">Date & Time</th><th className="px-2 py-2 font-medium">Canopy Cover</th><th className="px-2 py-2 font-medium">Status</th></tr></thead><tbody>{captures.slice(0, 5).map((capture) => <tr key={capture.id} className="border-b border-line/70 last:border-0"><td className="px-2 py-2 text-text-secondary">{new Date(capture.created_at).toLocaleString()}</td><td className="px-2 py-2 font-medium text-text">{value(capture.canopy_pct)}</td><td className={`px-2 py-2 font-medium ${capture.status === "done" ? "text-success" : "text-warning"}`}>{capture.status === "done" ? density(capture.canopy_pct).short : capture.status}</td></tr>)}{captures.length === 0 && <tr><td colSpan={3} className="px-2 py-8 text-center text-text-secondary">No analyses yet.</td></tr>}</tbody></table></div></article>
    </section>
    <section className="card p-5"><Heading title="Canopy cover over time" /><div className="mt-4"><TrendChart captures={captures} height={260} /></div></section>
    <AnimatePresence>{selected && <CaptureDetail capture={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
  </div>;
}

function Heading({ title, tag }: { title: string; tag?: string }) { return <div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wide text-text">{title}</h2>{tag && <span className="rounded-full bg-bg-light px-2 py-0.5 text-[11px] font-semibold text-success">{tag}</span>}</div>; }
function ImageEmpty({ label }: { label: string }) { return <div className="mt-3 grid h-56 place-items-center rounded-md border border-dashed border-line bg-bg-light px-6 text-center text-sm text-text-secondary">{label}</div>; }
function FlowStep({ Icon, title, result, done, spinning = false }: { Icon: ComponentType<{ className?: string }>; title: string; result: ReactNode; done: boolean; spinning?: boolean }) { return <div className="relative flex items-center gap-3 p-4 lg:after:absolute lg:after:right-0 lg:after:top-1/2 lg:after:-translate-y-1/2 lg:after:text-text-secondary lg:after:content-['>'] last:after:hidden"><span className={`grid h-9 w-9 place-items-center rounded-full border-2 ${done ? "border-success bg-bg-light text-success" : "border-line text-text-secondary"}`}><Icon className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`} /></span><div><div className="text-[10px] font-bold tracking-wide text-text">{title}</div><div className={done ? "text-xs font-semibold text-success" : "text-xs font-medium text-text-secondary"}>{result}</div></div></div>; }
function Metric({ Icon, label, result }: { Icon: ComponentType<{ className?: string }>; label: string; result: string }) { return <div className="rounded-md border border-line bg-surface p-2 text-center"><span className="grid mx-auto h-9 w-9 place-items-center rounded-full bg-bg-light text-primary"><Icon className="h-5 w-5" /></span><div className="mt-1.5 text-[10px] text-text-secondary">{label}</div><div className="mt-0.5 text-lg font-bold text-primary">{result}</div></div>; }

