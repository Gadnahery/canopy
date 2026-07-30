import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Capture } from "../types";

/**
 * Loads recent captures and keeps them live via Supabase Realtime.
 * New rows appear at the top; updates (status -> done) patch in place.
 */
export function useCaptures(limit = 100) {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("captures")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) setError(error.message);
    else setCaptures((data ?? []) as Capture[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("captures-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "captures" },
        (payload) => {
          setCaptures((prev) => {
            const row = payload.new as Capture;
            if (payload.eventType === "INSERT") return [row, ...prev].slice(0, limit);
            if (payload.eventType === "UPDATE")
              return prev.map((c) => (c.id === row.id ? row : c));
            if (payload.eventType === "DELETE")
              return prev.filter((c) => c.id !== (payload.old as Capture).id);
            return prev;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, limit]);

  return { captures, loading, error, reload: load };
}
