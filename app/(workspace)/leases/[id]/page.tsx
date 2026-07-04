import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, CADENCE_LABEL, LEASE_STATUS_STYLE } from "@/lib/format";
import { setLeaseStatus } from "../actions";
import { generateInvoice } from "@/app/(workspace)/rent/actions";

// Allowed next states per current status → rendered as buttons.
const NEXT: Record<string, [string, string][]> = {
  draft: [["pending_signature", "Send for signature"]],
  pending_signature: [["active", "Activate lease"], ["draft", "Back to draft"]],
  active: [["terminated", "Terminate"], ["expired", "Mark expired"]],
};

export default async function LeaseDetailPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: l } = await supabase
    .from("leases")
    .select("*, units(unit_number, property_id, properties(name)), tenant_parties(id, full_name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!l) notFound();
  const unit = l.units as { unit_number?: string; property_id?: string; properties?: { name?: string } } | null;
  const party = l.tenant_parties as { id?: string; full_name?: string } | null;
  const actions = NEXT[l.status] ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/leases" className="text-sm text-white/50 hover:text-white">← Leases</Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="font-mono text-2xl font-extrabold tracking-tight">{l.reference}</h1>
          <p className="mt-1 text-sm text-white/50">
            {party?.full_name} · {unit?.unit_number} @ {unit?.properties?.name}
          </p>
        </div>
        <span className={"rounded-full px-3 py-1 text-xs font-medium capitalize " + (LEASE_STATUS_STYLE[l.status] ?? "bg-white/10 text-white/60")}>
          {String(l.status).replace(/_/g, " ")}
        </span>
      </div>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Row label="Tenant" value={party?.full_name ?? "—"} href={party?.id ? `/tenants/${party.id}` : undefined} />
        <Row label="Unit" value={`${unit?.unit_number ?? "—"} · ${unit?.properties?.name ?? ""}`} href={unit?.property_id ? `/properties/${unit.property_id}` : undefined} />
        <Row label="Term" value={`${fmtDate(l.start_date)} → ${fmtDate(l.end_date)}`} />
        <Row label="Cadence" value={CADENCE_LABEL[l.cadence] ?? l.cadence} />
        <Row label="Rent" value={`${ngn(l.rent_amount_minor)} / ${l.cadence === "annual" ? "yr" : l.cadence}`} />
        <Row label="Deposit" value={ngn(l.deposit_minor)} />
        <Row label="Escalation cap" value={l.escalation_pct != null ? `${l.escalation_pct}%` : "—"} />
        <Row label="Grace days" value={String(l.grace_days)} />
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Lifecycle</div>
        {actions.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">No further actions for a {l.status.replace(/_/g, " ")} lease.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map(([status, label]) => (
              <form key={status} action={setLeaseStatus}>
                <input type="hidden" name="lease_id" value={l.id} />
                <input type="hidden" name="status" value={status} />
                <button
                  className={
                    "rounded-lg px-4 py-2 text-sm font-semibold " +
                    (status === "active"
                      ? "bg-brand text-white hover:bg-brand-600"
                      : status === "terminated"
                      ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                      : "border border-white/15 hover:bg-white/5")
                  }
                >
                  {label}
                </button>
              </form>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-white/40">
          Activating occupies the unit and assigns the tenant. A unit can have only one active lease (BR-01).
        </p>
      </div>

      {l.status === "active" && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Rent</div>
            <p className="mt-1 text-sm text-white/50">Generate a rent invoice for this lease.</p>
          </div>
          <form action={generateInvoice}>
            <input type="hidden" name="lease_id" value={l.id} />
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
              Generate rent invoice
            </button>
          </form>
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
