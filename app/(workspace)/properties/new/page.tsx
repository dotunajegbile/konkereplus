import Link from "next/link";
import { createProperty } from "../actions";

const TYPES: [string, string][] = [
  ["residential", "Residential"], ["commercial", "Commercial"], ["mixed_use", "Mixed-use"],
  ["industrial", "Industrial"], ["warehouse", "Warehouse"], ["retail", "Retail"],
  ["office", "Office"], ["hotel", "Hotel"], ["student_housing", "Student Housing"],
  ["short_stay", "Short-stay"], ["vacation", "Vacation"],
];

export default function NewPropertyPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/properties" className="text-sm text-white/50 hover:text-white">
        ← Properties
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New property</h1>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {searchParams.error}
        </p>
      )}

      <form action={createProperty} className="mt-6 flex flex-col gap-4">
        <Field label="Property name" name="name" placeholder="e.g. Konkere Heights, Lekki" required />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Type</span>
          <select
            name="type"
            defaultValue="residential"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            {TYPES.map(([v, l]) => (
              <option key={v} value={v} className="bg-ink">
                {l}
              </option>
            ))}
          </select>
        </label>
        <Field label="City" name="city" placeholder="e.g. Lekki, Lagos" />
        <Field label="Property code (optional)" name="code" placeholder="auto-generated if blank" mono />

        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            Create property
          </button>
          <Link
            href="/properties"
            className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"
          >
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
        className={
          "rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand " +
          (mono ? "font-mono" : "")
        }
      />
    </label>
  );
}
