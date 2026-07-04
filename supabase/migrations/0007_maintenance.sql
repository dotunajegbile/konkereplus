-- ============================================================
-- KonkerePlus — Migration 0007: Maintenance (FR-MNT)
-- Run in Supabase → SQL Editor after 0006. Requests are raised
-- against a property (optionally a unit / tenant) and move through
-- a status lifecycle; staff assign and track cost.
-- ============================================================

do $$ begin
  create type public.maintenance_category as enum
    ('plumbing','electrical','hvac','appliance','structural','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.maintenance_priority as enum ('low','medium','high','emergency');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.maintenance_status as enum
    ('open','assigned','in_progress','on_hold','completed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.maintenance_requests (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id)         on delete cascade,
  property_id     uuid not null references public.properties(id)      on delete cascade,
  unit_id         uuid references public.units(id)                    on delete set null,
  tenant_party_id uuid references public.tenant_parties(id)           on delete set null,
  title           text not null,
  description     text,
  category        public.maintenance_category not null default 'other',
  priority        public.maintenance_priority not null default 'medium',
  status          public.maintenance_status   not null default 'open',
  assignee        text,
  cost_minor      bigint not null default 0,
  created_by      uuid default auth.uid(),
  updated_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  resolved_at     timestamptz
);
create index if not exists idx_maint_tenant   on public.maintenance_requests(tenant_id, status);
create index if not exists idx_maint_property on public.maintenance_requests(property_id);

drop trigger if exists trg_maint_updated on public.maintenance_requests;
create trigger trg_maint_updated before update on public.maintenance_requests
  for each row execute function public.set_updated_at();

alter table public.maintenance_requests enable row level security;

drop policy if exists maint_select on public.maintenance_requests;
create policy maint_select on public.maintenance_requests for select
  using (tenant_id in (select public.user_tenant_ids()));

drop policy if exists maint_write on public.maintenance_requests;
create policy maint_write on public.maintenance_requests for all
  using (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]))
  with check (public.has_role(tenant_id,
    array['company_admin','property_manager']::public.app_role[]));
