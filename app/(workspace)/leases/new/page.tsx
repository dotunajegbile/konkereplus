import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createLease } from "../actions";

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: { error?: string; tenant?: string; unit?: string };
}) {
  const supabase = createClient();
  const [{ data: tenants }, { data: units }] = await Promise.all([
    supabase.from("tenant_parties").select("id, full_name").order("full_name"),
    supabase.from("units").select("id, unit_number, properties(name)").order("unit_number"),
  ]);

  const missing =
    (tenants?.length ?? 0) === 0
      ? { label: "a tenant", href: "/tenants/new" }
      : (units?.length ?? 0) === 0
      ? { label: "a unit", href: "/units/new" }
      : null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/leases" className="text-sm text-white/50 hover:text-white">← Leases</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New lease</h1>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>
      )}

      {missing ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/15 py-12 text-center text-sm text-white/60">
          You need {missing.label} first.{" "}
          <Link href={missing.href} className="text-brand hover:underline">Create one</Link>.
        </div>
      ) : (
        <form action={createLease} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Tenant</span>
            <select name="tenant_party_id" defaultValue={searchParams.tenant ?? tenants![0].id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              {tenants!.map((t) => <option key={t.id} value={t.id} className="bg-ink">{t.full_name}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Unit</span>
            <select name="unit_id" defaultValue={searchParams.unit ?? units![0].id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              {units!.map((u) => (
                <option key={u.id} value={u.id} className="bg-ink">
                  {u.unit_number} · {(u.properties as { name?: string } | null)?.name ?? ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" name="start_date" type="date" />
            <Field label="End date" name="end_date" type="date" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Annual rent (₦)" name="rent" placeholder="150,000" />
            <Field label="Deposit (₦)" name="deposit" placeholder="150,000" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-white/70">Cadence</span>
              <select name="cadence" defaultValue="annual" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
                <option value="annual" className="bg-ink">Annual</option>
                <option value="biannual" className="bg-ink">Biannual</option>
                <option value="quarterly" className="bg-ink">Quarterly</option>
                <option value="monthly" className="bg-ink">Monthly</option>
              </select>
            </label>
            <Field label="Escalation cap (%)" name="escalation_pct" placeholder="7" />
          </div>

          <div className="mt-2 flex gap-3">
            <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Create draft lease
            </button>
            <Link href="/leases" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
          </div>
          <p className="text-xs text-white/40">Leases start as a draft; activate from the lease page to occupy the unit.</p>
        </form>
      )}
    </div>
  );
}

function Field({
  label, name, placeholder, type = "text",
}: {
  label: string; name: string; placeholder?: string; type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input name={name} type={type} placeholder={placeholder} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </label>
  );
}
