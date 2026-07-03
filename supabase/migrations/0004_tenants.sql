-- ============================================================
-- KonkerePlus — Migration 0004: Tenant parties (FR-TEN)
-- Run in Supabase → SQL Editor after 0003. A "tenant party" is a
-- renter/occupant — distinct from `tenants` (the SaaS company).
-- Optionally linked to their current unit.
-- ============================================================

do $$ begin
  create type public.kyc_status as enum ('pending','verified','corporate');
exception when duplicate_object then null; end $$;

create table if not exists public.tenant_parties (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  unit_id           uuid references public.units(id) on delete set null,
  full_name         text not null,
  email             text,
  phone             text,
  government_id     text,
  kyc_status        public.kyc_status not null default 'pending',
  emergency_contact text,
  notes             text,
  created_by        uuid default auth.uid(),
  updated_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_tenant_parties_tenant on public.tenant_parties(tenant_id);
create index if not exists idx_tenant_parties_unit   on public.tenant_parties(unit_id);

drop trigger if exists trg_tenant_parties_updated on public.tenant_parties;
create trigger trg_tenant_parties_updated before update on public.tenant_parties
  for each row execute function public.set_updated_at();

alter table public.tenant_parties enable row level security;

-- Read: any member of the tenant (managers, legal, accountants — §13.2).
drop policy if exists tenant_parties_select on public.tenant_parties;
create policy tenant_parties_select on public.tenant_parties for select
  using (tenant_id in (select public.user_tenant_ids()));

-- Write: company_admin or property_manager.
drop policy if exists tenant_parties_write on public.tenant_parties;
create policy tenant_parties_write on public.tenant_parties for all
  using (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]))
  with check (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]));
