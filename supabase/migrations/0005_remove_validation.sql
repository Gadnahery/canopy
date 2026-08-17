alter table public.captures
  drop column if exists validation_label,
  drop column if exists validation_confidence;
