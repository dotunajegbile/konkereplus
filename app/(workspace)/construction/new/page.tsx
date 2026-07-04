import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "../actions";

const STATUSES: [string, string][] = [
  ["planning", "Planning"], ["on_track", "On track"], ["at_risk", "At risk"],
  ["on_hold", "On hold"], ["completed", "Completed"],
];

export default async function NewProjectPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: properties } = await supabase.from("properties").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/construction" className="text-sm text-white/50 hover:text-white">← Construction</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New project</h1>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <form action={createProject} className="mt-6 flex flex-col gap-4">
        <Field label="Project name" name="name" placeholder="e.g. Palm Ridge Estate" required />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Property (optional)</span>
            <select name="property_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              <option value="" className="bg-ink">— none —</option>
              {(properties ?? []).map((p) => <option key={p.id} value={p.id} className="bg-ink">{p.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Status</span>
            <select name="status" defaultValue="planning" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              {STATUSES.map(([v, l]) => <option key={v} value={v} className="bg-ink">{l}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Budget (₦)" name="budget" placeholder="480,000,000" />
          <Field label="Progress (%)" name="progress" placeholder="0" />
          <Field label="Crew" name="crew_count" placeholder="0" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" name="start_date" type="date" />
          <Field label="Due date" name="due_date" type="date" />
        </div>
        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Create project</button>
          <Link href="/construction" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, placeholder, required, type = "text" }: { label: string; name: string; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input name={name} type={type} placeholder={placeholder} required={required} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </label>
  );
}
