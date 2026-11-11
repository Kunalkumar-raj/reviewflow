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
