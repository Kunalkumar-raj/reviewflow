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
