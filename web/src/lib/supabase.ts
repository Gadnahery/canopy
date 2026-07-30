import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isConfigured = Boolean(url && anon);
if (!isConfigured) {
  // Surfaced clearly instead of a cryptic runtime crash later.
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — see .env.example");
}

// Fall back to harmless placeholders so the UI still renders (with an error
// banner) instead of white-screening when env vars aren't set yet.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anon || "placeholder-anon-key"
);
export const BUCKET = "captures";

/** Public URL for a stored capture image (bucket is public). */
export function imageUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
