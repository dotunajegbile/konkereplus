import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProperty } from "../../actions";

const TYPES: [string, string][] = [
  ["residential", "Residential"], ["commercial", "Commercial"], ["mixed_use", "Mixed-use"],
  ["industrial", "Industrial"], ["warehouse", "Warehouse"], ["retail", "Retail"],
  ["office", "Office"], ["hotel", "Hotel"], ["student_housing", "Student Housing"],
  ["short_stay", "Short-stay"], ["vacation", "Vacation"],
];
const STATUSES = ["planning", "under_construction", "completed", "active", "inactive"];

export default async function EditPropertyPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: p } = await supabase.from("properties").select("*").eq("id", params.id).maybeSingle();
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link href={`/properties/${p.id}`} className="text-sm text-white/50 hover:text-white">← {p.name}</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Edit property</h1>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <form action={updateProperty} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={p.id} />
        <Field label="Property name" name="name" defaultValue={p.name} required />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" name="type" value={p.type} options={TYPES} />
          <Select label="Status" name="status" value={p.status} options={STATUSES.map((s) => [s, s.replace(/_/g, " ")] as [string, string])} />
        </div>
        <Field label="City" name="city" defaultValue={p.city ?? ""} />
        <Field label="Address" name="address" defaultValue={p.address ?? ""} />
        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Save changes</button>
          <Link href={`/properties/${p.id}`} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, required }: { label: string; name: string; defaultValue?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input name={name} defaultValue={defaultValue} required={required} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </label>
  );
}
function Select({ label, name, value, options }: { label: string; name: string; value: string; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <select name={name} defaultValue={value} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand capitalize">
        {options.map(([v, l]) => <option key={v} value={v} className="bg-ink capitalize">{l}</option>)}
      </select>
    </label>
  );
}
