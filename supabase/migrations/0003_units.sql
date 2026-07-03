-- ============================================================
-- KonkerePlus — Migration 0003: Units (Epic A cont. / FR-UNIT)
-- Run in Supabase → SQL Editor after 0002. Units belong to a
-- property; money stored as integer minor units (kobo) per §11.1.
-- ============================================================

do $$ begin
  create type public.unit_status as enum (
    'available','reserved','occupied','notice','vacant','maintenance'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.units (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants(id)    on delete cascade,
  property_id          uuid not null references public.properties(id) on delete cascade,
  unit_number          text not null,
  floor                int,
  bedrooms             int  not null default 0,
  bathrooms            int  not null default 0,
  sq_ft                numeric(10,2),
  rent_amount_minor    bigint not null default 0,
  service_charge_minor bigint not null default 0,
  currency             char(3) not null default 'NGN',
  status               public.unit_status not null default 'available',
  notes                text,
  created_by           uuid default auth.uid(),
  updated_by           uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (property_id, unit_number)
);
create index if not exists idx_units_tenant   on public.units(tenant_id, status);
create index if not exists idx_units_property on public.units(property_id);

drop trigger if exists trg_units_updated on public.units;
create trigger trg_units_updated before update on public.units
  for each row execute function public.set_updated_at();

alter table public.units enable row level security;

-- Read: any member of the tenant.
drop policy if exists units_select on public.units;
create policy units_select on public.units for select
  using (tenant_id in (select public.user_tenant_ids()));

-- Write: company_admin or property_manager.
drop policy if exists units_write on public.units;
create policy units_write on public.units for all
  using (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]))
  with check (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]));
