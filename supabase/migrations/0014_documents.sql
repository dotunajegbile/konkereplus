-- ============================================================
-- KonkerePlus — Migration 0014: Documents (FR-DOC)
-- Run after 0013. Metadata table + a private Supabase Storage bucket
-- with tenant-isolated policies (files live under {tenant_id}/...).
-- ============================================================

create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id)   on delete cascade,
  property_id  uuid references public.properties(id)         on delete set null,
  name         text not null,
  category     text,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  expires_at   date,
  uploaded_by  uuid default auth.uid(),
  created_at   timestamptz not null default now()
);
create index if not exists idx_documents_tenant on public.documents(tenant_id);

alter table public.documents enable row level security;

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select
  using (tenant_id in (select public.user_tenant_ids()));
drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents for all
  using (tenant_id in (select public.user_tenant_ids()))
  with check (tenant_id in (select public.user_tenant_ids()));

-- ---------- Storage bucket (private) ----------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Objects live under a first folder = tenant_id; members of that tenant can read/write.
drop policy if exists "documents tenant read"   on storage.objects;
create policy "documents tenant read" on storage.objects for select
  using (bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select public.user_tenant_ids()));

drop policy if exists "documents tenant insert" on storage.objects;
create policy "documents tenant insert" on storage.objects for insert
  with check (bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select public.user_tenant_ids()));

drop policy if exists "documents tenant delete" on storage.objects;
create policy "documents tenant delete" on storage.objects for delete
  using (bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select public.user_tenant_ids()));
