import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, LEASE_STATUS_STYLE } from "@/lib/format";

export default async function LeasesPage() {
  const supabase = createClient();
  const { data: leases, error } = await supabase
    .from("leases")
    .select("id, reference, status, start_date, end_date, rent_amount_minor, cadence, units(unit_number), tenant_parties(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Leases</h1>
          <p className="mt-1 text-sm text-white/50">{leases?.length ?? 0} leases</p>
        </div>
        <Link href="/leases/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + New lease
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error.message}</p>}

      {!error && (leases?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-3xl opacity-40">✎</div>
          <p className="mt-3 font-semibold">No leases yet</p>
          <p className="mt-1 text-sm text-white/50">Draft a lease to connect a tenant to a unit.</p>
          <Link href="/leases/new" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            + New lease
          </Link>
        </div>
      )}

      {(leases?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Ref</th>
                <th className="px-4 py-3 font-semibold">Tenant</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Term</th>
                <th className="px-4 py-3 text-right font-semibold">Rent</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leases!.map((l) => (
                <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/leases/${l.id}`} className="font-mono text-xs font-semibold hover:text-brand">{l.reference}</Link>
                  </td>
                  <td className="px-4 py-3">{(l.tenant_parties as { full_name?: string } | null)?.full_name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{(l.units as { unit_number?: string } | null)?.unit_number ?? "—"}</td>
                  <td className="px-4 py-3 text-white/60">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{ngn(l.rent_amount_minor)}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (LEASE_STATUS_STYLE[l.status] ?? "bg-white/10 text-white/60")}>
                      {String(l.status).replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
