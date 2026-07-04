-- ============================================================
-- KonkerePlus — Migration 0013: Finance (FR-FIN)
-- Run after 0012. Vendors + expenses (money out) to complement the
-- rent already flowing in (payments). Write = company_admin / accountant.
-- ============================================================

do $$ begin
  create type public.expense_status as enum ('pending','approved','paid');
exception when duplicate_object then null; end $$;

create table if not exists public.vendors (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  category   text,
  contact    text,
  notes      text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_vendors_tenant on public.vendors(tenant_id);
drop trigger if exists trg_vendors_updated on public.vendors;
create trigger trg_vendors_updated before update on public.vendors
  for each row execute function public.set_updated_at();

create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id)  on delete cascade,
  vendor_id    uuid references public.vendors(id)           on delete set null,
  property_id  uuid references public.properties(id)        on delete set null,
  category     text,
  description  text,
  amount_minor bigint not null default 0,
  expense_date date,
  status       public.expense_status not null default 'pending',
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_expenses_tenant on public.expenses(tenant_id, status);
drop trigger if exists trg_expenses_updated on public.expenses;
create trigger trg_expenses_updated before update on public.expenses
  for each row execute function public.set_updated_at();

alter table public.vendors  enable row level security;
alter table public.expenses enable row level security;

do $$
declare t text;
begin
  foreach t in array array['vendors','expenses'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (tenant_id in (select public.user_tenant_ids()))', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($f$create policy %I_write on public.%I for all
      using (public.has_role(tenant_id, array['company_admin','accountant']::public.app_role[]))
      with check (public.has_role(tenant_id, array['company_admin','accountant']::public.app_role[]))$f$, t, t);
  end loop;
end $$;
