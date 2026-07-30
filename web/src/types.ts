export type CaptureStatus =
  | "requested" | "uploading" | "uploaded" | "processing" | "done" | "error";

export interface Capture {
  id: string;
  device_id: string | null;
  status: CaptureStatus;
  image_path: string | null;
  canopy_pct: number | null;
  leaf_pixels: number | null;
  sky_pixels: number | null;
  total_pixels: number | null;
  width: number | null;
  height: number | null;
  method: string | null;
  threshold: number | null;
  note: string | null;
  error: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface Device {
  id: string;
  name: string | null;
  kind: string | null;        // 'controller' | 'camera'
  location: string | null;
  last_seen: string | null;
  created_at: string;
}
