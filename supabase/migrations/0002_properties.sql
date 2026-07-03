-- ============================================================
-- KonkerePlus — Migration 0002: Properties (Backlog Epic A / FR-PROP)
-- Run in Supabase → SQL Editor after 0001. Follows the foundation
-- convention: tenant_id on every row, RLS scoped by membership.
-- ============================================================

do $$ begin
  create type public.property_type as enum (
    'residential','commercial','mixed_use','industrial','warehouse',
    'retail','office','hotel','student_housing','short_stay','vacation'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.property_status as enum (
    'planning','under_construction','completed','active','inactive'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.properties (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  code       text not null,
  name       text not null,
  type       public.property_type   not null default 'residential',
  status     public.property_status not null default 'active',
  city       text,
  address    text,
  lat        numeric(9,6),
  lng        numeric(9,6),
  manager_id uuid references auth.users(id),
  notes      text,
  created_by uuid default auth.uid(),
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists idx_properties_tenant on public.properties(tenant_id, status);

drop trigger if exists trg_properties_updated on public.properties;
create trigger trg_properties_updated before update on public.properties
  for each row execute function public.set_updated_at();

alter table public.properties enable row level security;

-- Read: any member of the tenant (FR-PROP: managers/owners/accountants see properties).
drop policy if exists properties_select on public.properties;
create policy properties_select on public.properties for select
  using (tenant_id in (select public.user_tenant_ids()));

-- Write: company_admin or property_manager of the tenant (permission matrix §13.2).
drop policy if exists properties_write on public.properties;
create policy properties_write on public.properties for all
  using (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]))
  with check (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]));
