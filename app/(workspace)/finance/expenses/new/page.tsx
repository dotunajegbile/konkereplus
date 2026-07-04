import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createExpense } from "../../actions";

export default async function NewExpensePage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const [{ data: vendors }, { data: properties }] = await Promise.all([
    supabase.from("vendors").select("id, name").order("name"),
    supabase.from("properties").select("id, name").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/finance" className="text-sm text-white/50 hover:text-white">← Finance</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New expense</h1>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <form action={createExpense} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Vendor (optional)</span>
            <select name="vendor_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              <option value="" className="bg-ink">— none —</option>
              {(vendors ?? []).map((v) => <option key={v.id} value={v.id} className="bg-ink">{v.name}</option>)}
            </select>
          </label>
          <Field label="Category" name="category" placeholder="e.g. Maintenance · Materials" />
        </div>
        <Field label="Description" name="description" placeholder="What was it for" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Amount (₦)" name="amount" placeholder="34,000" required />
          <Field label="Date" name="expense_date" type="date" />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Property</span>
            <select name="property_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              <option value="" className="bg-ink">—</option>
              {(properties ?? []).map((p) => <option key={p.id} value={p.id} className="bg-ink">{p.name}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Record expense</button>
          <Link href="/finance" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
        </div>
        <p className="text-xs text-white/40">Expenses start as pending → approve → mark paid.</p>
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
