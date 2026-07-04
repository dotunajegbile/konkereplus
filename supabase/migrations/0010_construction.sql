-- ============================================================
-- KonkerePlus — Migration 0010: Construction (FR-CON)
-- Run after 0009. Projects with budget/progress, daily reports,
-- and RFIs / change orders. Write = company_admin / construction_pm.
-- ============================================================

do $$ begin
  create type public.project_status as enum ('planning','on_track','at_risk','on_hold','completed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.rfi_kind as enum ('rfi','change_order');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.rfi_status as enum ('draft','submitted','review','approved','rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.construction_projects (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id)    on delete cascade,
  property_id  uuid references public.properties(id)          on delete set null,
  name         text not null,
  status       public.project_status not null default 'planning',
  budget_minor bigint not null default 0,
  spent_minor  bigint not null default 0,
  progress     int not null default 0 check (progress between 0 and 100),
  start_date   date,
  due_date     date,
  crew_count   int not null default 0,
  notes        text,
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_projects_tenant on public.construction_projects(tenant_id, status);
drop trigger if exists trg_projects_updated on public.construction_projects;
create trigger trg_projects_updated before update on public.construction_projects
  for each row execute function public.set_updated_at();

create table if not exists public.project_reports (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id)                on delete cascade,
  project_id  uuid not null references public.construction_projects(id)  on delete cascade,
  report_date date not null,
  weather     text,
  crew_count  int not null default 0,
  work_done   text,
  issues      text,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);
create index if not exists idx_reports_project on public.project_reports(project_id);

create table if not exists public.project_rfis (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id)                on delete cascade,
  project_id  uuid not null references public.construction_projects(id)  on delete cascade,
  kind        public.rfi_kind not null default 'rfi',
  subject     text not null,
  status      public.rfi_status not null default 'submitted',
  impact      text,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_rfis_project on public.project_rfis(project_id);
drop trigger if exists trg_rfis_updated on public.project_rfis;
create trigger trg_rfis_updated before update on public.project_rfis
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.construction_projects enable row level security;
alter table public.project_reports       enable row level security;
alter table public.project_rfis          enable row level security;

do $$
declare t text;
begin
  foreach t in array array['construction_projects','project_reports','project_rfis'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (tenant_id in (select public.user_tenant_ids()))', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($f$create policy %I_write on public.%I for all
      using (public.has_role(tenant_id, array['company_admin','construction_pm']::public.app_role[]))
      with check (public.has_role(tenant_id, array['company_admin','construction_pm']::public.app_role[]))$f$, t, t);
  end loop;
end $$;
