-- ============================================================
-- KonkerePlus — Migration 0001: multi-tenant foundation + IAM
-- Run in Supabase → SQL Editor (or `supabase db push`).
-- Establishes tenants, profiles, memberships (RBAC), and the
-- row-level-security helpers that scope EVERY future table by tenant.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Roles (workbook §4 / §13) ----------
do $$ begin
  create type public.app_role as enum (
    'company_admin','property_manager','construction_pm','owner',
    'tenant','legal','lawyer','contractor','accountant','receptionist','vendor'
  );
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- tenants ----------
create table if not exists public.tenants (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  base_currency char(3) not null default 'NGN',
  status        text not null default 'active' check (status in ('active','suspended')),
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists trg_tenants_updated on public.tenants;
create trigger trg_tenants_updated before update on public.tenants
  for each row execute function public.set_updated_at();

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- memberships (user ↔ tenant ↔ role) ----------
create table if not exists public.memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  role       public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, tenant_id)
);
create index if not exists idx_memberships_user   on public.memberships(user_id);
create index if not exists idx_memberships_tenant on public.memberships(tenant_id);

-- ============================================================
-- RLS helpers (SECURITY DEFINER to avoid policy recursion)
-- ============================================================

-- Tenants the current user belongs to.
create or replace function public.user_tenant_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select tenant_id from public.memberships where user_id = auth.uid();
$$;

-- Does the caller hold one of `roles` in `tenant`?
create or replace function public.has_role(tenant uuid, roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and tenant_id = tenant and role = any(roles)
  );
$$;

-- Onboarding: create a tenant and make the caller its company_admin.
create or replace function public.create_tenant(tenant_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.tenants (name) values (tenant_name) returning id into new_id;
  insert into public.memberships (user_id, tenant_id, role)
  values (auth.uid(), new_id, 'company_admin');
  return new_id;
end $$;

-- ============================================================
-- Row-level security
-- ============================================================
alter table public.tenants     enable row level security;
alter table public.profiles    enable row level security;
alter table public.memberships enable row level security;

-- tenants: visible to their members; editable by company_admin.
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants for select
  using (id in (select public.user_tenant_ids()));
drop policy if exists tenants_update on public.tenants;
create policy tenants_update on public.tenants for update
  using (public.has_role(id, array['company_admin']::public.app_role[]));

-- profiles: a user manages their own; tenant-mates can read.
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_tenant_read on public.profiles;
create policy profiles_tenant_read on public.profiles for select
  using (id in (
    select m.user_id from public.memberships m
    where m.tenant_id in (select public.user_tenant_ids())
  ));

-- memberships: a user sees their own; company_admins manage their tenant's.
drop policy if exists memberships_self on public.memberships;
create policy memberships_self on public.memberships for select
  using (user_id = auth.uid());
drop policy if exists memberships_admin_read on public.memberships;
create policy memberships_admin_read on public.memberships for select
  using (public.has_role(tenant_id, array['company_admin']::public.app_role[]));
drop policy if exists memberships_admin_write on public.memberships;
create policy memberships_admin_write on public.memberships for all
  using (public.has_role(tenant_id, array['company_admin']::public.app_role[]))
  with check (public.has_role(tenant_id, array['company_admin']::public.app_role[]));

-- ============================================================
-- CONVENTION for every future business table (properties, units, …):
--   tenant_id uuid not null references public.tenants(id),
--   enable RLS, and add:
--     using     (tenant_id in (select public.user_tenant_ids()))
--     with check(tenant_id in (select public.user_tenant_ids()))
--   plus role-scoped write policies via public.has_role(...).
-- ============================================================
