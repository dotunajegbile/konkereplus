import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCase } from "../actions";
import { CASE_TYPES } from "@/lib/format";

export default async function NewCasePage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const [{ data: properties }, { data: tenants }] = await Promise.all([
    supabase.from("properties").select("id, name").order("name"),
    supabase.from("tenant_parties").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/legal" className="text-sm text-white/50 hover:text-white">← Legal</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New case</h1>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <form action={createCase} className="mt-6 flex flex-col gap-4">
        <Field label="Case title" name="title" placeholder="e.g. Arrears recovery — A-1205" required />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Type</span>
            <select name="type" defaultValue="dispute" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              {CASE_TYPES.map(([v, l]) => <option key={v} value={v} className="bg-ink">{l}</option>)}
            </select>
          </label>
          <Field label="Opposing party" name="party" placeholder="e.g. Segun Ade" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Property (optional)</span>
            <select name="property_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              <option value="" className="bg-ink">— none —</option>
              {(properties ?? []).map((p) => <option key={p.id} value={p.id} className="bg-ink">{p.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Tenant (optional)</span>
            <select name="tenant_party_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              <option value="" className="bg-ink">— none —</option>
              {(tenants ?? []).map((t) => <option key={t.id} value={t.id} className="bg-ink">{t.full_name}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lawyer (optional)" name="lawyer" placeholder="e.g. Barr. Okoro" />
          <Field label="Next date (hearing/deadline)" name="next_date" type="date" />
        </div>
        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Create case</button>
          <Link href="/legal" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
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
