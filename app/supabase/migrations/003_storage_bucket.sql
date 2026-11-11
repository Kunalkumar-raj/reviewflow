-- ReviewFlow Migration 003: storage bucket for client logos
-- Run AFTER 002.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-logos', 'client-logos', true, 2097152,
  array['image/png','image/jpeg','image/webp','image/svg+xml']
)
on conflict (id) do nothing;

-- Public can READ logos (they appear on public review pages)
drop policy if exists "Logos are publicly readable" on storage.objects;
create policy "Logos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'client-logos');

-- Only super_admin can upload / update / delete logos
drop policy if exists "Only super admin can upload logos" on storage.objects;
create policy "Only super admin can upload logos"
  on storage.objects for insert
  with check (bucket_id = 'client-logos' and public.is_super_admin());

drop policy if exists "Only super admin can update logos" on storage.objects;
create policy "Only super admin can update logos"
  on storage.objects for update
  using (bucket_id = 'client-logos' and public.is_super_admin());

drop policy if exists "Only super admin can delete logos" on storage.objects;
create policy "Only super admin can delete logos"
  on storage.objects for delete
  using (bucket_id = 'client-logos' and public.is_super_admin());
