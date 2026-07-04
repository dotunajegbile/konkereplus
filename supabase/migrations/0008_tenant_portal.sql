-- ============================================================
-- KonkerePlus — Migration 0008: Tenant portal login
-- Run after 0007. Links a Supabase auth user to a tenant_party
-- (claimed via their private pay-link), and adds self-read RLS so a
-- logged-in tenant can see ONLY their own lease / invoices / etc.
-- ============================================================

alter table public.tenant_parties
  add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_tenant_parties_user on public.tenant_parties(user_id);

-- ---------- helpers (SECURITY DEFINER: avoid RLS recursion) ----------
create or replace function public.my_party_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.tenant_parties where user_id = auth.uid()
$$;

create or replace function public.my_party_tenant()
returns uuid language sql stable security definer set search_path = public as $$
  select tenant_id from public.tenant_parties where user_id = auth.uid() limit 1
$$;

-- Claim: link the caller's auth user to the tenant_party behind a token.
create or replace function public.claim_tenant_party(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v public.tenant_parties;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v from public.tenant_parties where access_token = p_token;
  if v.id is null then raise exception 'invalid link'; end if;
  if v.user_id is not null and v.user_id <> auth.uid() then
    raise exception 'this tenancy is already linked to another account';
  end if;
  update public.tenant_parties set user_id = auth.uid() where id = v.id;
  return v.id;
end $$;

grant execute on function public.my_party_ids() to anon, authenticated;
grant execute on function public.my_party_tenant() to anon, authenticated;
grant execute on function public.claim_tenant_party(uuid) to authenticated;

-- ---------- tenant self-read / self-report policies (additive to staff policies) ----------
drop policy if exists tenant_parties_self on public.tenant_parties;
create policy tenant_parties_self on public.tenant_parties for select
  using (user_id = auth.uid());

drop policy if exists leases_tenant_read on public.leases;
create policy leases_tenant_read on public.leases for select
  using (tenant_party_id in (select public.my_party_ids()));

drop policy if exists rent_invoices_tenant_read on public.rent_invoices;
create policy rent_invoices_tenant_read on public.rent_invoices for select
  using (tenant_party_id in (select public.my_party_ids()));

drop policy if exists payments_tenant_read on public.payments;
create policy payments_tenant_read on public.payments for select
  using (tenant_party_id in (select public.my_party_ids()));

-- Tenant may report (insert) a payment against their OWN invoice, as 'reported'.
drop policy if exists payments_tenant_insert on public.payments;
create policy payments_tenant_insert on public.payments for insert
  with check (
    tenant_party_id in (select public.my_party_ids())
    and tenant_id = public.my_party_tenant()
    and status = 'reported'
    and invoice_id in (select id from public.rent_invoices where tenant_party_id in (select public.my_party_ids()))
  );

drop policy if exists maint_tenant_read on public.maintenance_requests;
create policy maint_tenant_read on public.maintenance_requests for select
  using (tenant_party_id in (select public.my_party_ids()));

-- Tenant may report (insert) a maintenance request, as 'open'.
drop policy if exists maint_tenant_insert on public.maintenance_requests;
create policy maint_tenant_insert on public.maintenance_requests for insert
  with check (
    tenant_party_id in (select public.my_party_ids())
    and tenant_id = public.my_party_tenant()
    and status = 'open'
  );

drop policy if exists bank_accounts_tenant_read on public.bank_accounts;
create policy bank_accounts_tenant_read on public.bank_accounts for select
  using (tenant_id = public.my_party_tenant());

drop policy if exists units_tenant_read on public.units;
create policy units_tenant_read on public.units for select
  using (id in (select unit_id from public.tenant_parties where user_id = auth.uid()));

drop policy if exists properties_tenant_read on public.properties;
create policy properties_tenant_read on public.properties for select
  using (id in (
    select u.property_id from public.units u
    where u.id in (select unit_id from public.tenant_parties where user_id = auth.uid())
  ));
