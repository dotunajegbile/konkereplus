import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, CASE_STATUS_STYLE, PROJECT_STATUS_STYLE } from "@/lib/format";
import { loadArrearsRisk, RISK_TIER_STYLE } from "@/lib/arrears-risk";
import type { SupabaseClient } from "@supabase/supabase-js";

// Per-role dashboard: each staff role lands on a view tuned to their job.
// The role comes from memberships.role; unknown/admin/manager roles get the full ops view.
type Persona = "finance" | "legal" | "construction" | "frontdesk" | "ops";
function personaFor(role: string): Persona {
  switch (role) {
    case "accountant": return "finance";
    case "legal":
    case "lawyer": return "legal";
    case "construction_pm": return "construction";
    case "receptionist": return "frontdesk";
    default: return "ops"; // company_admin, property_manager, others
  }
}
const INTRO: Record<Persona, string> = {
  finance: "Collections, arrears and cash position.",
  legal: "Cases and what's on the calendar.",
  construction: "Projects, progress and open queries.",
  frontdesk: "New enquiries and requests coming in.",
  ops: "Your portfolio at a glance.",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("memberships").select("role").eq("user_id", user!.id).maybeSingle();
  const role = membership?.role ?? "property_manager";
  const persona = personaFor(role);

  const body =
    persona === "finance" ? await financeDash(supabase) :
    persona === "legal" ? await legalDash(supabase) :
    persona === "construction" ? await constructionDash(supabase) :
    persona === "frontdesk" ? await frontDeskDash(supabase) :
    await opsDash(supabase);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-white/60">{INTRO[persona]}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs capitalize text-white/60">
          {role.replace(/_/g, " ")}
        </span>
      </div>
      {body}
    </div>
  );
}

/* ---------- Finance (accountant) ---------- */
async function financeDash(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: invoices }, { count: reported }, { data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("rent_invoices").select("amount_minor, paid_minor, status, period_label, due_date, tenant_parties(full_name)"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "reported"),
    supabase.from("payments").select("amount_minor").eq("status", "confirmed"),
    supabase.from("expenses").select("amount_minor").eq("status", "paid"),
  ]);
  const inv = (invoices ?? []).filter((i) => i.status !== "void");
  const billed = inv.reduce((s, i) => s + i.amount_minor, 0);
  const collected = inv.reduce((s, i) => s + (i.paid_minor ?? 0), 0);
  const rate = billed ? Math.round((collected / billed) * 100) : 0;
  const arrears = inv.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount_minor - (i.paid_minor ?? 0)), 0);
  const income = (payments ?? []).reduce((s, p) => s + p.amount_minor, 0);
  const expense = (expenses ?? []).reduce((s, e) => s + e.amount_minor, 0);
  const overdue = inv
    .filter((i) => i.status !== "paid" && i.due_date && i.due_date < today)
    .sort((a, b) => (a.amount_minor - (a.paid_minor ?? 0)) < (b.amount_minor - (b.paid_minor ?? 0)) ? 1 : -1);

  return (
    <>
      <Row>
        <Kpi label="Collection rate" value={`${rate}%`} bar={rate} />
        <Kpi label="Net (all time)" value={ngn(income - expense)} tone={income - expense >= 0 ? "ok" : "warn"} />
        <Kpi label="Arrears" value={ngn(arrears)} tone={arrears > 0 ? "warn" : undefined} />
      </Row>
      <Panel title="Needs action">
        {(reported ?? 0) > 0 && <Attn href="/rent" icon="₦" title={`${reported} payment${reported === 1 ? "" : "s"} to confirm`} sub="Tenants reported bank transfers" />}
        {overdue.slice(0, 5).map((i, idx) => (
          <Attn key={idx} href="/rent" icon="•" title={`${(i.tenant_parties as { full_name?: string } | null)?.full_name ?? "Invoice"} — ${i.period_label}`} sub={`Overdue ${ngn(i.amount_minor - (i.paid_minor ?? 0))} · due ${fmtDate(i.due_date)}`} />
        ))}
        {(reported ?? 0) === 0 && overdue.length === 0 && <Clear />}
      </Panel>
      {await atRiskPanel(supabase)}
      <Links items={[["/rent", "Rent & payments"], ["/finance", "Finance"], ["/reports", "Reports"]]} />
    </>
  );
}

/* ---------- Legal (legal / lawyer) ---------- */
async function legalDash(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: cases } = await supabase
    .from("legal_cases").select("id, title, party, status, next_date, type").order("next_date", { nullsFirst: false });
  const rows = cases ?? [];
  const open = rows.filter((c) => c.status !== "closed");
  const upcoming = rows.filter((c) => c.next_date && c.next_date >= today).sort((a, b) => (a.next_date! > b.next_date! ? 1 : -1));
  const hearingSoon = open.filter((c) => c.status === "hearing_scheduled" || c.status === "in_hearing");
  return (
    <>
      <Row>
        <Kpi label="Open cases" value={String(open.length)} />
        <Kpi label="Hearings scheduled" value={String(hearingSoon.length)} tone={hearingSoon.length > 0 ? "warn" : undefined} />
        <Kpi label="Upcoming dates" value={String(upcoming.length)} />
      </Row>
      <Panel title="Upcoming dates">
        {upcoming.slice(0, 6).map((c) => (
          <Link key={c.id} href={`/legal/${c.id}`} className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.03]">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-sm">§</span>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{c.title}</div><div className="truncate text-xs text-white/50">{c.party ?? c.type} · {fmtDate(c.next_date)}</div></div>
            <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (CASE_STATUS_STYLE[c.status] ?? "bg-white/10 text-white/60")}>{String(c.status).replace(/_/g, " ")}</span>
          </Link>
        ))}
        {upcoming.length === 0 && <Clear text="No scheduled dates." />}
      </Panel>
      <Links items={[["/legal", "All cases"], ["/documents", "Documents"]]} />
    </>
  );
}

/* ---------- Construction (construction_pm) ---------- */
async function constructionDash(supabase: SupabaseClient) {
  const [{ data: projects }, { data: rfis }] = await Promise.all([
    supabase.from("construction_projects").select("id, name, status, progress, budget_minor, spent_minor, due_date").order("due_date", { nullsFirst: false }),
    supabase.from("project_rfis").select("status"),
  ]);
  const rows = projects ?? [];
  const active = rows.filter((p) => p.status !== "completed");
  const openRfis = (rfis ?? []).filter((r) => r.status === "submitted" || r.status === "review").length;
  const atRisk = rows.filter((p) => p.status === "at_risk").length;
  const avg = active.length ? Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length) : 0;
  return (
    <>
      <Row>
        <Kpi label="Active projects" value={String(active.length)} />
        <Kpi label="Avg progress" value={`${avg}%`} bar={avg} />
        <Kpi label="Open RFIs" value={String(openRfis)} tone={openRfis > 0 ? "warn" : undefined} />
      </Row>
      <Panel title={atRisk > 0 ? `Projects — ${atRisk} at risk` : "Projects"}>
        {active.slice(0, 6).map((p) => (
          <Link key={p.id} href={`/construction/${p.id}`} className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.03]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{p.name}</span><span className={"rounded-full px-2 py-0.5 text-[10px] font-medium capitalize " + (PROJECT_STATUS_STYLE[p.status] ?? "bg-white/10 text-white/60")}>{String(p.status).replace(/_/g, " ")}</span></div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand" style={{ width: `${p.progress}%` }} /></div>
            </div>
            <div className="w-24 shrink-0 text-right text-xs tabular-nums text-white/50">{p.progress}% · {p.due_date ? fmtDate(p.due_date) : "—"}</div>
          </Link>
        ))}
        {active.length === 0 && <Clear text="No active projects." />}
      </Panel>
      <Links items={[["/construction", "All projects"], ["/documents", "Documents"]]} />
    </>
  );
}

/* ---------- Front desk (receptionist) ---------- */
async function frontDeskDash(supabase: SupabaseClient) {
  const [{ data: leads }, { data: maint }] = await Promise.all([
    supabase.from("leads").select("id, name, interest, status, created_at").order("created_at", { ascending: false }),
    supabase.from("maintenance_requests").select("id, title, status, priority, created_at, properties(name)").order("created_at", { ascending: false }),
  ]);
  const newLeads = (leads ?? []).filter((l) => l.status === "new");
  const openMaint = (maint ?? []).filter((m) => m.status !== "completed" && m.status !== "cancelled");
  const emergencies = openMaint.filter((m) => m.priority === "emergency");
  return (
    <>
      <Row>
        <Kpi label="New enquiries" value={String(newLeads.length)} tone={newLeads.length > 0 ? "warn" : undefined} />
        <Kpi label="Open requests" value={String(openMaint.length)} />
        <Kpi label="Emergencies" value={String(emergencies.length)} tone={emergencies.length > 0 ? "warn" : undefined} />
      </Row>
      <Panel title="New enquiries">
        {newLeads.slice(0, 5).map((l) => (
          <Attn key={l.id} href="/crm" icon="◎" title={l.name} sub={`${l.interest ?? "Enquiry"} · ${fmtDate(l.created_at)}`} />
        ))}
        {newLeads.length === 0 && <Clear text="No new enquiries." />}
      </Panel>
      <Panel title="Requests coming in">
        {openMaint.slice(0, 5).map((m) => (
          <Attn key={m.id} href={`/maintenance/${m.id}`} icon={m.priority === "emergency" ? "🚨" : "⚒"} title={m.title} sub={`${m.priority} · ${(m.properties as { name?: string } | null)?.name ?? ""}`} />
        ))}
        {openMaint.length === 0 && <Clear text="No open requests." />}
      </Panel>
      <Links items={[["/crm", "CRM / leads"], ["/maintenance", "Maintenance"]]} />
    </>
  );
}

/* ---------- Ops (company_admin, property_manager, default) ---------- */
async function opsDash(supabase: SupabaseClient) {
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
  const inv = (invoices.data ?? []).filter((i) => i.status !== "void");
  const billed = inv.reduce((s, i) => s + i.amount_minor, 0);
  const collected = inv.reduce((s, i) => s + (i.paid_minor ?? 0), 0);
  const arrears = inv.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount_minor - (i.paid_minor ?? 0)), 0);
  const rate = billed ? Math.round((collected / billed) * 100) : 0;
  const openMaint = (maint.data ?? []).filter((m) => m.status !== "completed" && m.status !== "cancelled");
  const emergencies = openMaint.filter((m) => m.priority === "emergency");
  const unpaid = inv.filter((i) => i.status === "open" || i.status === "part_paid" || i.status === "overdue");
  const rep = reported.count ?? 0;

  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Tile label="Properties" value={String(props.count ?? 0)} href="/properties" />
        <Tile label="Units" value={String(unitRows.length)} sub={`${occupied} occupied`} href="/units" />
        <Tile label="Tenants" value={String(tenants.count ?? 0)} href="/tenants" />
        <Tile label="Active leases" value={String(leases.count ?? 0)} href="/leases" />
      </div>
      <Row>
        <Kpi label="Occupancy" value={`${occupancy}%`} bar={occupancy} />
        <Kpi label="Collection rate" value={`${rate}%`} bar={rate} />
        <Kpi label="Arrears" value={ngn(arrears)} tone={arrears > 0 ? "warn" : undefined} />
      </Row>
      <Panel title="Needs attention">
        {rep > 0 && <Attn href="/rent" icon="₦" title={`${rep} payment${rep === 1 ? "" : "s"} to confirm`} sub="Tenants reported bank transfers" />}
        {emergencies.map((m) => (
          <Attn key={m.id} href={`/maintenance/${m.id}`} icon="🚨" title={m.title} sub={`Emergency · ${(m.properties as { name?: string } | null)?.name ?? ""}`} />
        ))}
        {unpaid.slice(0, 4).map((i, idx) => (
          <Attn key={idx} href="/rent" icon="•" title={`${(i.tenant_parties as { full_name?: string } | null)?.full_name ?? "Invoice"} — ${i.period_label}`} sub={`Balance ${ngn(i.amount_minor - (i.paid_minor ?? 0))} · due ${fmtDate(i.due_date)}`} />
        ))}
        {rep === 0 && emergencies.length === 0 && unpaid.length === 0 && <Clear />}
      </Panel>
      {await atRiskPanel(supabase)}
      {openMaint.length > 0 && (
        <p className="mt-3 text-sm text-white/50">
          {openMaint.length} open maintenance request{openMaint.length === 1 ? "" : "s"} —{" "}
          <Link href="/maintenance" className="text-brand hover:underline">view board</Link>.
        </p>
      )}
    </>
  );
}

/* ---------- shared: arrears-risk panel ---------- */
async function atRiskPanel(supabase: SupabaseClient) {
  const ranked = (await loadArrearsRisk(supabase)).filter((r) => r.tier !== "low");
  if (ranked.length === 0) return null;
  return (
    <>
      <div className="mt-8 mb-2 flex items-center justify-between">
        <h2 className="font-semibold">At-risk tenants <span className="text-white/40">({ranked.length})</span></h2>
        <Link href="/rent/risk" className="text-sm text-brand hover:underline">Risk board →</Link>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03]">
        {ranked.slice(0, 5).map((r) => (
          <Link key={r.id} href="/rent/risk" className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.03]">
            <span className={"rounded-full px-2 py-0.5 text-xs font-semibold capitalize " + RISK_TIER_STYLE[r.tier]}>{r.tier} · {r.score}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{r.name}</div>
              <div className="truncate text-xs text-white/50">{r.factors[0]}</div>
            </div>
            {r.balance > 0 && <span className="font-mono text-xs tabular-nums text-white/60">{ngn(r.balance)}</span>}
          </Link>
        ))}
      </div>
    </>
  );
}

/* ---------- shared UI ---------- */
function Row({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid gap-3 sm:grid-cols-3">{children}</div>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h2 className="mt-8 mb-2 font-semibold">{title}</h2>
      <div className="rounded-xl border border-white/10 bg-white/[0.03]">{children}</div>
    </>
  );
}
function Clear({ text = "All clear — nothing needs attention." }: { text?: string }) {
  return <div className="px-4 py-6 text-center text-sm text-white/50">{text}</div>;
}
function Links({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">{label} →</Link>
      ))}
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
      <div className={"mt-1 text-xl font-bold tabular-nums " + (tone === "warn" ? "text-amber-400" : tone === "ok" ? "text-green-400" : "")}>{value}</div>
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
