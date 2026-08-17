// ============================================================================
// process-capture  → Supabase Edge Function (Deno)
//
// Input  (POST JSON), either:
//   { "device_id": "canopy-01", "image_path": "canopy-01/1699.jpg", "note"?: "" }
//        -> creates a fresh captures row for a just-uploaded image, then processes.
//   { "capture_id": "<uuid>" }
//        -> processes an existing row that already has image_path set.
// Work   : download JPEG from Storage -> resize -> Otsu segmentation on the
//          blue channel (standard gap-fraction approach) -> canopy cover %.
// Output : updates the captures row (status 'done'/'error') and returns JSON
//          including canopy_pct (the ESP32-CAM reads it straight off the response).
//
//   Canopy Cover (%) = leaf_pixels / total_pixels * 100
//   (leaf/canopy = darker pixels below the Otsu threshold; sky = brighter)
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode, Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "captures";
const MAX_WIDTH = 640; // downscale for speed; canopy ratio is scale-invariant

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function otsu(hist: number[], total: number): number {
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVar = 0;
  let threshold = 0;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) { maxVar = between; threshold = t; }
  }
  return threshold;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const db = createClient(SUPABASE_URL, SERVICE_KEY);
  let captureId: string | undefined;

  try {
    const body = await req.json();

    // Mode A: fresh upload from the CAM -> create the row here.
    // Mode B: reprocess an existing row (e.g. web "reprocess" button).
    let imagePath: string;
    if (body.capture_id) {
      captureId = body.capture_id;
      const { data: cap, error: selErr } = await db
        .from("captures").select("id, image_path").eq("id", captureId).single();
      if (selErr) throw selErr;
      if (!cap?.image_path) throw new Error("capture has no image_path");
      imagePath = cap.image_path;
    } else if (body.image_path) {
      imagePath = body.image_path;
      const { data: created, error: insErr } = await db.from("captures").insert({
        device_id: body.device_id ?? null,
        image_path: imagePath,
        note: body.note ?? null,
        status: "processing",
      }).select("id").single();
      if (insErr) throw insErr;
      captureId = created.id;
    } else {
      throw new Error("provide capture_id, or device_id + image_path");
    }

    await db.from("captures").update({ status: "processing" }).eq("id", captureId);

    // Download the JPEG from Storage
    const { data: blob, error: dlErr } = await db.storage.from(BUCKET).download(imagePath);
    if (dlErr) throw dlErr;
    const bytes = new Uint8Array(await blob.arrayBuffer());

    // Decode + resize
    const decoded = await decode(bytes);
    const img = decoded instanceof Image ? decoded : decoded.frames[0];
    if (img.width > MAX_WIDTH) img.resize(MAX_WIDTH, Image.RESIZE_AUTO);
    const { width, height } = img;

    // Histogram of the blue channel; sky is bright-blue, canopy is dark
    const hist = new Array(256).fill(0);
    const px = img.bitmap; // RGBA, 4 bytes per pixel
    const total = width * height;
    for (let i = 0; i < px.length; i += 4) hist[px[i + 2]]++; // blue = offset 2

    const threshold = otsu(hist, total);

    let leaf = 0;
    for (let b = 0; b <= threshold; b++) leaf += hist[b]; // <= threshold => canopy
    const sky = total - leaf;
    const canopyPct = Math.round((leaf / total) * 10000) / 100;

    const { data: updated, error: upErr } = await db.from("captures").update({
      status: "done",
      canopy_pct: canopyPct,
      leaf_pixels: leaf,
      sky_pixels: sky,
      total_pixels: total,
      width, height,
      method: "clip+otsu-blue",
      threshold,
      error: null,
      processed_at: new Date().toISOString(),
    }).eq("id", captureId).select().single();
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ok: true, capture: updated }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (captureId) {
      await db.from("captures").update({ status: "error", error: message }).eq("id", captureId);
    }
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
