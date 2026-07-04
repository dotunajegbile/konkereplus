import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRequest } from "../actions";

const CATEGORIES: [string, string][] = [
  ["plumbing", "Plumbing"], ["electrical", "Electrical"], ["hvac", "HVAC"],
  ["appliance", "Appliance"], ["structural", "Structural"], ["other", "Other"],
];
const PRIORITIES: [string, string][] = [
  ["low", "Low"], ["medium", "Medium"], ["high", "High"], ["emergency", "Emergency"],
];

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: { error?: string; property?: string };
}) {
  const supabase = createClient();
  const [{ data: properties }, { data: units }] = await Promise.all([
    supabase.from("properties").select("id, name").order("name"),
    supabase.from("units").select("id, unit_number, properties(name)").order("unit_number"),
  ]);

  if (!properties || properties.length === 0) redirect("/properties/new");

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/maintenance" className="text-sm text-white/50 hover:text-white">← Maintenance</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New request</h1>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>
      )}

      <form action={createRequest} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Property</span>
          <select name="property_id" defaultValue={searchParams.property ?? properties[0].id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
            {properties.map((p) => <option key={p.id} value={p.id} className="bg-ink">{p.name}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Unit (optional)</span>
          <select name="unit_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
            <option value="" className="bg-ink">— common area / not unit-specific —</option>
            {(units ?? []).map((u) => (
              <option key={u.id} value={u.id} className="bg-ink">{u.unit_number} · {(u.properties as { name?: string } | null)?.name ?? ""}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Title</span>
          <input name="title" required placeholder="e.g. AC not cooling — bedroom" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Category</span>
            <select name="category" defaultValue="other" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              {CATEGORIES.map(([v, l]) => <option key={v} value={v} className="bg-ink">{l}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Priority</span>
            <select name="priority" defaultValue="medium" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              {PRIORITIES.map(([v, l]) => <option key={v} value={v} className="bg-ink">{l}</option>)}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Description (optional)</span>
          <textarea name="description" rows={3} placeholder="What's the problem?" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
        </label>

        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Log request</button>
          <Link href="/maintenance" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
