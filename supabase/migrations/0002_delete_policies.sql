-- ============================================================================
-- Allow deleting captures + their storage objects.
-- (Prototype-permissive, consistent with 0001. Tighten with the rest — see README.)
-- ============================================================================

create policy "captures delete" on public.captures
  for delete using (true);

create policy "captures obj delete" on storage.objects
  for delete using (bucket_id = 'captures');
