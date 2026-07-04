import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTenantParty } from "../../actions";

export default async function EditTenantPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const [{ data: t }, { data: units }] = await Promise.all([
    supabase.from("tenant_parties").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("units").select("id, unit_number, properties(name)").order("unit_number"),
  ]);
  if (!t) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link href={`/tenants/${t.id}`} className="text-sm text-white/50 hover:text-white">← {t.full_name}</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Edit tenant</h1>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <form action={updateTenantParty} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={t.id} />
        <Field label="Full name" name="full_name" defaultValue={t.full_name} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" name="email" defaultValue={t.email ?? ""} />
          <Field label="Phone" name="phone" defaultValue={t.phone ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Government ID" name="government_id" defaultValue={t.government_id ?? ""} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">KYC status</span>
            <select name="kyc_status" defaultValue={t.kyc_status} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              <option value="pending" className="bg-ink">Pending</option>
              <option value="verified" className="bg-ink">Verified</option>
              <option value="corporate" className="bg-ink">Corporate</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Unit</span>
          <select name="unit_id" defaultValue={t.unit_id ?? ""} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
            <option value="" className="bg-ink">— not assigned —</option>
            {(units ?? []).map((u) => <option key={u.id} value={u.id} className="bg-ink">{u.unit_number} · {(u.properties as { name?: string } | null)?.name ?? ""}</option>)}
          </select>
        </label>
        <Field label="Emergency contact" name="emergency_contact" defaultValue={t.emergency_contact ?? ""} />
        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Save changes</button>
          <Link href={`/tenants/${t.id}`} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, required }: { label: string; name: string; defaultValue?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input name={name} defaultValue={defaultValue} required={required} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </label>
  );
}
