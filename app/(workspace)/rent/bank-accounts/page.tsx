import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addBankAccount } from "../actions";

export default async function BankAccountsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const [{ data: accounts }, { data: properties }] = await Promise.all([
    supabase.from("bank_accounts").select("id, bank_name, account_name, account_number, is_default, properties(name)").order("created_at"),
    supabase.from("properties").select("id, name").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/rent" className="text-sm text-white/50 hover:text-white">← Rent</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Bank accounts</h1>
      <p className="mt-1 text-sm text-white/50">Accounts tenants pay rent into. These appear on the tenant pay page.</p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {(accounts?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-white/50">No bank accounts yet.</div>
        )}
        {(accounts ?? []).map((a) => (
          <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{a.bank_name}</div>
              {a.is_default && <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400">Default</span>}
            </div>
            <div className="mt-1 text-sm text-white/70">{a.account_name}</div>
            <div className="font-mono text-sm text-white/90">{a.account_number}</div>
            <div className="mt-1 text-xs text-white/40">
              {(a.properties as { name?: string } | null)?.name ?? "All properties"}
            </div>
          </div>
        ))}
      </div>

      <form action={addBankAccount} className="mt-8 flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold">Add a bank account</h2>
        <Field label="Bank name" name="bank_name" placeholder="e.g. GTBank" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Account name" name="account_name" placeholder="Konkere Plus Ltd" required />
          <Field label="Account number" name="account_number" placeholder="0123456789" required mono />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Applies to</span>
          <select name="property_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
            <option value="" className="bg-ink">All properties</option>
            {(properties ?? []).map((p) => <option key={p.id} value={p.id} className="bg-ink">{p.name}</option>)}
          </select>
        </label>
        <Field label="Payment instructions (optional)" name="instructions" placeholder="Use your unit number as the transfer reference" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_default" className="accent-brand" />
          <span className="text-white/70">Make this the default account</span>
        </label>
        <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 self-start">Add account</button>
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
      <input name={name} placeholder={placeholder} required={required}
        className={"rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand " + (mono ? "font-mono" : "")} />
    </label>
  );
}
