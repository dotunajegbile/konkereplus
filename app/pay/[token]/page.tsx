import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, INVOICE_STATUS_STYLE } from "@/lib/format";
import { reportPayment } from "./actions";

type Invoice = { id: string; period: string; amount_minor: number; paid_minor: number; due_date: string | null; status: string };
type Bank = { bank_name: string; account_name: string; account_number: string; instructions: string | null };
type Portal = { tenant_name: string; invoices: Invoice[]; bank_accounts: Bank[] };

export default async function PayPage({
  params, searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string; reported?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_tenant_portal", { p_token: params.token });
  const portal = data as Portal | null;

  if (!portal) {
    return (
      <main className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <div className="text-3xl opacity-40">🔒</div>
          <h1 className="mt-3 text-lg font-bold">Link not recognised</h1>
          <p className="mt-1 text-sm text-white/50">Ask your property manager for your rent payment link.</p>
        </div>
      </main>
    );
  }

  const outstanding = portal.invoices.filter((i) => i.status !== "paid" && i.status !== "void");

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">K+</span>
          <span className="font-bold">KonkerePlus</span>
        </div>

        <h1 className="text-xl font-extrabold tracking-tight">Hi {portal.tenant_name}</h1>
        <p className="mt-1 text-sm text-white/50">Pay your rent by bank transfer, then tell us below.</p>

        <a href={`/claim/${params.token}`} className="mt-3 flex items-center justify-between rounded-lg border border-brand/40 bg-brand/10 px-4 py-2.5 text-sm">
          <span className="font-medium text-white/80">Create an account to manage your tenancy</span>
          <span className="font-semibold text-brand">Set up →</span>
        </a>

        {searchParams.reported && (
          <p className="mt-4 rounded-lg bg-green-500/10 px-3 py-2.5 text-sm text-green-400">
            ✓ Thanks — we’ve notified your property manager. They’ll confirm once the transfer lands.
          </p>
        )}
        {searchParams.error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400">{searchParams.error}</p>
        )}

        {/* Invoices */}
        <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/40">Your invoices</h2>
        <div className="mt-2 flex flex-col gap-2">
          {portal.invoices.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-white/50">No invoices yet.</div>
          )}
          {portal.invoices.map((i) => {
            const bal = i.amount_minor - (i.paid_minor ?? 0);
            return (
              <div key={i.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <div className="font-semibold">{i.period}</div>
                  <div className="text-xs text-white/50">Balance {ngn(bal)} · due {fmtDate(i.due_date)}</div>
                </div>
                <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (INVOICE_STATUS_STYLE[i.status] ?? "bg-white/10 text-white/60")}>
                  {String(i.status).replace(/_/g, " ")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bank details */}
        <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/40">Pay into</h2>
        <div className="mt-2 flex flex-col gap-2">
          {portal.bank_accounts.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 py-6 text-center text-sm text-white/50">
              No bank account set yet — ask your manager.
            </div>
          )}
          {portal.bank_accounts.map((b, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-semibold">{b.bank_name}</div>
              <div className="text-sm text-white/70">{b.account_name}</div>
              <div className="font-mono text-lg tracking-wide">{b.account_number}</div>
              {b.instructions && <div className="mt-1 text-xs text-white/50">{b.instructions}</div>}
            </div>
          ))}
        </div>

        {/* Notify form */}
        {outstanding.length > 0 && (
          <form action={reportPayment} className="mt-8 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <input type="hidden" name="token" value={params.token} />
            <h2 className="font-semibold">I’ve paid — notify my manager</h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-white/70">Which invoice</span>
              <select name="invoice_id" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand">
                {outstanding.map((i) => (
                  <option key={i.id} value={i.id} className="bg-ink">
                    {i.period} — balance {ngn(i.amount_minor - (i.paid_minor ?? 0))}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount paid (₦)" name="amount" placeholder="150,000" />
              <Field label="Date paid" name="paid_on" type="date" />
            </div>
            <Field label="Transfer reference (optional)" name="bank_ref" placeholder="e.g. session/transaction ID" />
            <Field label="Note (optional)" name="note" placeholder="Anything we should know" />
            <button className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Notify payment
            </button>
            <p className="text-xs text-white/40">This just tells your manager — they confirm once the money arrives.</p>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  label, name, placeholder, type = "text",
}: {
  label: string; name: string; placeholder?: string; type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input name={name} type={type} placeholder={placeholder}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </label>
  );
}
