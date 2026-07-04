-- ============================================================
-- KonkerePlus — Migration 0009: Owner portal
-- Run after 0008. Property owners (claimed via a private link),
-- linked to properties, with read-only self-access RLS.
-- ============================================================

create table if not exists public.owners (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  full_name    text not null,
  email        text,
  user_id      uuid references auth.users(id) on delete set null,
  access_token uuid not null default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_owners_tenant on public.owners(tenant_id);
create index if not exists idx_owners_user   on public.owners(user_id);
create index if not exists idx_owners_token  on public.owners(access_token);
drop trigger if exists trg_owners_updated on public.owners;
create trigger trg_owners_updated before update on public.owners
  for each row execute function public.set_updated_at();

create table if not exists public.property_owners (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id)    on delete cascade,
  owner_id    uuid not null references public.owners(id)     on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (owner_id, property_id)
);
create index if not exists idx_property_owners_owner    on public.property_owners(owner_id);
create index if not exists idx_property_owners_property on public.property_owners(property_id);

-- ---------- helpers (SECURITY DEFINER) ----------
create or replace function public.my_owner_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.owners where user_id = auth.uid()
$$;

create or replace function public.my_owner_property_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select property_id from public.property_owners
  where owner_id in (select id from public.owners where user_id = auth.uid())
$$;

create or replace function public.claim_owner(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v public.owners;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v from public.owners where access_token = p_token;
  if v.id is null then raise exception 'invalid link'; end if;
  if v.user_id is not null and v.user_id <> auth.uid() then
    raise exception 'this owner account is already linked to another login';
  end if;
  update public.owners set user_id = auth.uid() where id = v.id;
  return v.id;
end $$;

-- Owner name behind a token, for the pre-login claim page.
create or replace function public.owner_claim_info(p_token uuid)
returns text language sql stable security definer set search_path = public as $$
  select full_name from public.owners where access_token = p_token
$$;

grant execute on function public.my_owner_ids() to anon, authenticated;
grant execute on function public.my_owner_property_ids() to anon, authenticated;
grant execute on function public.claim_owner(uuid) to authenticated;
grant execute on function public.owner_claim_info(uuid) to anon, authenticated;

-- ---------- RLS ----------
alter table public.owners          enable row level security;
alter table public.property_owners enable row level security;

drop policy if exists owners_staff_read on public.owners;
create policy owners_staff_read on public.owners for select
  using (tenant_id in (select public.user_tenant_ids()));
drop policy if exists owners_staff_write on public.owners;
create policy owners_staff_write on public.owners for all
  using (public.has_role(tenant_id, array['company_admin','property_manager']::public.app_role[]))
  with check (public.has_role(tenant_id, array['company_admin','property_manager']::public.app_role[]));
drop policy if exists owners_self on public.owners;
create policy owners_self on public.owners for select using (user_id = auth.uid());

drop policy if exists property_owners_staff_read on public.property_owners;
create policy property_owners_staff_read on public.property_owners for select
  using (tenant_id in (select public.user_tenant_ids()));
drop policy if exists property_owners_staff_write on public.property_owners;
create policy property_owners_staff_write on public.property_owners for all
  using (public.has_role(tenant_id, array['company_admin','property_manager']::public.app_role[]))
  with check (public.has_role(tenant_id, array['company_admin','property_manager']::public.app_role[]));
drop policy if exists property_owners_self on public.property_owners;
create policy property_owners_self on public.property_owners for select
  using (owner_id in (select public.my_owner_ids()));

-- Owner self-read across their properties' data (read-only).
drop policy if exists properties_owner_read on public.properties;
create policy properties_owner_read on public.properties for select
  using (id in (select public.my_owner_property_ids()));

drop policy if exists units_owner_read on public.units;
create policy units_owner_read on public.units for select
  using (property_id in (select public.my_owner_property_ids()));

drop policy if exists leases_owner_read on public.leases;
create policy leases_owner_read on public.leases for select
  using (unit_id in (select id from public.units where property_id in (select public.my_owner_property_ids())));

drop policy if exists rent_invoices_owner_read on public.rent_invoices;
create policy rent_invoices_owner_read on public.rent_invoices for select
  using (unit_id in (select id from public.units where property_id in (select public.my_owner_property_ids())));

drop policy if exists payments_owner_read on public.payments;
create policy payments_owner_read on public.payments for select
  using (invoice_id in (
    select id from public.rent_invoices
    where unit_id in (select id from public.units where property_id in (select public.my_owner_property_ids()))));

drop policy if exists maintenance_owner_read on public.maintenance_requests;
create policy maintenance_owner_read on public.maintenance_requests for select
  using (property_id in (select public.my_owner_property_ids()));
