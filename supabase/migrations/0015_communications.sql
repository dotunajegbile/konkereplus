-- ============================================================
-- KonkerePlus — Migration 0015: Communications (FR-COMM)
-- Run after 0014. Announcements (broadcast) + threaded messaging
-- between staff and a tenant/owner. Portals read/reply via RLS.
-- ============================================================

-- ---------- announcements ----------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  title      text not null,
  body       text,
  audience   text not null default 'all' check (audience in ('all','tenants','owners')),
  posted_by  uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists idx_announcements_tenant on public.announcements(tenant_id);

-- ---------- threads + messages ----------
create table if not exists public.message_threads (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id)        on delete cascade,
  subject         text,
  tenant_party_id uuid references public.tenant_parties(id)          on delete cascade,
  owner_id        uuid references public.owners(id)                  on delete cascade,
  created_by      uuid default auth.uid(),
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index if not exists idx_threads_tenant on public.message_threads(tenant_id);

create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id)        on delete cascade,
  thread_id      uuid not null references public.message_threads(id) on delete cascade,
  sender_user_id uuid not null default auth.uid(),
  body           text not null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_messages_thread on public.messages(thread_id, created_at);

-- ---------- helpers ----------
create or replace function public.my_owner_tenant()
returns setof uuid language sql stable security definer set search_path = public as $$
  select distinct tenant_id from public.owners where user_id = auth.uid()
$$;

create or replace function public.can_access_thread(p_thread uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.message_threads t
    where t.id = p_thread and (
      t.tenant_id in (select public.user_tenant_ids())
      or t.tenant_party_id in (select public.my_party_ids())
      or t.owner_id in (select public.my_owner_ids())
    )
  )
$$;
grant execute on function public.my_owner_tenant() to anon, authenticated;
grant execute on function public.can_access_thread(uuid) to anon, authenticated;

-- Bump thread order when a message arrives (definer: works for tenant/owner senders too).
create or replace function public.bump_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.message_threads set last_message_at = now() where id = new.thread_id;
  return new;
end $$;
drop trigger if exists trg_bump_thread on public.messages;
create trigger trg_bump_thread after insert on public.messages
  for each row execute function public.bump_thread();

-- ---------- RLS ----------
alter table public.announcements   enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages        enable row level security;

-- Announcements: staff full; tenants/owners read their audience.
drop policy if exists announcements_staff on public.announcements;
create policy announcements_staff on public.announcements for all
  using (tenant_id in (select public.user_tenant_ids()))
  with check (tenant_id in (select public.user_tenant_ids()));
drop policy if exists announcements_tenant_read on public.announcements;
create policy announcements_tenant_read on public.announcements for select
  using (audience in ('all','tenants') and tenant_id = public.my_party_tenant());
drop policy if exists announcements_owner_read on public.announcements;
create policy announcements_owner_read on public.announcements for select
  using (audience in ('all','owners') and tenant_id in (select public.my_owner_tenant()));

-- Threads: staff manage; tenant/owner read their own.
drop policy if exists threads_staff_write on public.message_threads;
create policy threads_staff_write on public.message_threads for all
  using (tenant_id in (select public.user_tenant_ids()))
  with check (tenant_id in (select public.user_tenant_ids()));
drop policy if exists threads_read on public.message_threads;
create policy threads_read on public.message_threads for select
  using (
    tenant_id in (select public.user_tenant_ids())
    or tenant_party_id in (select public.my_party_ids())
    or owner_id in (select public.my_owner_ids())
  );

-- Messages: read/insert if you can access the thread; sender must be you.
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select
  using (public.can_access_thread(thread_id));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert
  with check (public.can_access_thread(thread_id) and sender_user_id = auth.uid());
