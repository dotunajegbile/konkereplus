import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createVendor, deleteVendor } from "../actions";
import { ConfirmButton } from "@/components/confirm-button";

export default async function VendorsPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: vendors } = await supabase.from("vendors").select("id, name, category, contact").order("name");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/finance" className="text-sm text-white/50 hover:text-white">← Finance</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Vendors</h1>
      <p className="mt-1 text-sm text-white/50">Suppliers and contractors you pay.</p>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <div className="mt-6 flex flex-col gap-2">
        {(vendors?.length ?? 0) === 0 && <div className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-white/50">No vendors yet.</div>}
        {(vendors ?? []).map((v) => (
          <div key={v.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <div className="font-semibold">{v.name}</div>
              <div className="text-xs text-white/50">{[v.category, v.contact].filter(Boolean).join(" · ") || "—"}</div>
            </div>
            <form action={deleteVendor}>
              <input type="hidden" name="id" value={v.id} />
              <ConfirmButton message="Delete this vendor?" className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10">Delete</ConfirmButton>
            </form>
          </div>
        ))}
      </div>

      <form action={createVendor} className="mt-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold">Add a vendor</h2>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-white/70">Name</span>
            <input name="name" required placeholder="e.g. CoolAir Ltd" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-white/70">Category</span>
            <input name="category" placeholder="Maintenance" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-white/70">Contact</span>
            <input name="contact" placeholder="phone / email" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" /></label>
        </div>
        <button className="self-start rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Add vendor</button>
      </form>
    </div>
  );
}
