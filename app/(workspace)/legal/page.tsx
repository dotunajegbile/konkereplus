import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, CASE_STATUS_STYLE } from "@/lib/format";

export default async function LegalPage() {
  const supabase = createClient();
  const { data: cases, error } = await supabase
    .from("legal_cases")
    .select("id, title, type, party, status, next_date, lawyer")
    .order("created_at", { ascending: false });

  const openCount = (cases ?? []).filter((c) => c.status !== "closed").length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Legal</h1>
          <p className="mt-1 text-sm text-white/50">{openCount} open · {cases?.length ?? 0} total — case tracker, not legal advice</p>
        </div>
        <Link href="/legal/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">+ New case</Link>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error.message}</p>}

      {!error && (cases?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-3xl opacity-40">§</div>
          <p className="mt-3 font-semibold">No cases yet</p>
          <p className="mt-1 text-sm text-white/50">Track disputes, evictions and lawsuits with hearing dates.</p>
          <Link href="/legal/new" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">+ New case</Link>
        </div>
      )}

      {(cases?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Case</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Party</th>
                <th className="px-4 py-3 font-semibold">Next date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases!.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/legal/${c.id}`} className="font-semibold hover:text-brand">{c.title}</Link>
                    {c.lawyer && <div className="text-xs text-white/40">{c.lawyer}</div>}
                  </td>
                  <td className="px-4 py-3 capitalize text-white/70">{c.type}</td>
                  <td className="px-4 py-3 text-white/60">{c.party ?? "—"}</td>
                  <td className="px-4 py-3 text-white/60">{fmtDate(c.next_date)}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (CASE_STATUS_STYLE[c.status] ?? "bg-white/10 text-white/60")}>{String(c.status).replace(/_/g, " ")}</span>
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
