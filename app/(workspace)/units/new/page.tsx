import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createUnit } from "../actions";

const STATUSES: [string, string][] = [
  ["available", "Available"], ["reserved", "Reserved"], ["occupied", "Occupied"],
  ["notice", "Notice"], ["vacant", "Vacant"], ["maintenance", "Under maintenance"],
];

export default async function NewUnitPage({
  searchParams,
}: {
  searchParams: { property?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, code")
    .order("name");

  // No properties yet → can't create a unit; send to create a property first.
  if (!properties || properties.length === 0) redirect("/properties/new");

  const selected = searchParams.property ?? properties[0].id;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/units" className="text-sm text-white/50 hover:text-white">← Units</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New unit</h1>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>
      )}

      <form action={createUnit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Property</span>
          <select
            name="property_id"
            defaultValue={selected}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id} className="bg-ink">
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </label>

        <Field label="Unit number" name="unit_number" placeholder="e.g. A-1204" required mono />

        <div className="grid grid-cols-3 gap-3">
          <Field label="Floor" name="floor" placeholder="12" />
          <Field label="Bedrooms" name="bedrooms" placeholder="3" />
          <Field label="Bathrooms" name="bathrooms" placeholder="3" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Size (ft²)" name="sq_ft" placeholder="1450" />
          <Field label="Annual rent (₦)" name="rent" placeholder="150,000" />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Status</span>
          <select
            name="status"
            defaultValue="available"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v} className="bg-ink">{l}</option>
            ))}
          </select>
        </label>

        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            Create unit
          </button>
          <Link href="/units" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, name, placeholder, required, mono,
}: {
  label: string; name: string; placeholder?: string; required?: boolean; mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className={"rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand " + (mono ? "font-mono" : "")}
      />
    </label>
  );
}
