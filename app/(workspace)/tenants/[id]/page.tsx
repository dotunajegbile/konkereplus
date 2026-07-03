import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/50">
        Lease, rent history, maintenance requests and documents attach to this tenant
        next — Leases is the following module.
      </div>
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
