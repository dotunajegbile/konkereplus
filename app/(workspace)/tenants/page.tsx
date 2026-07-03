import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const KYC_STYLE: Record<string, string> = {
  verified: "bg-green-500/15 text-green-400",
  corporate: "bg-brand/15 text-brand",
  pending: "bg-amber-500/15 text-amber-400",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default async function TenantsPage() {
  const supabase = createClient();
  const { data: tenants, error } = await supabase
    .from("tenant_parties")
    .select("id, full_name, email, phone, kyc_status, unit_id, units(unit_number, properties(name))")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tenants</h1>
          <p className="mt-1 text-sm text-white/50">{tenants?.length ?? 0} tenant profiles</p>
        </div>
        <Link href="/tenants/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + New tenant
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error.message}</p>}

      {!error && (tenants?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-3xl opacity-40">☺</div>
          <p className="mt-3 font-semibold">No tenants yet</p>
          <p className="mt-1 text-sm text-white/50">Add tenant profiles, then place them on a lease.</p>
          <Link href="/tenants/new" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            + New tenant
          </Link>
        </div>
      )}

      {(tenants?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Tenant</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Property</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">KYC</th>
              </tr>
            </thead>
            <tbody>
              {tenants!.map((t) => {
                const unit = t.units as { unit_number?: string; properties?: { name?: string } } | null;
                return (
                  <tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link href={`/tenants/${t.id}`} className="flex items-center gap-2.5 hover:text-brand">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                          {initials(t.full_name)}
                        </span>
                        <span className="font-semibold">{t.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/70">{unit?.unit_number ?? "—"}</td>
                    <td className="px-4 py-3 text-white/60">{unit?.properties?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-white/60">{t.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (KYC_STYLE[t.kyc_status] ?? "bg-white/10 text-white/60")}>
                        {t.kyc_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
