import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, EXPENSE_STATUS_STYLE } from "@/lib/format";
import { setExpenseStatus, deleteExpense } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";

export default async function FinancePage() {
  const supabase = createClient();
  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("payments").select("amount_minor").eq("status", "confirmed"),
    supabase.from("expenses").select("id, category, description, amount_minor, expense_date, status, vendors(name), properties(name)").order("created_at", { ascending: false }),
  ]);

  const income = (payments ?? []).reduce((s, p) => s + p.amount_minor, 0);
  const expTotal = (expenses ?? []).reduce((s, e) => s + e.amount_minor, 0);
  const expPaid = (expenses ?? []).filter((e) => e.status === "paid").reduce((s, e) => s + e.amount_minor, 0);
  const pending = (expenses ?? []).filter((e) => e.status === "pending").length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Finance</h1>
          <p className="mt-1 text-sm text-white/50">Income from rent, expenses out, and the net.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/vendors" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5">Vendors</Link>
          <Link href="/finance/expenses/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">+ New expense</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Income (rent collected)" value={ngn(income)} tone="up" />
        <Tile label="Expenses (total)" value={ngn(expTotal)} />
        <Tile label="Expenses (paid)" value={ngn(expPaid)} />
        <Tile label="Net" value={ngn(income - expTotal)} tone={income - expTotal >= 0 ? "up" : "down"} />
      </div>

      <div className="mt-8 mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Expenses <span className="text-white/40">({expenses?.length ?? 0})</span></h2>
        {pending > 0 && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-400">{pending} pending approval</span>}
      </div>

      {(expenses?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 py-14 text-center text-sm text-white/50">
          No expenses yet. <Link href="/finance/expenses/new" className="text-brand hover:underline">Record one</Link>.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Vendor / item</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses!.map((e) => (
                <tr key={e.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{(e.vendors as { name?: string } | null)?.name ?? e.description ?? "—"}</div>
                    {(e.properties as { name?: string } | null)?.name && <div className="text-xs text-white/40">{(e.properties as { name?: string }).name}</div>}
                  </td>
                  <td className="px-4 py-3 text-white/70">{e.category ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{ngn(e.amount_minor)}</td>
                  <td className="px-4 py-3 text-white/60">{fmtDate(e.expense_date)}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (EXPENSE_STATUS_STYLE[e.status] ?? "bg-white/10 text-white/60")}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {e.status === "pending" && (
                        <form action={setExpenseStatus}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="status" value="approved" /><button className="rounded-lg border border-white/15 px-2.5 py-1 text-xs hover:bg-white/5">Approve</button></form>
                      )}
                      {e.status !== "paid" && (
                        <form action={setExpenseStatus}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="status" value="paid" /><button className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600">Mark paid</button></form>
                      )}
                      <form action={deleteExpense}><input type="hidden" name="id" value={e.id} /><ConfirmButton message="Delete this expense?" className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10">✕</ConfirmButton></form>
                    </div>
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

function Tile({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className={"mt-1 text-xl font-bold tabular-nums " + (tone === "up" ? "text-green-400" : tone === "down" ? "text-red-400" : "")}>{value}</div>
    </div>
  );
}
