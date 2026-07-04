import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateLease } from "../../actions";

export default async function EditLeasePage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: l } = await supabase.from("leases").select("*, tenant_parties(full_name)").eq("id", params.id).maybeSingle();
  if (!l) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link href={`/leases/${l.id}`} className="text-sm text-white/50 hover:text-white">← {l.reference}</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Edit lease</h1>
      <p className="mt-1 text-sm text-white/50">{(l.tenant_parties as { full_name?: string } | null)?.full_name} · terms only (status via the lease page)</p>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <form action={updateLease} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={l.id} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" name="start_date" type="date" defaultValue={l.start_date ?? ""} />
          <Field label="End date" name="end_date" type="date" defaultValue={l.end_date ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Annual rent (₦)" name="rent" defaultValue={l.rent_amount_minor ? String(Math.round(l.rent_amount_minor / 100)) : ""} />
          <Field label="Deposit (₦)" name="deposit" defaultValue={l.deposit_minor ? String(Math.round(l.deposit_minor / 100)) : ""} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Cadence</span>
            <select name="cadence" defaultValue={l.cadence} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand capitalize">
              {["annual", "biannual", "quarterly", "monthly"].map((c) => <option key={c} value={c} className="bg-ink capitalize">{c}</option>)}
            </select>
          </label>
          <Field label="Escalation cap (%)" name="escalation_pct" defaultValue={l.escalation_pct != null ? String(l.escalation_pct) : ""} />
        </div>
        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Save changes</button>
          <Link href={`/leases/${l.id}`} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </label>
  );
}
