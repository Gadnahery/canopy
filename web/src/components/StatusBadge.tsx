import type { CaptureStatus } from "../types";

const MAP: Record<CaptureStatus, { label: string; cls: string }> = {
  requested:  { label: "Requested",  cls: "bg-slate-500/15 text-slate-300" },
  uploaded:   { label: "Uploaded",   cls: "bg-sky-500/15 text-sky-300" },
  processing: { label: "Processing", cls: "bg-amber-500/15 text-amber-300" },
  done:       { label: "Done",       cls: "bg-canopy-500/15 text-canopy-300" },
  error:      { label: "Error",      cls: "bg-rose-500/15 text-rose-300" },
};

export default function StatusBadge({ status }: { status: CaptureStatus }) {
  const s = MAP[status] ?? MAP.requested;
  return (
    <span className={`chip ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
