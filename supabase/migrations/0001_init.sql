-- ============================================================================
-- Canopy Densitometer — initial schema
-- Tables: devices, captures | Storage bucket: captures | Realtime enabled
-- NOTE: RLS policies below are PROTOTYPE-permissive (anon can read/insert/update).
--       See README "Hardening" before any real deployment.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- devices: one row per physical unit
-- ---------------------------------------------------------------------------
create table if not exists public.devices (
  id          text primary key,               -- e.g. 'canopy-01'
  name        text,
  location    text,
  last_seen   timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- captures: one row per photo / measurement
-- status lifecycle: requested -> uploaded -> processing -> done | error
-- ---------------------------------------------------------------------------
create table if not exists public.captures (
  id            uuid primary key default gen_random_uuid(),
  device_id     text references public.devices(id) on delete set null,
  status        text not null default 'requested',
  image_path    text,                          -- storage key inside 'captures' bucket
  canopy_pct    numeric(5,2),                  -- 0.00 - 100.00
  leaf_pixels   bigint,
  sky_pixels    bigint,
  total_pixels  bigint,
  width         int,
  height        int,
  method        text,                          -- e.g. 'otsu-blue'
  threshold     int,                           -- computed threshold used
  note          text,
  error         text,
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);

create index if not exists captures_device_created_idx
  on public.captures (device_id, created_at desc);
create index if not exists captures_status_idx
  on public.captures (status);

-- ---------------------------------------------------------------------------
-- Storage bucket for the JPEGs (public read so the web app can show thumbs)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('captures', 'captures', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Realtime: push capture changes to the web app
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.captures;

-- ---------------------------------------------------------------------------
-- RLS  (PROTOTYPE — tighten for production, see README)
-- ---------------------------------------------------------------------------
alter table public.devices  enable row level security;
alter table public.captures enable row level security;

-- devices: anyone may read; anon may upsert its own heartbeat
create policy "devices read"   on public.devices for select using (true);
create policy "devices insert" on public.devices for insert with check (true);
create policy "devices update" on public.devices for update using (true) with check (true);

-- captures: anon may read (web app), insert (main ESP32 request),
--           update (CAM sets image_path/status).
create policy "captures read"   on public.captures for select using (true);
create policy "captures insert" on public.captures for insert with check (true);
create policy "captures update" on public.captures for update using (true) with check (true);

-- storage: anon may read + write objects in the 'captures' bucket
create policy "captures obj read"   on storage.objects for select using (bucket_id = 'captures');
create policy "captures obj insert" on storage.objects for insert with check (bucket_id = 'captures');
create policy "captures obj update" on storage.objects for update using (bucket_id = 'captures') with check (bucket_id = 'captures');
