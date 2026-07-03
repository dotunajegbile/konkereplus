import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createTenantParty } from "../actions";

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: units } = await supabase
    .from("units")
    .select("id, unit_number, properties(name)")
    .order("unit_number");

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/tenants" className="text-sm text-white/50 hover:text-white">← Tenants</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New tenant</h1>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>
      )}

      <form action={createTenantParty} className="mt-6 flex flex-col gap-4">
        <Field label="Full name" name="full_name" placeholder="e.g. Bola Adeyemi" required />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" name="email" placeholder="bola@email.com" />
          <Field label="Phone" name="phone" placeholder="+234 803 …" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Government ID" name="government_id" placeholder="NIN / passport no." />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">KYC status</span>
            <select name="kyc_status" defaultValue="pending" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              <option value="pending" className="bg-ink">Pending</option>
              <option value="verified" className="bg-ink">Verified</option>
              <option value="corporate" className="bg-ink">Corporate</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/70">Unit (optional)</span>
          <select name="unit_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
            <option value="" className="bg-ink">— not assigned —</option>
            {(units ?? []).map((u) => (
              <option key={u.id} value={u.id} className="bg-ink">
                {u.unit_number} · {(u.properties as { name?: string } | null)?.name ?? ""}
              </option>
            ))}
          </select>
        </label>

        <Field label="Emergency contact (optional)" name="emergency_contact" placeholder="Name · phone" />

        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            Create tenant
          </button>
          <Link href="/tenants" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, name, placeholder, required,
}: {
  label: string; name: string; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}
