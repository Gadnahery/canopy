import { formatDistanceToNow } from "date-fns";
import type { Capture } from "../types";
import { imageUrl } from "../lib/supabase";
import StatusBadge from "./StatusBadge";

export default function HistoryTable({
  captures,
  onSelect,
}: {
  captures: Capture[];
  onSelect: (c: Capture) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Capture history</h2>
        <span className="text-xs text-slate-500">{captures.length} records</span>
      </div>
      <div className="max-h-[560px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-ink-800/95 text-left text-xs uppercase tracking-wider text-slate-500 backdrop-blur">
            <tr>
              <th className="px-5 py-3 font-medium">Preview</th>
              <th className="px-3 py-3 font-medium">Canopy</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Device</th>
              <th className="px-5 py-3 font-medium text-right">When</th>
            </tr>
          </thead>
          <tbody>
            {captures.map((c) => {
              const url = imageUrl(c.image_path);
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="cursor-pointer border-t border-white/5 transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3">
                    {url ? (
                      <img src={url} alt="" className="h-11 w-16 rounded-md object-cover ring-1 ring-white/10" />
                    ) : (
                      <div className="h-11 w-16 rounded-md bg-ink-700" />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-lg font-semibold tabular-nums text-white">
                      {c.canopy_pct != null ? `${c.canopy_pct.toFixed(1)}%` : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-3 text-slate-400">{c.device_id ?? "—"}</td>
                  <td className="px-5 py-3 text-right text-slate-400">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </td>
                </tr>
              );
            })}
            {captures.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-slate-500">
                  No captures yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
