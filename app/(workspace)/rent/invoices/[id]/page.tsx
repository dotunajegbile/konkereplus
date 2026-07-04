import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, INVOICE_STATUS_STYLE, effectiveInvoiceStatus } from "@/lib/format";
import { voidInvoice } from "../actions";
import { ConfirmButton } from "@/components/confirm-button";

const PAY_STYLE: Record<string, string> = {
  confirmed: "bg-green-500/15 text-green-400",
  reported: "bg-amber-500/15 text-amber-400",
  rejected: "bg-red-500/15 text-red-400",
};

export default async function InvoiceDetailPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: i } = await supabase
    .from("rent_invoices")
    .select("*, tenant_parties(id, full_name), units(unit_number, properties(name))")
    .eq("id", params.id)
    .maybeSingle();
  if (!i) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount_minor, method, bank_ref, paid_on, status, created_at")
    .eq("invoice_id", i.id)
    .order("created_at", { ascending: false });

  const party = i.tenant_parties as { id?: string; full_name?: string } | null;
  const unit = i.units as { unit_number?: string; properties?: { name?: string } } | null;
  const balance = i.amount_minor - (i.paid_minor ?? 0);
  const effective = effectiveInvoiceStatus(i.due_date, i.status);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/rent" className="text-sm text-white/50 hover:text-white">← Rent</Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{i.period_label}</h1>
          <p className="mt-1 text-sm text-white/50">
            {party?.full_name} · {unit?.unit_number} @ {unit?.properties?.name}
          </p>
        </div>
        <span className={"rounded-full px-3 py-1 text-xs font-medium capitalize " + (INVOICE_STATUS_STYLE[effective] ?? "bg-white/10 text-white/60")}>
          {effective.replace(/_/g, " ")}
        </span>
      </div>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Row label="Amount" value={ngn(i.amount_minor)} />
        <Row label="Paid" value={ngn(i.paid_minor ?? 0)} />
        <Row label="Balance" value={ngn(balance)} tone={balance > 0} />
      </div>
      <div className="mt-3 text-sm text-white/50">Due {fmtDate(i.due_date)}</div>

      <h2 className="mt-8 mb-2 font-semibold">Payments</h2>
      {(payments?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-white/50">No payments recorded against this invoice yet.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <tbody>
              {payments!.map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono tabular-nums">{ngn(p.amount_minor)}</td>
                  <td className="px-4 py-3 text-white/60 capitalize">{p.method.replace(/_/g, " ")}{p.bank_ref ? ` · ${p.bank_ref}` : ""}</td>
                  <td className="px-4 py-3 text-white/50">{fmtDate(p.paid_on)}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (PAY_STYLE[p.status] ?? "bg-white/10 text-white/60")}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === "confirmed" && <Link href={`/receipt/${p.id}`} className="text-brand hover:underline">Receipt ↗</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {i.status !== "void" && (
        <form action={voidInvoice} className="mt-6">
          <input type="hidden" name="id" value={i.id} />
          <ConfirmButton message="Void this invoice? It will no longer count toward arrears." className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">Void invoice</ConfirmButton>
        </form>
      )}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className={"mt-1 font-semibold tabular-nums " + (tone ? "text-amber-400" : "")}>{value}</div>
    </div>
  );
}
