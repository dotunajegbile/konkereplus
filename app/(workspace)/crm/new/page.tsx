import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createLead } from "../actions";
import { LEAD_STAGES } from "@/lib/format";

export default async function NewLeadPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: properties } = await supabase.from("properties").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/crm" className="text-sm text-white/50 hover:text-white">← CRM</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New lead</h1>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <form action={createLead} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" name="name" placeholder="e.g. David Okonkwo" required />
          <Field label="Phone" name="phone" placeholder="+234 …" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" name="email" placeholder="lead@email.com" />
          <Field label="Source" name="source" placeholder="Website · Referral · WhatsApp" />
        </div>
        <Field label="Interest" name="interest" placeholder="e.g. 2-bed rental in Lekki" />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Property inquiry (optional)</span>
            <select name="property_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              <option value="" className="bg-ink">— none —</option>
              {(properties ?? []).map((p) => <option key={p.id} value={p.id} className="bg-ink">{p.name}</option>)}
            </select>
          </label>
          <Field label="Potential value (₦)" name="value" placeholder="1,500,000" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Stage</span>
            <select name="status" defaultValue="new" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              {LEAD_STAGES.map(([v, l]) => <option key={v} value={v} className="bg-ink">{l}</option>)}
            </select>
          </label>
          <Field label="Assigned to" name="assigned_to" placeholder="e.g. Ngozi" />
        </div>
        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Create lead</button>
          <Link href="/crm" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, placeholder, required }: { label: string; name: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input name={name} placeholder={placeholder} required={required} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </label>
  );
}
