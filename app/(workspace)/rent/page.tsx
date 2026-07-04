import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, INVOICE_STATUS_STYLE, effectiveInvoiceStatus } from "@/lib/format";
import { confirmPayment, rejectPayment } from "./actions";
import { reconcileOverdue } from "./invoices/actions";

export default async function RentPage({
  searchParams,
}: {
  searchParams: { reconciled?: string; error?: string };
}) {
  const supabase = createClient();

  const [{ data: invoices }, { data: reported }] = await Promise.all([
    supabase
      .from("rent_invoices")
      .select("id, period_label, amount_minor, paid_minor, due_date, status, tenant_parties(full_name), units(unit_number)")
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, amount_minor, bank_ref, paid_on, note, created_at, tenant_parties(full_name), rent_invoices(period_label)")
      .eq("status", "reported")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Rent</h1>
          <p className="mt-1 text-sm text-white/50">Invoices, and payments reported by tenants.</p>
        </div>
        <div className="flex gap-2">
          <form action={reconcileOverdue}>
            <button className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5">Flag overdue</button>
          </form>
          <Link href="/rent/bank-accounts" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5">
            Bank accounts
          </Link>
        </div>
      </div>

      {searchParams.reconciled && (
        <p className="mb-4 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">✓ Past-due invoices flagged as overdue.</p>
      )}

      {/* Payments awaiting confirmation */}
      <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold">
          Payments to confirm{" "}
          <span className={"ml-1 rounded-full px-2 py-0.5 text-xs " + ((reported?.length ?? 0) > 0 ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/50")}>
            {reported?.length ?? 0}
          </span>
        </h2>

        {(reported?.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-white/50">No payment notifications waiting. Tenants report payments from their pay link.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {reported!.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="min-w-0">
                  <div className="font-semibold">
                    {(p.tenant_parties as { full_name?: string } | null)?.full_name ?? "—"}
                    <span className="ml-2 font-mono text-brand">{ngn(p.amount_minor)}</span>
                  </div>
                  <div className="text-xs text-white/50">
                    {(p.rent_invoices as { period_label?: string } | null)?.period_label ?? "—"} · paid {fmtDate(p.paid_on)}
                    {p.bank_ref ? ` · ref ${p.bank_ref}` : ""}
                    {p.note ? ` · “${p.note}”` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={confirmPayment}>
                    <input type="hidden" name="payment_id" value={p.id} />
                    <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">Confirm</button>
                  </form>
                  <form action={rejectPayment}>
                    <input type="hidden" name="payment_id" value={p.id} />
                    <button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">Reject</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <h2 className="mb-3 font-semibold">Invoices <span className="text-white/40">({invoices?.length ?? 0})</span></h2>
      {(invoices?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 py-14 text-center text-sm text-white/50">
          No invoices yet. Open an <Link href="/leases" className="text-brand hover:underline">active lease</Link> and choose “Generate rent invoice”.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Tenant</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 text-right font-semibold">Balance</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices!.map((i) => {
                const balance = i.amount_minor - (i.paid_minor ?? 0);
                const eff = effectiveInvoiceStatus(i.due_date, i.status);
                return (
                  <tr key={i.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link href={`/rent/invoices/${i.id}`} className="font-medium hover:text-brand">
                        {(i.tenant_parties as { full_name?: string } | null)?.full_name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/70">{(i.units as { unit_number?: string } | null)?.unit_number ?? "—"}</td>
                    <td className="px-4 py-3 text-white/60">{i.period_label}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{ngn(i.amount_minor)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{ngn(balance)}</td>
                    <td className="px-4 py-3">
                      <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (INVOICE_STATUS_STYLE[eff] ?? "bg-white/10 text-white/60")}>
                        {eff.replace(/_/g, " ")}
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
