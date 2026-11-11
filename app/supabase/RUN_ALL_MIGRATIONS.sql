-- ReviewFlow Migration 001: profiles + clients
-- Run in Supabase Dashboard > SQL Editor, in order 001 -> 004.
-- Safe to run once on a fresh project.

create extension if not exists pgcrypto;

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'client' check (role in ('super_admin', 'client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nobody can change their own role (prevents self-promotion to super_admin)
create or replace function public.prevent_role_change()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    -- Only allow role change when there is no user JWT (i.e. SQL Editor / service role)
    if auth.uid() is not null then
      raise exception 'Role cannot be changed from the app';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- Auto-create a profile row (role = client) when a user is created in Auth.
-- The Super Admin role is assigned MANUALLY afterwards (see Phase 1 guide).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current logged-in user a super_admin? Used by all RLS policies.
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- ============ clients (one row = one business) ============
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  owner_name text,
  email text,
  phone text,
  address text,
  category text,
  website text,
  google_review_url text not null check (google_review_url like 'https://%'),
  logo_url text,
  welcome_message text not null default 'Thank you for visiting us! Your feedback helps us grow.',
  is_active boolean not null default true,
  qr_version integer not null default 1,
  last_qr_generated_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_is_active on public.clients(is_active);
create index if not exists idx_clients_created_at on public.clients(created_at desc);
create index if not exists idx_clients_business_name on public.clients(business_name);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.touch_updated_at();
-- ReviewFlow Migration 002: scan_events + click_events + feedback + public view
-- Run AFTER 001.

create table if not exists public.scan_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source text not null default 'qr' check (source in ('qr', 'direct_link', 'unknown')),
  user_agent text,
  ip_hash text,
  session_key text,
  created_at timestamptz not null default now()
);
create index if not exists idx_scan_events_client on public.scan_events(client_id);
create index if not exists idx_scan_events_created on public.scan_events(created_at desc);
create index if not exists idx_scan_events_dedupe on public.scan_events(client_id, session_key, created_at desc);

create table if not exists public.click_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_agent text,
  ip_hash text,
  session_key text,
  created_at timestamptz not null default now()
);
create index if not exists idx_click_events_client on public.click_events(client_id);
create index if not exists idx_click_events_created on public.click_events(created_at desc);
create index if not exists idx_click_events_dedupe on public.click_events(client_id, session_key, created_at desc);

-- Optional neutral feedback. Shown to EVERY visitor equally. Never a gate.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists idx_feedback_client on public.feedback(client_id);

-- Public-safe view: ONLY these columns can ever be read by the public.
-- email / phone / address are deliberately NOT in this view.
create or replace view public.public_clients as
  select id, business_name, slug, category, website, google_review_url,
         logo_url, welcome_message, is_active
  from public.clients
  where is_active = true;

grant select on public.public_clients to anon, authenticated;
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
-- ReviewFlow Migration 005: secure tracking functions for Phase 6
-- Run AFTER 004 in Supabase SQL Editor (one time).
--
-- Why functions instead of direct inserts from the browser?
-- Anonymous visitors may INSERT events, but they may NOT read scan_events
-- (RLS, migration 004) — so the browser cannot check "did I already log
-- this scan?" These SECURITY DEFINER functions do the duplicate check
-- INSIDE the database and only return true/false. No event data leaks.

-- ============ log_scan_event ============
-- Returns TRUE when a row was inserted, FALSE when skipped
-- (inactive/unknown client, duplicate within 30 minutes, or abuse cap).
create or replace function public.log_scan_event(
  p_client_id uuid,
  p_source text,
  p_user_agent text,
  p_ip_hash text,
  p_session_key text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only active clients can be tracked.
  if not exists (
    select 1 from public.clients
    where id = p_client_id and is_active = true
  ) then
    return false;
  end if;

  -- Dedupe: same browser session + same client within 30 minutes = 1 scan.
  if p_session_key is not null and exists (
    select 1 from public.scan_events
    where client_id = p_client_id
      and session_key = p_session_key
      and created_at > now() - interval '30 minutes'
  ) then
    return false;
  end if;

  -- Basic abuse cap: max 30 scans per IP-hash per client per hour.
  if p_ip_hash is not null and (
    select count(*) from public.scan_events
    where client_id = p_client_id
      and ip_hash = p_ip_hash
      and created_at > now() - interval '1 hour'
  ) >= 30 then
    return false;
  end if;

  insert into public.scan_events (client_id, source, user_agent, ip_hash, session_key)
  values (
    p_client_id,
    case when p_source in ('qr', 'direct_link') then p_source else 'unknown' end,
    left(coalesce(p_user_agent, ''), 300),
    p_ip_hash,
    p_session_key
  );
  return true;
end;
$$;

revoke all on function public.log_scan_event(uuid, text, text, text, text) from public;
grant execute on function public.log_scan_event(uuid, text, text, text, text) to anon, authenticated;

-- ============ log_click_event ============
-- Same idea, with a short 30-second dedupe window (double-tap protection).
create or replace function public.log_click_event(
  p_client_id uuid,
  p_user_agent text,
  p_ip_hash text,
  p_session_key text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.clients
    where id = p_client_id and is_active = true
  ) then
    return false;
  end if;

  if p_session_key is not null and exists (
    select 1 from public.click_events
    where client_id = p_client_id
      and session_key = p_session_key
      and created_at > now() - interval '30 seconds'
  ) then
    return false;
  end if;

  if p_ip_hash is not null and (
    select count(*) from public.click_events
    where client_id = p_client_id
      and ip_hash = p_ip_hash
      and created_at > now() - interval '1 hour'
  ) >= 30 then
    return false;
  end if;

  insert into public.click_events (client_id, user_agent, ip_hash, session_key)
  values (
    p_client_id,
    left(coalesce(p_user_agent, ''), 300),
    p_ip_hash,
    p_session_key
  );
  return true;
end;
$$;

revoke all on function public.log_click_event(uuid, text, text, text) from public;
grant execute on function public.log_click_event(uuid, text, text, text) to anon, authenticated;
