import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, LEASE_STATUS_STYLE } from "@/lib/format";

const KYC_STYLE: Record<string, string> = {
  verified: "bg-green-500/15 text-green-400",
  corporate: "bg-brand/15 text-brand",
  pending: "bg-amber-500/15 text-amber-400",
};

export default async function TenantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: t } = await supabase
    .from("tenant_parties")
    .select("*, units(id, unit_number, property_id, properties(name))")
    .eq("id", params.id)
    .maybeSingle();

  if (!t) notFound();
  const unit = t.units as { id?: string; unit_number?: string; property_id?: string; properties?: { name?: string } } | null;

  const { data: leases } = await supabase
    .from("leases")
    .select("id, reference, status, start_date, end_date, rent_amount_minor")
    .eq("tenant_party_id", t.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/tenants" className="text-sm text-white/50 hover:text-white">← Tenants</Link>

      <div className="mt-3 flex items-start justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.full_name}</h1>
        <span className={"rounded-full px-3 py-1 text-xs font-medium capitalize " + (KYC_STYLE[t.kyc_status] ?? "bg-white/10 text-white/60")}>
          KYC: {t.kyc_status}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Row label="Email" value={t.email ?? "—"} />
        <Row label="Phone" value={t.phone ?? "—"} />
        <Row label="Government ID" value={t.government_id ?? "—"} />
        <Row label="Emergency contact" value={t.emergency_contact ?? "—"} />
        <Row
          label="Current unit"
          value={unit?.unit_number ? `${unit.unit_number} · ${unit.properties?.name ?? ""}` : "Not assigned"}
          href={unit?.property_id ? `/properties/${unit.property_id}` : undefined}
        />
        <Row label="Added" value={new Date(t.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-semibold">Leases <span className="text-white/40">({leases?.length ?? 0})</span></h2>
        <Link href={`/leases/new?tenant=${t.id}`} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/5">
          + New lease
        </Link>
      </div>

      {(leases?.length ?? 0) === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-white/15 py-10 text-center text-sm text-white/50">
          No leases yet.{" "}
          <Link href={`/leases/new?tenant=${t.id}`} className="text-brand hover:underline">Draft one</Link>.
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Ref</th>
                <th className="px-4 py-2.5 font-semibold">Term</th>
                <th className="px-4 py-2.5 text-right font-semibold">Rent</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leases!.map((l) => (
                <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-2.5">
                    <Link href={`/leases/${l.id}`} className="font-mono text-xs font-semibold hover:text-brand">{l.reference}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-white/60">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{ngn(l.rent_amount_minor)}</td>
                  <td className="px-4 py-2.5">
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

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className={"mt-1 font-semibold " + (href ? "text-brand" : "")}>{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
