import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateUnit, deleteUnit } from "../../actions";
import { ConfirmButton } from "@/components/confirm-button";

const STATUSES: [string, string][] = [
  ["available", "Available"], ["reserved", "Reserved"], ["occupied", "Occupied"],
  ["notice", "Notice"], ["vacant", "Vacant"], ["maintenance", "Under maintenance"],
];

export default async function EditUnitPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: u } = await supabase.from("units").select("*, properties(name)").eq("id", params.id).maybeSingle();
  if (!u) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/units" className="text-sm text-white/50 hover:text-white">← Units</Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Edit unit</h1>
        <form action={deleteUnit}>
          <input type="hidden" name="id" value={u.id} />
          <ConfirmButton message="Delete this unit? Its leases and invoices go too." className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">Delete</ConfirmButton>
        </form>
      </div>
      <p className="mt-1 text-sm text-white/50">{(u.properties as { name?: string } | null)?.name}</p>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <form action={updateUnit} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={u.id} />
        <Field label="Unit number" name="unit_number" defaultValue={u.unit_number} required />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Floor" name="floor" defaultValue={u.floor ?? ""} />
          <Field label="Bedrooms" name="bedrooms" defaultValue={String(u.bedrooms)} />
          <Field label="Bathrooms" name="bathrooms" defaultValue={String(u.bathrooms)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Size (ft²)" name="sq_ft" defaultValue={u.sq_ft ?? ""} />
          <Field label="Annual rent (₦)" name="rent" defaultValue={u.rent_amount_minor ? String(Math.round(u.rent_amount_minor / 100)) : ""} />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Status</span>
          <select name="status" defaultValue={u.status} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
            {STATUSES.map(([v, l]) => <option key={v} value={v} className="bg-ink">{l}</option>)}
          </select>
        </label>
        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Save changes</button>
          <Link href="/units" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, required }: { label: string; name: string; defaultValue?: string | number; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input name={name} defaultValue={defaultValue} required={required} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </label>
  );
}
