import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createOwner } from "../actions";

export default async function NewOwnerPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: properties } = await supabase.from("properties").select("id, name, code").order("name");

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/owners" className="text-sm text-white/50 hover:text-white">← Owners</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New owner</h1>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <form action={createOwner} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Full name</span>
            <input name="full_name" required placeholder="e.g. Adeyemi Family Trust" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Email (optional)</span>
            <input name="email" type="email" placeholder="owner@email.com" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
          </label>
        </div>

        <div>
          <span className="text-xs font-semibold text-white/70">Properties they own</span>
          <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] p-3">
            {(properties?.length ?? 0) === 0 && <span className="text-sm text-white/40">No properties yet — you can assign later.</span>}
            {(properties ?? []).map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-white/5">
                <input type="checkbox" name="property_ids" value={p.id} className="accent-brand" />
                <span>{p.name} <span className="font-mono text-xs text-white/40">{p.code}</span></span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Create owner</button>
          <Link href="/owners" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
        </div>
        <p className="text-xs text-white/40">After creating, share their private access link so they can set up a read-only account.</p>
      </form>
    </div>
  );
}
