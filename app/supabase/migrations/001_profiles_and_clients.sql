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
