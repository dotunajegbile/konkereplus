-- ============================================================
-- KonkerePlus — Migration 0005: Leases (FR-LEASE)
-- Run in Supabase → SQL Editor after 0004. A lease connects a
-- tenant_party to a unit with a term, rent, deposit and lifecycle.
-- Enforces BR-01 (≤ 1 active lease per unit) at the DB level.
-- ============================================================

do $$ begin
  create type public.lease_status as enum (
    'draft','pending_approval','pending_signature','active','expired','terminated','renewed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rent_cadence as enum ('monthly','quarterly','biannual','annual');
exception when duplicate_object then null; end $$;

create table if not exists public.leases (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id)         on delete cascade,
  unit_id           uuid not null references public.units(id)           on delete cascade,
  tenant_party_id   uuid not null references public.tenant_parties(id)  on delete cascade,
  reference         text not null,
  status            public.lease_status not null default 'draft',
  start_date        date,
  end_date          date,
  rent_amount_minor bigint not null default 0,
  deposit_minor     bigint not null default 0,
  currency          char(3) not null default 'NGN',
  cadence           public.rent_cadence not null default 'annual',
  escalation_pct    numeric(5,2),
  grace_days        int not null default 5,
  notes             text,
  created_by        uuid default auth.uid(),
  updated_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_leases_tenant on public.leases(tenant_id, status);
create index if not exists idx_leases_unit   on public.leases(unit_id);
create index if not exists idx_leases_party  on public.leases(tenant_party_id);

-- BR-01: at most one ACTIVE lease per unit.
create unique index if not exists uq_active_lease_per_unit
  on public.leases(unit_id) where status = 'active';

drop trigger if exists trg_leases_updated on public.leases;
create trigger trg_leases_updated before update on public.leases
  for each row execute function public.set_updated_at();

alter table public.leases enable row level security;

drop policy if exists leases_select on public.leases;
create policy leases_select on public.leases for select
  using (tenant_id in (select public.user_tenant_ids()));

drop policy if exists leases_write on public.leases;
create policy leases_write on public.leases for all
  using (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]))
  with check (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]));
