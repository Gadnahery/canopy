alter table public.captures
  add column if not exists validation_label text,
  add column if not exists validation_confidence numeric(5,4);
