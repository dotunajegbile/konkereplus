import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MAINT_STATUS_STYLE, PRIORITY_STYLE } from "@/lib/format";

export default async function MaintenancePage() {
  const supabase = createClient();
  const { data: reqs, error } = await supabase
    .from("maintenance_requests")
    .select("id, title, category, priority, status, assignee, properties(name), units(unit_number)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Maintenance</h1>
          <p className="mt-1 text-sm text-white/50">{reqs?.length ?? 0} requests</p>
        </div>
        <Link href="/maintenance/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + New request
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error.message}</p>}

      {!error && (reqs?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-3xl opacity-40">⚒</div>
          <p className="mt-3 font-semibold">No maintenance requests</p>
          <p className="mt-1 text-sm text-white/50">Log a request against a property or unit.</p>
          <Link href="/maintenance/new" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            + New request
          </Link>
        </div>
      )}

      {(reqs?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Request</th>
                <th className="px-4 py-3 font-semibold">Property</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Assignee</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {reqs!.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/maintenance/${r.id}`} className="font-semibold hover:text-brand">{r.title}</Link>
                    <div className="text-xs capitalize text-white/40">{r.category}{(r.units as { unit_number?: string } | null)?.unit_number ? ` · ${(r.units as { unit_number?: string }).unit_number}` : ""}</div>
                  </td>
                  <td className="px-4 py-3 text-white/60">{(r.properties as { name?: string } | null)?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (PRIORITY_STYLE[r.priority] ?? "bg-white/10 text-white/60")}>{r.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{r.assignee ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (MAINT_STATUS_STYLE[r.status] ?? "bg-white/10 text-white/60")}>{String(r.status).replace(/_/g, " ")}</span>
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
