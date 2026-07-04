import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OwnerLink } from "@/components/owner-link";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteOwner, addOwnerProperty, removeOwnerProperty } from "../actions";

export default async function OwnerDetailPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: o } = await supabase
    .from("owners")
    .select("*, property_owners(id, property_id, properties(name, code))")
    .eq("id", params.id)
    .maybeSingle();
  if (!o) notFound();

  const links = (o.property_owners as { id: string; property_id: string; properties: { name?: string; code?: string } }[]) ?? [];
  const ownedIds = new Set(links.map((l) => l.property_id));
  const { data: allProps } = await supabase.from("properties").select("id, name, code").order("name");
  const available = (allProps ?? []).filter((p) => !ownedIds.has(p.id));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/owners" className="text-sm text-white/50 hover:text-white">← Owners</Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{o.full_name}</h1>
          <p className="mt-1 text-sm text-white/50">{o.email ?? "no email"} · {o.user_id ? "account linked" : "invite pending"}</p>
        </div>
        <form action={deleteOwner}>
          <input type="hidden" name="id" value={o.id} />
          <ConfirmButton message="Delete this owner? Their portfolio links are removed (properties are not deleted)." className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">Delete</ConfirmButton>
        </form>
      </div>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <OwnerLink token={o.access_token} />

      <h2 className="mt-8 mb-2 font-semibold">Properties ({links.length})</h2>
      <div className="flex flex-col gap-2">
        {links.length === 0 && <div className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-white/50">No properties assigned.</div>}
        {links.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <Link href={`/properties/${l.property_id}`} className="hover:text-brand">
              <span className="font-semibold">{l.properties?.name}</span>
              <span className="ml-2 font-mono text-xs text-white/40">{l.properties?.code}</span>
            </Link>
            <form action={removeOwnerProperty}>
              <input type="hidden" name="link_id" value={l.id} />
              <input type="hidden" name="owner_id" value={o.id} />
              <button className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:bg-white/5">Remove</button>
            </form>
          </div>
        ))}
      </div>

      {available.length > 0 && (
        <form action={addOwnerProperty} className="mt-3 flex gap-2">
          <input type="hidden" name="owner_id" value={o.id} />
          <select name="property_id" className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand">
            {available.map((p) => <option key={p.id} value={p.id} className="bg-ink">{p.name} ({p.code})</option>)}
          </select>
          <button className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5">+ Assign</button>
        </form>
      )}
    </div>
  );
}
