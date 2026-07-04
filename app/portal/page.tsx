import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/login/actions";
import { ngn, fmtDate, INVOICE_STATUS_STYLE, MAINT_STATUS_STYLE, LEASE_STATUS_STYLE } from "@/lib/format";
import { reportPaymentPortal, reportIssuePortal } from "./actions";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: { error?: string; reported?: string; issue?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: party } = await supabase
    .from("tenant_parties")
    .select("id, full_name, tenant_id, unit_id, units(unit_number, properties(name))")
    .eq("user_id", user.id)
    .maybeSingle();

  // Logged in but not a linked tenant (e.g. staff) → send to their pay link path.
  if (!party) {
    return (
      <main className="min-h-screen grid place-items-center px-6 text-center">
        <div className="max-w-sm">
          <div className="text-3xl opacity-40">🔑</div>
          <h1 className="mt-3 text-lg font-bold">No tenancy linked</h1>
          <p className="mt-1 text-sm text-white/50">Open your private pay-link from your property manager to link this account.</p>
          <form action={signout} className="mt-4"><button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">Sign out</button></form>
        </div>
      </main>
    );
  }

  const [{ data: lease }, { data: invoices }, { data: banks }, { data: requests }] = await Promise.all([
    supabase.from("leases").select("reference, status, start_date, end_date, rent_amount_minor, cadence").eq("tenant_party_id", party.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("rent_invoices").select("id, period_label, amount_minor, paid_minor, due_date, status").eq("tenant_party_id", party.id).neq("status", "void").order("created_at", { ascending: false }),
    supabase.from("bank_accounts").select("bank_name, account_name, account_number, instructions"),
    supabase.from("maintenance_requests").select("id, title, status, created_at").eq("tenant_party_id", party.id).order("created_at", { ascending: false }),
  ]);

  const unit = party.units as { unit_number?: string; properties?: { name?: string } } | null;
  const outstanding = (invoices ?? []).filter((i) => i.status !== "paid");

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">K+</span>
            <span className="font-bold">KonkerePlus</span>
          </div>
          <form action={signout}><button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">Sign out</button></form>
        </header>

        <h1 className="text-xl font-extrabold tracking-tight">Hi {party.full_name}</h1>
        <p className="mt-1 text-sm text-white/50">{unit?.unit_number ? `${unit.unit_number} · ${unit.properties?.name ?? ""}` : "Your tenancy"}</p>

        {searchParams.reported && <Note ok>✓ Payment reported — your manager will confirm once it lands.</Note>}
        {searchParams.issue && <Note ok>✓ Issue reported — your manager has been notified.</Note>}
        {searchParams.error && <Note>{searchParams.error}</Note>}

        {/* Lease */}
        {lease && (
          <section className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm font-semibold">{lease.reference}</div>
              <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (LEASE_STATUS_STYLE[lease.status] ?? "bg-white/10 text-white/60")}>{String(lease.status).replace(/_/g, " ")}</span>
            </div>
            <div className="mt-1 text-sm text-white/60">{ngn(lease.rent_amount_minor)} / {lease.cadence} · {fmtDate(lease.start_date)} → {fmtDate(lease.end_date)}</div>
          </section>
        )}

        {/* Invoices */}
        <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/40">Your invoices</h2>
        <div className="mt-2 flex flex-col gap-2">
          {(invoices?.length ?? 0) === 0 && <Empty>No invoices yet.</Empty>}
          {(invoices ?? []).map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div><div className="font-semibold">{i.period_label}</div><div className="text-xs text-white/50">Balance {ngn(i.amount_minor - (i.paid_minor ?? 0))} · due {fmtDate(i.due_date)}</div></div>
              <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (INVOICE_STATUS_STYLE[i.status] ?? "bg-white/10 text-white/60")}>{String(i.status).replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>

        {/* Bank details */}
        <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/40">Pay into</h2>
        <div className="mt-2 flex flex-col gap-2">
          {(banks?.length ?? 0) === 0 && <Empty>No bank account set — ask your manager.</Empty>}
          {(banks ?? []).map((b, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-semibold">{b.bank_name}</div>
              <div className="text-sm text-white/70">{b.account_name}</div>
              <div className="font-mono text-lg tracking-wide">{b.account_number}</div>
              {b.instructions && <div className="mt-1 text-xs text-white/50">{b.instructions}</div>}
            </div>
          ))}
        </div>

        {/* Report payment */}
        {outstanding.length > 0 && (
          <form action={reportPaymentPortal} className="mt-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold">I’ve paid — notify my manager</h2>
            <select name="invoice_id" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
              {outstanding.map((i) => <option key={i.id} value={i.id} className="bg-ink">{i.period_label} — balance {ngn(i.amount_minor - (i.paid_minor ?? 0))}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <Input name="amount" label="Amount (₦)" placeholder="150,000" />
              <Input name="paid_on" label="Date paid" type="date" />
            </div>
            <Input name="bank_ref" label="Transfer reference (optional)" placeholder="session / transaction ID" />
            <button className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Notify payment</button>
          </form>
        )}

        {/* Maintenance */}
        <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/40">Maintenance</h2>
        <div className="mt-2 flex flex-col gap-2">
          {(requests?.length ?? 0) === 0 && <Empty>No requests yet.</Empty>}
          {(requests ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm">{r.title}<div className="text-xs text-white/40">{fmtDate(r.created_at)}</div></div>
              <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (MAINT_STATUS_STYLE[r.status] ?? "bg-white/10 text-white/60")}>{String(r.status).replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>

        <form action={reportIssuePortal} className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-semibold">Report an issue</h2>
          <Input name="title" label="What's wrong?" placeholder="e.g. AC not cooling" />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-white/70">Category</span>
              <select name="category" defaultValue="other" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
                {["plumbing","electrical","hvac","appliance","structural","other"].map((c) => <option key={c} value={c} className="bg-ink capitalize">{c}</option>)}
              </select></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-white/70">Priority</span>
              <select name="priority" defaultValue="medium" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
                {["low","medium","high","emergency"].map((p) => <option key={p} value={p} className="bg-ink capitalize">{p}</option>)}
              </select></label>
          </div>
          <button className="mt-1 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5 self-start">Submit issue</button>
        </form>
      </div>
    </main>
  );
}

function Note({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return <p className={"mt-4 rounded-lg px-3 py-2.5 text-sm " + (ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>{children}</p>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-white/15 py-6 text-center text-sm text-white/50">{children}</div>;
}
function Input({ name, label, placeholder, type = "text" }: { name: string; label: string; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input name={name} type={type} placeholder={placeholder} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </label>
  );
}
