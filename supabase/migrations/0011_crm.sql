-- ============================================================
-- KonkerePlus — Migration 0011: CRM (FR-CRM)
-- Run after 0010. Leads through a sales pipeline + logged activities.
-- Write = company_admin / property_manager.
-- ============================================================

do $$ begin
  create type public.lead_status as enum
    ('new','contacted','qualified','viewing','offer','won','lost');
exception when duplicate_object then null; end $$;

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id)    on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  source      text,
  interest    text,
  property_id uuid references public.properties(id)          on delete set null,
  value_minor bigint not null default 0,
  status      public.lead_status not null default 'new',
  assigned_to text,
  notes       text,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_leads_tenant on public.leads(tenant_id, status);
drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

create table if not exists public.lead_activities (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  lead_id    uuid not null references public.leads(id)   on delete cascade,
  kind       text not null default 'note',
  body       text not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_activities_lead on public.lead_activities(lead_id);

alter table public.leads           enable row level security;
alter table public.lead_activities enable row level security;

do $$
declare t text;
begin
  foreach t in array array['leads','lead_activities'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (tenant_id in (select public.user_tenant_ids()))', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($f$create policy %I_write on public.%I for all
      using (public.has_role(tenant_id, array['company_admin','property_manager']::public.app_role[]))
      with check (public.has_role(tenant_id, array['company_admin','property_manager']::public.app_role[]))$f$, t, t);
  end loop;
end $$;
