-- ============================================================
-- KonkerePlus — Migration 0006: Rent (FR-RENT), manual bank-transfer flow
-- Run in Supabase → SQL Editor after 0005.
--   bank_accounts   — where rent is paid (shown to tenants)
--   rent_invoices   — generated from active leases
--   payments        — tenant-reported, staff-confirmed (manual reconciliation)
-- Plus a per-tenant access token + SECURITY DEFINER RPCs powering the
-- login-less tenant pay page (/pay/<token>).
-- ============================================================

-- ---------- bank accounts ----------
create table if not exists public.bank_accounts (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id)    on delete cascade,
  property_id    uuid references public.properties(id)          on delete cascade,
  bank_name      text not null,
  account_name   text not null,
  account_number text not null,
  instructions   text,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_bank_accounts_tenant on public.bank_accounts(tenant_id);
drop trigger if exists trg_bank_accounts_updated on public.bank_accounts;
create trigger trg_bank_accounts_updated before update on public.bank_accounts
  for each row execute function public.set_updated_at();

-- ---------- rent invoices ----------
do $$ begin
  create type public.invoice_status as enum ('open','part_paid','paid','overdue','void');
exception when duplicate_object then null; end $$;

create table if not exists public.rent_invoices (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id)         on delete cascade,
  lease_id        uuid not null references public.leases(id)          on delete cascade,
  tenant_party_id uuid not null references public.tenant_parties(id)  on delete cascade,
  unit_id         uuid references public.units(id)                    on delete set null,
  period_label    text not null,
  amount_minor    bigint not null,
  paid_minor      bigint not null default 0,
  currency        char(3) not null default 'NGN',
  due_date        date,
  status          public.invoice_status not null default 'open',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_rent_invoices_tenant on public.rent_invoices(tenant_id, status);
create index if not exists idx_rent_invoices_party  on public.rent_invoices(tenant_party_id);
drop trigger if exists trg_rent_invoices_updated on public.rent_invoices;
create trigger trg_rent_invoices_updated before update on public.rent_invoices
  for each row execute function public.set_updated_at();

-- ---------- payments (tenant-reported, staff-confirmed) ----------
do $$ begin
  create type public.payment_method as enum ('bank_transfer','cash');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.payment_status as enum ('reported','confirmed','rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id)         on delete cascade,
  invoice_id      uuid references public.rent_invoices(id)            on delete set null,
  tenant_party_id uuid references public.tenant_parties(id)           on delete set null,
  amount_minor    bigint not null,
  method          public.payment_method not null default 'bank_transfer',
  bank_ref        text,
  paid_on         date,
  status          public.payment_status not null default 'reported',
  note            text,
  confirmed_by    uuid,
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_payments_tenant  on public.payments(tenant_id, status);
create index if not exists idx_payments_invoice on public.payments(invoice_id);

-- ---------- tenant portal access token ----------
alter table public.tenant_parties
  add column if not exists access_token uuid not null default gen_random_uuid();
create index if not exists idx_tenant_parties_token on public.tenant_parties(access_token);

-- ---------- RLS (staff) ----------
alter table public.bank_accounts enable row level security;
alter table public.rent_invoices enable row level security;
alter table public.payments      enable row level security;

drop policy if exists bank_accounts_select on public.bank_accounts;
create policy bank_accounts_select on public.bank_accounts for select
  using (tenant_id in (select public.user_tenant_ids()));
drop policy if exists bank_accounts_write on public.bank_accounts;
create policy bank_accounts_write on public.bank_accounts for all
  using (public.has_role(tenant_id, array['company_admin','property_manager']::public.app_role[]))
  with check (public.has_role(tenant_id, array['company_admin','property_manager']::public.app_role[]));

drop policy if exists rent_invoices_select on public.rent_invoices;
create policy rent_invoices_select on public.rent_invoices for select
  using (tenant_id in (select public.user_tenant_ids()));
drop policy if exists rent_invoices_write on public.rent_invoices;
create policy rent_invoices_write on public.rent_invoices for all
  using (public.has_role(tenant_id, array['company_admin','property_manager','accountant']::public.app_role[]))
  with check (public.has_role(tenant_id, array['company_admin','property_manager','accountant']::public.app_role[]));

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select
  using (tenant_id in (select public.user_tenant_ids()));
drop policy if exists payments_write on public.payments;
create policy payments_write on public.payments for all
  using (public.has_role(tenant_id, array['company_admin','property_manager','accountant']::public.app_role[]))
  with check (public.has_role(tenant_id, array['company_admin','property_manager','accountant']::public.app_role[]));

-- ---------- Tenant pay page (login-less, token-scoped) ----------
-- Read: invoices + bank details for the tenant behind a token.
create or replace function public.get_tenant_portal(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.tenant_parties; v_prop uuid; v_result jsonb;
begin
  select * into v_party from public.tenant_parties where access_token = p_token;
  if v_party.id is null then return null; end if;
  select property_id into v_prop from public.units where id = v_party.unit_id;

  select jsonb_build_object(
    'tenant_name', v_party.full_name,
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'period', i.period_label, 'amount_minor', i.amount_minor,
        'paid_minor', i.paid_minor, 'due_date', i.due_date, 'status', i.status
      ) order by i.created_at desc)
      from public.rent_invoices i
      where i.tenant_party_id = v_party.id and i.status <> 'void'), '[]'::jsonb),
    'bank_accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'bank_name', b.bank_name, 'account_name', b.account_name,
        'account_number', b.account_number, 'instructions', b.instructions))
      from public.bank_accounts b
      where b.tenant_id = v_party.tenant_id
        and (b.property_id is null or b.property_id = v_prop)), '[]'::jsonb)
  ) into v_result;
  return v_result;
end $$;

-- Report a payment against one of the tenant's own invoices.
create or replace function public.report_payment(
  p_token uuid, p_invoice_id uuid, p_amount_minor bigint, p_paid_on date, p_bank_ref text, p_note text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_party public.tenant_parties; v_inv public.rent_invoices; v_id uuid;
begin
  select * into v_party from public.tenant_parties where access_token = p_token;
  if v_party.id is null then raise exception 'invalid token'; end if;
  select * into v_inv from public.rent_invoices where id = p_invoice_id and tenant_party_id = v_party.id;
  if v_inv.id is null then raise exception 'invoice not found for this tenant'; end if;

  insert into public.payments (tenant_id, invoice_id, tenant_party_id, amount_minor, method, bank_ref, paid_on, note, status)
  values (v_party.tenant_id, p_invoice_id, v_party.id, p_amount_minor, 'bank_transfer', p_bank_ref, p_paid_on, p_note, 'reported')
  returning id into v_id;
  return v_id;
end $$;

grant execute on function public.get_tenant_portal(uuid) to anon, authenticated;
grant execute on function public.report_payment(uuid, uuid, bigint, date, text, text) to anon, authenticated;
