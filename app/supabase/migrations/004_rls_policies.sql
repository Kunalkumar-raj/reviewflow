-- ReviewFlow Migration 004: Row Level Security on every table
-- Run AFTER 003. After this, verify in Supabase: Authentication > Policies.

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.scan_events enable row level security;
alter table public.click_events enable row level security;
alter table public.feedback enable row level security;

-- profiles: users read their own row; super_admin reads all. No app-side role edits
-- (the prevent_role_change trigger from 001 is the second layer).
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_super_admin());

drop policy if exists "Update own profile name only" on public.profiles;
create policy "Update own profile name only" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- clients: NO direct public select on the table at all.
-- Public pages read the public_clients VIEW (migration 002) instead.
-- Only super_admin can select/insert/update/delete here.
drop policy if exists "Super admin full access to clients" on public.clients;
create policy "Super admin full access to clients" on public.clients
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- scan_events / click_events: anyone may INSERT a valid event for an ACTIVE client
-- (the API routes in Phase 6 validate + rate-limit + dedupe before inserting).
-- Nobody except super_admin may read them.
drop policy if exists "Public can log a scan" on public.scan_events;
create policy "Public can log a scan" on public.scan_events
  for insert with check (
    exists (select 1 from public.clients c where c.id = client_id and c.is_active = true)
  );

drop policy if exists "Super admin reads scans" on public.scan_events;
create policy "Super admin reads scans" on public.scan_events
  for select using (public.is_super_admin());

drop policy if exists "Public can log a click" on public.click_events;
create policy "Public can log a click" on public.click_events
  for insert with check (
    exists (select 1 from public.clients c where c.id = client_id and c.is_active = true)
  );

drop policy if exists "Super admin reads clicks" on public.click_events;
create policy "Super admin reads clicks" on public.click_events
  for select using (public.is_super_admin());

-- feedback: anyone may submit for an active client; only super_admin reads.
drop policy if exists "Public can submit feedback" on public.feedback;
create policy "Public can submit feedback" on public.feedback
  for insert with check (
    exists (select 1 from public.clients c where c.id = client_id and c.is_active = true)
  );

drop policy if exists "Super admin reads feedback" on public.feedback;
create policy "Super admin reads feedback" on public.feedback
  for select using (public.is_super_admin());
