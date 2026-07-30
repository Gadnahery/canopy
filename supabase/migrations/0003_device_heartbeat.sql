-- ============================================================================
-- Device online status: each board calls device_heartbeat() periodically;
-- the web app treats a device as "online" if last_seen is recent.
-- ============================================================================

alter table public.devices add column if not exists kind text;   -- 'controller' | 'camera'

-- Upsert a heartbeat. security definer so anon can call it via RPC.
create or replace function public.device_heartbeat(p_id text, p_name text default null, p_kind text default null)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.devices (id, name, kind, last_seen)
  values (p_id, coalesce(p_name, p_id), p_kind, now())
  on conflict (id) do update
    set last_seen = now(),
        name = coalesce(excluded.name, public.devices.name),
        kind = coalesce(excluded.kind, public.devices.kind);
$$;

grant execute on function public.device_heartbeat(text, text, text) to anon;

-- Seed the two boards so they show up before their first heartbeat.
insert into public.devices (id, name, kind) values
  ('esp32-controller', 'ESP32 Controller', 'controller'),
  ('esp32-cam',        'ESP32-CAM',        'camera')
on conflict (id) do nothing;

-- expose devices changes to realtime
alter publication supabase_realtime add table public.devices;
