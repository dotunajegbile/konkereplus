import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = createClient();

  const [props, units, invoices, maint, reported, leases, tenants] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("units").select("status"),
    supabase.from("rent_invoices").select("amount_minor, paid_minor, status, period_label, due_date, tenant_parties(full_name)"),
    supabase.from("maintenance_requests").select("id, title, status, priority, properties(name)"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "reported"),
    supabase.from("leases").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tenant_parties").select("id", { count: "exact", head: true }),
  ]);

  const unitRows = units.data ?? [];
  const occupied = unitRows.filter((u) => u.status === "occupied").length;
  const occupancy = unitRows.length ? Math.round((occupied / unitRows.length) * 100) : 0;

  const inv = invoices.data ?? [];
  const billed = inv.reduce((s, i) => s + i.amount_minor, 0);
  const collected = inv.reduce((s, i) => s + (i.paid_minor ?? 0), 0);
  const arrears = inv.filter((i) => i.status !== "paid" && i.status !== "void")
    .reduce((s, i) => s + (i.amount_minor - (i.paid_minor ?? 0)), 0);
  const collectionRate = billed ? Math.round((collected / billed) * 100) : 0;

  const openMaint = (maint.data ?? []).filter((m) => m.status !== "completed" && m.status !== "cancelled");
  const emergencies = openMaint.filter((m) => m.priority === "emergency");
  const unpaidInvoices = inv.filter((i) => i.status === "open" || i.status === "part_paid" || i.status === "overdue");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-white/60">Your portfolio at a glance.</p>

      {/* Counts */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Tile label="Properties" value={String(props.count ?? 0)} href="/properties" />
        <Tile label="Units" value={String(unitRows.length)} sub={`${occupied} occupied`} href="/units" />
        <Tile label="Tenants" value={String(tenants.count ?? 0)} href="/tenants" />
        <Tile label="Active leases" value={String(leases.count ?? 0)} href="/leases" />
      </div>

      {/* KPIs */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Kpi label="Occupancy" value={`${occupancy}%`} bar={occupancy} />
        <Kpi label="Collection rate" value={`${collectionRate}%`} bar={collectionRate} />
        <Kpi label="Arrears" value={ngn(arrears)} tone={arrears > 0 ? "warn" : "ok"} />
      </div>

      {/* Needs attention */}
      <h2 className="mt-8 mb-2 font-semibold">Needs attention</h2>
      <div className="rounded-xl border border-white/10 bg-white/[0.03]">
        {(reported.count ?? 0) > 0 && (
          <Attn href="/rent" icon="₦" title={`${reported.count} payment${reported.count === 1 ? "" : "s"} to confirm`} sub="Tenants reported bank transfers" />
        )}
        {emergencies.map((m) => (
          <Attn key={m.id} href={`/maintenance/${m.id}`} icon="🚨" title={m.title} sub={`Emergency · ${(m.properties as { name?: string } | null)?.name ?? ""}`} />
        ))}
        {unpaidInvoices.slice(0, 4).map((i, idx) => (
          <Attn key={idx} href="/rent" icon="•" title={`${(i.tenant_parties as { full_name?: string } | null)?.full_name ?? "Invoice"} — ${i.period_label}`} sub={`Balance ${ngn(i.amount_minor - (i.paid_minor ?? 0))} · due ${fmtDate(i.due_date)}`} />
        ))}
        {(reported.count ?? 0) === 0 && emergencies.length === 0 && unpaidInvoices.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-white/50">All clear — nothing needs attention.</div>
        )}
      </div>

      {openMaint.length > 0 && (
        <p className="mt-3 text-sm text-white/50">
          {openMaint.length} open maintenance request{openMaint.length === 1 ? "" : "s"} —{" "}
          <Link href="/maintenance" className="text-brand hover:underline">view board</Link>.
        </p>
      )}
    </div>
  );
}

function Tile({ label, value, sub, href }: { label: string; value: string; sub?: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-white/40">{sub}</div>}
    </Link>
  );
}

function Kpi({ label, value, bar, tone }: { label: string; value: string; bar?: number; tone?: "warn" | "ok" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className={"mt-1 text-xl font-bold tabular-nums " + (tone === "warn" ? "text-amber-400" : "")}>{value}</div>
      {bar != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, bar)}%` }} />
        </div>
      )}
    </div>
  );
}

function Attn({ href, icon, title, sub }: { href: string; icon: string; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.03]">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-sm">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-white/50">{sub}</div>
      </div>
      <span className="text-white/30">→</span>
    </Link>
  );
}
