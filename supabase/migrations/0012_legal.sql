-- ============================================================
-- KonkerePlus — Migration 0012: Legal (FR-LEG)
-- Run after 0011. Case/document workflow tracker (NOT legal advice).
-- Cases linkable to property/tenant, with a status lifecycle + events.
-- Write = company_admin / legal.
-- ============================================================

do $$ begin
  create type public.case_type as enum ('dispute','eviction','lawsuit','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.case_status as enum
    ('open','active','hearing_scheduled','in_hearing','judgement','settlement','closed','on_hold');
exception when duplicate_object then null; end $$;

create table if not exists public.legal_cases (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id)        on delete cascade,
  title           text not null,
  type            public.case_type not null default 'dispute',
  party           text,
  status          public.case_status not null default 'open',
  property_id     uuid references public.properties(id)             on delete set null,
  tenant_party_id uuid references public.tenant_parties(id)         on delete set null,
  lawyer          text,
  next_date       date,
  notes           text,
  created_by      uuid default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_legal_cases_tenant on public.legal_cases(tenant_id, status);
drop trigger if exists trg_legal_cases_updated on public.legal_cases;
create trigger trg_legal_cases_updated before update on public.legal_cases
  for each row execute function public.set_updated_at();

create table if not exists public.case_events (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id)     on delete cascade,
  case_id    uuid not null references public.legal_cases(id) on delete cascade,
  kind       text not null default 'note',
  body       text not null,
  event_date date,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists idx_case_events_case on public.case_events(case_id);

alter table public.legal_cases enable row level security;
alter table public.case_events enable row level security;

do $$
declare t text;
begin
  foreach t in array array['legal_cases','case_events'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (tenant_id in (select public.user_tenant_ids()))', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($f$create policy %I_write on public.%I for all
      using (public.has_role(tenant_id, array['company_admin','legal']::public.app_role[]))
      with check (public.has_role(tenant_id, array['company_admin','legal']::public.app_role[]))$f$, t, t);
  end loop;
end $$;
