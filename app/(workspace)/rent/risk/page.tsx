import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ngn } from "@/lib/format";
import { loadArrearsRisk, RISK_TIER_STYLE } from "@/lib/arrears-risk";

// Arrears-risk board: every tenant ranked by a transparent, rules-based score.
export default async function ArrearsRiskPage() {
  const supabase = createClient();
  const ranked = await loadArrearsRisk(supabase);

  const high = ranked.filter((r) => r.tier === "high").length;
  const medium = ranked.filter((r) => r.tier === "medium").length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Arrears risk</h1>
          <p className="mt-1 text-sm text-white/50">Tenants ranked by likelihood of falling behind — from their own payment history.</p>
        </div>
        <Link href="/rent" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5">← Rent</Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Tile label="High risk" value={String(high)} tone="high" />
        <Tile label="Medium risk" value={String(medium)} tone="medium" />
        <Tile label="Tenants scored" value={String(ranked.length)} />
      </div>

      <p className="mt-4 text-xs text-white/40">
        Score (0–100) weighs outstanding balance, number and age of overdue invoices, and how often past payments arrived late. Rules-based — no data leaves your workspace.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {ranked.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/15 py-14 text-center text-sm text-white/50">No tenants yet.</div>
        )}
        {ranked.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/tenants/${r.id}`} className="font-semibold hover:text-brand">{r.name}</Link>
                  {r.unit && <span className="font-mono text-xs text-white/50">{r.unit}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/50">
                  {r.factors.map((f, i) => <span key={i}>{f}</span>)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {r.balance > 0 && <span className="font-mono text-sm tabular-nums text-white/70">{ngn(r.balance)}</span>}
                <span className={"rounded-full px-2.5 py-1 text-xs font-semibold capitalize " + RISK_TIER_STYLE[r.tier]}>{r.tier} · {r.score}</span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className={"h-full rounded-full " + (r.tier === "high" ? "bg-red-500" : r.tier === "medium" ? "bg-amber-500" : "bg-green-500")} style={{ width: `${r.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "high" | "medium" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className={"mt-1 text-2xl font-bold tabular-nums " + (tone === "high" ? "text-red-400" : tone === "medium" ? "text-amber-400" : "")}>{value}</div>
    </div>
  );
}
