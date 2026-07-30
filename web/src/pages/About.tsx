import { motion } from "framer-motion";
import { TreeIcon } from "../components/icons";

const steps = [
  { n: 1, t: "Point & press", d: "Aim the device at the canopy and press the button on the ESP32." },
  { n: 2, t: "Capture", d: "The ESP32-CAM wakes up, takes a photo and uploads it over WiFi." },
  { n: 3, t: "Analyse", d: "A Supabase Edge Function segments sky vs leaves (Otsu on the blue channel)." },
  { n: 4, t: "Read", d: "Canopy cover % shows on the LCD and is logged here with the image." },
];

const stack = ["ESP32", "ESP32-CAM", "Supabase", "Edge Functions", "React", "Vite", "Tailwind", "PWA"];

export default function About() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-500/15 text-forest-400 ring-1 ring-forest-500/25">
          <TreeIcon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">About</h1>
          <p className="text-sm text-white/40">Canopy Densitometer</p>
        </div>
      </header>

      <div className="card p-5">
        <p className="text-sm leading-relaxed text-white/70">
          A two-board IoT device that measures <span className="text-forest-300">tree canopy cover</span> — the
          fraction of sky blocked by leaves. An ESP32 handles the button and LCD; a standalone ESP32-CAM takes the
          photo and uploads it; the cloud does the image analysis and returns a percentage.
        </p>
        <div className="mt-4 rounded-2xl bg-raised/60 p-4 text-center font-mono text-sm text-forest-200">
          Canopy % = leaf pixels ÷ total pixels × 100
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((s, i) => (
          <motion.div key={s.n} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-500/15 text-sm font-semibold text-forest-300">{s.n}</span>
              <span className="font-semibold text-white">{s.t}</span>
            </div>
            <p className="mt-2 text-sm text-white/50">{s.d}</p>
          </motion.div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-white/80">Built with</h2>
        <div className="flex flex-wrap gap-2">
          {stack.map((s) => <span key={s} className="chip bg-white/5 text-white/60">{s}</span>)}
        </div>
      </div>

      <p className="text-center text-xs text-white/30">Install this app: use “Add to Home Screen” for a full-screen PWA.</p>
    </div>
  );
}
