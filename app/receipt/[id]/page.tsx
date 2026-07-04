import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate } from "@/lib/format";
import { PrintButton } from "@/components/print-button";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: p } = await supabase
    .from("payments")
    .select("id, amount_minor, method, bank_ref, paid_on, status, created_at, rent_invoices(period_label, units(unit_number, properties(name))), tenant_parties(full_name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!p || p.status !== "confirmed") {
    return (
      <main className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <div className="text-3xl opacity-40">🧾</div>
          <h1 className="mt-3 text-lg font-bold">Receipt unavailable</h1>
          <p className="mt-1 text-sm text-white/50">A receipt is generated once a payment is confirmed.</p>
        </div>
      </main>
    );
  }

  const inv = p.rent_invoices as { period_label?: string; units?: { unit_number?: string; properties?: { name?: string } } } | null;
  const party = p.tenant_parties as { full_name?: string } | null;
  const ref = "RCPT-" + p.id.slice(0, 8).toUpperCase();

  return (
    <main className="min-h-screen px-5 py-8 print:py-0">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <a href="/rent" className="text-sm text-white/50 hover:text-white">← Back</a>
          <PrintButton className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Print / Save PDF</PrintButton>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 print:border-black/20 print:bg-white print:text-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-sm font-black text-white">K+</span>
              <span className="font-bold">KonkerePlus</span>
            </div>
            <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-500 print:bg-green-100">PAID</span>
          </div>

          <h1 className="mt-6 text-lg font-bold">Payment receipt</h1>
          <div className="font-mono text-xs text-white/50 print:text-black/50">{ref}</div>

          <div className="mt-5 flex flex-col divide-y divide-white/10 text-sm print:divide-black/10">
            <Line label="Received from" value={party?.full_name ?? "—"} />
            <Line label="For" value={inv?.period_label ?? "Rent"} />
            <Line label="Property" value={`${inv?.units?.unit_number ?? ""} ${inv?.units?.properties?.name ? "· " + inv.units.properties.name : ""}`.trim() || "—"} />
            <Line label="Method" value={p.method.replace(/_/g, " ")} />
            {p.bank_ref && <Line label="Reference" value={p.bank_ref} />}
            <Line label="Date paid" value={fmtDate(p.paid_on)} />
            <Line label="Confirmed" value={fmtDate(p.created_at)} />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 print:border-black/20">
            <span className="text-sm text-white/60 print:text-black/60">Amount</span>
            <span className="font-mono text-2xl font-bold">{ngn(p.amount_minor)}</span>
          </div>

          <p className="mt-6 text-center text-[11px] text-white/40 print:text-black/40">
            Thank you. This receipt confirms a bank-transfer payment recorded in KonkerePlus.
          </p>
        </div>
      </div>
    </main>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-white/50 print:text-black/50">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
