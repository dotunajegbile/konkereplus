import { createClient } from "@/lib/supabase/server";
import { ngn } from "@/lib/format";
import { ReportsExport } from "@/components/reports-export";

// Read-only analytics over existing RLS-scoped data. No new tables.
// Income = confirmed payments; expenses = paid expenses (matches the Finance module).
export default async function ReportsPage() {
  const supabase = createClient();

  const [{ data: properties }, { data: units }, { data: invoices }, { data: payments }, { data: expenses }] =
    await Promise.all([
      supabase.from("properties").select("id, name"),
      supabase.from("units").select("id, property_id, status"),
      supabase.from("rent_invoices").select("amount_minor, paid_minor, due_date, status"),
      supabase.from("payments").select("amount_minor, paid_on").eq("status", "confirmed"),
      supabase.from("expenses").select("amount_minor, expense_date").eq("status", "paid"),
    ]);

  const props = properties ?? [];
  const unitRows = units ?? [];
  const inv = (invoices ?? []).filter((i) => i.status !== "void");
  const pays = payments ?? [];
  const exps = expenses ?? [];

  // ---- Headline KPIs ----
  const billed = inv.reduce((s, i) => s + i.amount_minor, 0);
  const collected = inv.reduce((s, i) => s + (i.paid_minor ?? 0), 0);
  const collectionRate = billed ? Math.round((collected / billed) * 100) : 0;
  const occupied = unitRows.filter((u) => u.status === "occupied").length;
  const occupancy = unitRows.length ? Math.round((occupied / unitRows.length) * 100) : 0;
  const income = pays.reduce((s, p) => s + p.amount_minor, 0);
  const expense = exps.reduce((s, e) => s + e.amount_minor, 0);
  const net = income - expense;

  // ---- P&L trend: last 6 months by paid_on / expense_date ----
  const now = new Date();
  const months: { key: string; label: string; income: number; expense: number }[] = [];
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-NG", { month: "short", year: "2-digit" }),
      income: 0,
      expense: 0,
    });
  }
  const mIdx = new Map(months.map((m, i) => [m.key, i]));
  const monthKey = (date: string | null) => (date ? date.slice(0, 7) : null);
  for (const p of pays) {
    const i = mIdx.get(monthKey(p.paid_on) ?? "");
    if (i !== undefined) months[i].income += p.amount_minor;
  }
  for (const e of exps) {
    const i = mIdx.get(monthKey(e.expense_date) ?? "");
    if (i !== undefined) months[i].expense += e.amount_minor;
  }
  const maxBar = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));

  // ---- Arrears aging: outstanding invoice balance by days overdue ----
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets = [
    { label: "Not due", lo: -Infinity, hi: 0, amount: 0, count: 0 },
    { label: "1–30 days", lo: 1, hi: 30, amount: 0, count: 0 },
    { label: "31–60 days", lo: 31, hi: 60, amount: 0, count: 0 },
    { label: "61–90 days", lo: 61, hi: 90, amount: 0, count: 0 },
    { label: "90+ days", lo: 91, hi: Infinity, amount: 0, count: 0 },
  ];
  for (const i of inv) {
    const bal = i.amount_minor - (i.paid_minor ?? 0);
    if (bal <= 0) continue;
    const daysLate = i.due_date
      ? Math.floor((today.getTime() - new Date(i.due_date).getTime()) / 86400000)
      : 0;
    const b = buckets.find((x) => daysLate >= x.lo && daysLate <= x.hi) ?? buckets[0];
    b.amount += bal;
    b.count += 1;
  }
  const arrearsTotal = buckets.slice(1).reduce((s, b) => s + b.amount, 0);

  // ---- Occupancy by property ----
  const perProp = props
    .map((p) => {
      const u = unitRows.filter((x) => x.property_id === p.id);
      const occ = u.filter((x) => x.status === "occupied").length;
      return { name: p.name, units: u.length, occ, rate: u.length ? Math.round((occ / u.length) * 100) : 0 };
    })
    .sort((a, b) => b.units - a.units);

  const exportRows: (string | number)[][] = [
    ["KonkerePlus — Report"],
    [],
    ["Monthly P&L"],
    ["Month", "Income (NGN)", "Expenses (NGN)", "Net (NGN)"],
    ...months.map((m) => [m.label, m.income / 100, m.expense / 100, (m.income - m.expense) / 100]),
    [],
    ["Arrears aging"],
    ["Bucket", "Balance (NGN)", "Invoices"],
    ...buckets.map((b) => [b.label, b.amount / 100, b.count]),
    [],
    ["Occupancy by property"],
    ["Property", "Units", "Occupied", "Occupancy %"],
    ...perProp.map((p) => [p.name, p.units, p.occ, p.rate]),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
          <p className="mt-1 text-white/60">Collections, occupancy, P&amp;L and arrears across your portfolio.</p>
        </div>
        <ReportsExport filename="konkereplus-report.csv" rows={exportRows} />
      </div>

      {/* Headline KPIs */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Kpi label="Collection rate" value={`${collectionRate}%`} bar={collectionRate} />
        <Kpi label="Occupancy" value={`${occupancy}%`} bar={occupancy} />
        <Kpi label="Net (all time)" value={ngn(net)} tone={net >= 0 ? "ok" : "warn"} />
        <Kpi label="Arrears" value={ngn(arrearsTotal)} tone={arrearsTotal > 0 ? "warn" : "ok"} />
      </div>

      {/* P&L trend */}
      <Section title="Profit &amp; loss — last 6 months">
        <div className="flex items-end gap-3 overflow-x-auto pb-2">
          {months.map((m) => (
            <div key={m.key} className="flex min-w-[52px] flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <div className="w-1/2 rounded-t bg-green-500/70" style={{ height: `${(m.income / maxBar) * 100}%` }} title={`Income ${ngn(m.income)}`} />
                <div className="w-1/2 rounded-t bg-red-500/60" style={{ height: `${(m.expense / maxBar) * 100}%` }} title={`Expenses ${ngn(m.expense)}`} />
              </div>
              <div className="text-[11px] text-white/50">{m.label}</div>
              <div className={"text-[11px] font-semibold tabular-nums " + (m.income - m.expense >= 0 ? "text-green-400" : "text-red-400")}>
                {ngn(m.income - m.expense)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-[11px] text-white/50">
          <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm bg-green-500/70" /> Income (confirmed)</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm bg-red-500/60" /> Expenses (paid)</span>
        </div>
      </Section>

      {/* Arrears aging */}
      <Section title="Arrears aging">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-white/40">
                <th className="py-2 font-medium">Bucket</th>
                <th className="py-2 text-right font-medium">Invoices</th>
                <th className="py-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => (
                <tr key={b.label} className="border-t border-white/5">
                  <td className={"py-2 " + (b.lo >= 91 && b.amount > 0 ? "text-red-400" : "")}>{b.label}</td>
                  <td className="py-2 text-right tabular-nums text-white/60">{b.count}</td>
                  <td className="py-2 text-right tabular-nums">{ngn(b.amount)}</td>
                </tr>
              ))}
              <tr className="border-t border-white/10 font-semibold">
                <td className="py-2">Total outstanding</td>
                <td className="py-2 text-right tabular-nums">{buckets.reduce((s, b) => s + b.count, 0)}</td>
                <td className="py-2 text-right tabular-nums">{ngn(buckets.reduce((s, b) => s + b.amount, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* Occupancy by property */}
      <Section title="Occupancy by property">
        {perProp.length === 0 && <div className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-white/50">No properties yet.</div>}
        <div className="flex flex-col gap-2.5">
          {perProp.map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <div className="w-40 shrink-0 truncate text-sm">{p.name}</div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-brand" style={{ width: `${p.rate}%` }} />
              </div>
              <div className="w-24 shrink-0 text-right text-xs tabular-nums text-white/60">{p.occ}/{p.units} · {p.rate}%</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Collections summary */}
      <Section title="Collections">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Billed" value={ngn(billed)} />
          <Stat label="Collected" value={ngn(collected)} tone="ok" />
          <Stat label="Outstanding" value={ngn(billed - collected)} tone={billed - collected > 0 ? "warn" : "ok"} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-semibold" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">{children}</div>
    </section>
  );
}
function Kpi({ label, value, bar, tone }: { label: string; value: string; bar?: number; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className={"mt-1 text-xl font-bold tabular-nums " + (tone === "warn" ? "text-amber-400" : tone === "ok" ? "text-green-400" : "")}>{value}</div>
      {bar !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, bar)}%` }} />
        </div>
      )}
    </div>
  );
}
function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className={"mt-1 text-lg font-bold tabular-nums " + (tone === "warn" ? "text-amber-400" : tone === "ok" ? "text-green-400" : "")}>{value}</div>
    </div>
  );
}
