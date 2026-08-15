import type { CaptureStatus } from "../types";

const MAP: Record<CaptureStatus, { label: string; cls: string }> = {
  requested:  { label: "Requested",  cls: "bg-surface text-text-secondary" },
  uploading:  { label: "Uploading",  cls: "bg-primary/10 text-primary" },
  uploaded:   { label: "Uploaded",   cls: "bg-primary/10 text-primary" },
  processing: { label: "Processing", cls: "bg-warning/10 text-warning" },
  done:       { label: "Done",       cls: "bg-primary/10 text-primary" },
  error:      { label: "Error",      cls: "bg-error/10 text-error" },
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
