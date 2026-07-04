import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, MAINT_STATUS_STYLE, PRIORITY_STYLE } from "@/lib/format";
import { updateRequest } from "../actions";

const NEXT: Record<string, [string, string][]> = {
  open: [["assigned", "Assign"], ["in_progress", "Start work"], ["cancelled", "Cancel"]],
  assigned: [["in_progress", "Start work"], ["on_hold", "Hold"], ["cancelled", "Cancel"]],
  in_progress: [["completed", "Mark complete"], ["on_hold", "Hold"]],
  on_hold: [["in_progress", "Resume"], ["cancelled", "Cancel"]],
};

export default async function RequestDetailPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: r } = await supabase
    .from("maintenance_requests")
    .select("*, properties(name), units(unit_number, property_id)")
    .eq("id", params.id)
    .maybeSingle();

  if (!r) notFound();
  const prop = r.properties as { name?: string } | null;
  const unit = r.units as { unit_number?: string; property_id?: string } | null;
  const actions = NEXT[r.status] ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/maintenance" className="text-sm text-white/50 hover:text-white">← Maintenance</Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{r.title}</h1>
          <p className="mt-1 text-sm text-white/50 capitalize">
            {r.category} · {prop?.name}{unit?.unit_number ? ` · ${unit.unit_number}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={"rounded-full px-3 py-1 text-xs font-medium capitalize " + (MAINT_STATUS_STYLE[r.status] ?? "bg-white/10 text-white/60")}>{String(r.status).replace(/_/g, " ")}</span>
          <span className={"rounded-full px-3 py-1 text-xs font-medium capitalize " + (PRIORITY_STYLE[r.priority] ?? "bg-white/10 text-white/60")}>{r.priority}</span>
        </div>
      </div>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>
      )}

      {r.description && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">{r.description}</div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Row label="Assignee" value={r.assignee ?? "Unassigned"} />
        <Row label="Cost" value={ngn(r.cost_minor)} />
        <Row label="Logged" value={fmtDate(r.created_at)} />
      </div>

      {/* Lifecycle */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Status</div>
        {actions.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">This request is {r.status.replace(/_/g, " ")} — no further actions.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map(([status, label]) => (
              <form key={status} action={updateRequest}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value={status} />
                <button className={
                  "rounded-lg px-4 py-2 text-sm font-semibold " +
                  (status === "completed" ? "bg-brand text-white hover:bg-brand-600"
                    : status === "cancelled" ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                    : "border border-white/15 hover:bg-white/5")
                }>{label}</button>
              </form>
            ))}
          </div>
        )}
      </div>

      {/* Assign + cost */}
      <form action={updateRequest} className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <input type="hidden" name="id" value={r.id} />
        <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Assignment</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Assignee (vendor / technician)</span>
            <input name="assignee" defaultValue={r.assignee ?? ""} placeholder="e.g. CoolAir Ltd" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Cost (₦)</span>
            <input name="cost" defaultValue={r.cost_minor ? String(Math.round(r.cost_minor / 100)) : ""} placeholder="0" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
          </label>
        </div>
        <button className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5">Save</button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
