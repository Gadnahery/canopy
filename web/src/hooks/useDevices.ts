import { useEffect, useId, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Device } from "../types";

const ONLINE_WINDOW_MS = 60_000; // seen within the last 60s => online

export function isOnline(d: Device): boolean {
  if (!d.last_seen) return false;
  return Date.now() - new Date(d.last_seen).getTime() < ONLINE_WINDOW_MS;
}

/** Devices + live status. Re-renders every 10s so "online" decays on its own. */
export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [, setTick] = useState(0);
  const channelId = useId();

  useEffect(() => {
    let active = true;
    const load = async () => {
      // only the two real boards (they carry a 'kind'); ignore legacy rows
      const { data } = await supabase.from("devices").select("*").not("kind", "is", null).order("kind", { ascending: false });
      if (active && data) setDevices(data as Device[]);
    };
    load();

    const channel = supabase
      .channel(`devices-live-${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, load)
      .subscribe();

    const poll = setInterval(load, 15_000);           // refresh last_seen
    const tick = setInterval(() => setTick((t) => t + 1), 10_000); // decay online state
    return () => {
      active = false;
      supabase.removeChannel(channel);
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [channelId]);

  return devices;
}
