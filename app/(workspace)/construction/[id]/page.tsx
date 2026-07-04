import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, PROJECT_STATUS_STYLE, RFI_STATUS_STYLE } from "@/lib/format";
import { updateProject, deleteProject, addReport, addRfi, setRfiStatus } from "../actions";
import { ConfirmButton } from "@/components/confirm-button";

const P_STATUS: [string, string][] = [
  ["planning", "Planning"], ["on_track", "On track"], ["at_risk", "At risk"],
  ["on_hold", "On hold"], ["completed", "Completed"],
];
const RFI_NEXT: Record<string, [string, string][]> = {
  draft: [["submitted", "Submit"]],
  submitted: [["review", "Review"], ["approved", "Approve"], ["rejected", "Reject"]],
  review: [["approved", "Approve"], ["rejected", "Reject"]],
};

export default async function ProjectDetailPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: p } = await supabase
    .from("construction_projects")
    .select("*, properties(name, id)")
    .eq("id", params.id)
    .maybeSingle();
  if (!p) notFound();

  const [{ data: reports }, { data: rfis }] = await Promise.all([
    supabase.from("project_reports").select("*").eq("project_id", p.id).order("report_date", { ascending: false }),
    supabase.from("project_rfis").select("*").eq("project_id", p.id).order("created_at", { ascending: false }),
  ]);

  const prop = p.properties as { name?: string; id?: string } | null;
  const spentPct = p.budget_minor ? Math.round((p.spent_minor / p.budget_minor) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/construction" className="text-sm text-white/50 hover:text-white">← Construction</Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{p.name}</h1>
          <p className="mt-1 text-sm text-white/50">{prop?.name ?? "—"} · due {fmtDate(p.due_date)} · {p.crew_count} crew</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={"rounded-full px-3 py-1 text-xs font-medium capitalize " + (PROJECT_STATUS_STYLE[p.status] ?? "bg-white/10 text-white/60")}>{String(p.status).replace(/_/g, " ")}</span>
          <form action={deleteProject}>
            <input type="hidden" name="id" value={p.id} />
            <ConfirmButton message="Delete this project and its reports/RFIs?" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">Delete</ConfirmButton>
          </form>
        </div>
      </div>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      {/* Progress + budget + inline update */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between text-sm"><span className="text-white/50">Progress</span><b>{p.progress}%</b></div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand" style={{ width: `${p.progress}%` }} /></div>
        <div className="mt-3 flex items-center justify-between text-sm"><span className="text-white/50">Budget used</span><b>{ngn(p.spent_minor)} / {ngn(p.budget_minor)} ({spentPct}%)</b></div>

        <form action={updateProject} className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4">
          <input type="hidden" name="id" value={p.id} />
          <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Status</span>
            <select name="status" defaultValue={p.status} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand">
              {P_STATUS.map(([v, l]) => <option key={v} value={v} className="bg-ink">{l}</option>)}
            </select></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Progress %</span>
            <input name="progress" defaultValue={String(p.progress)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand" /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Spent (₦)</span>
            <input name="spent" defaultValue={p.spent_minor ? String(Math.round(p.spent_minor / 100)) : ""} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand" /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Crew</span>
            <input name="crew_count" defaultValue={String(p.crew_count)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand" /></label>
          <button className="col-span-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 sm:col-span-4">Update</button>
        </form>
      </div>

      {/* Daily reports */}
      <h2 className="mt-8 mb-2 font-semibold">Daily reports ({reports?.length ?? 0})</h2>
      <div className="flex flex-col gap-2">
        {(reports ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-sm"><b>{fmtDate(r.report_date)}</b><span className="text-white/50">{r.weather ?? ""} · {r.crew_count} crew</span></div>
            {r.work_done && <div className="mt-1 text-sm text-white/70">{r.work_done}</div>}
            {r.issues && <div className="mt-1 text-xs text-amber-400">⚠ {r.issues}</div>}
          </div>
        ))}
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-brand">+ Add daily report</summary>
        <form action={addReport} className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <input type="hidden" name="project_id" value={p.id} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date" name="report_date" type="date" required />
            <Field label="Weather" name="weather" placeholder="Sunny 31°C" />
            <Field label="Crew" name="crew_count" placeholder="0" />
          </div>
          <Field label="Work done" name="work_done" placeholder="e.g. Level 6 slab formwork" />
          <Field label="Issues" name="issues" placeholder="Any blockers" />
          <button className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Save report</button>
        </form>
      </details>

      {/* RFIs / change orders */}
      <h2 className="mt-8 mb-2 font-semibold">RFIs &amp; change orders ({rfis?.length ?? 0})</h2>
      <div className="flex flex-col gap-2">
        {(rfis ?? []).map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{r.subject}</div>
              <div className="text-xs text-white/50">{r.kind === "change_order" ? "Change order" : "RFI"}{r.impact ? ` · ${r.impact}` : ""}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (RFI_STATUS_STYLE[r.status] ?? "bg-white/10 text-white/60")}>{r.status}</span>
              {(RFI_NEXT[r.status] ?? []).map(([s, label]) => (
                <form key={s} action={setRfiStatus}>
                  <input type="hidden" name="rfi_id" value={r.id} />
                  <input type="hidden" name="project_id" value={p.id} />
                  <input type="hidden" name="status" value={s} />
                  <button className="rounded-lg border border-white/15 px-2 py-1 text-xs hover:bg-white/5">{label}</button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-brand">+ Add RFI / change order</summary>
        <form action={addRfi} className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <input type="hidden" name="project_id" value={p.id} />
          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-1 flex flex-col gap-1"><span className="text-[11px] text-white/50">Type</span>
              <select name="kind" defaultValue="rfi" className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand">
                <option value="rfi" className="bg-ink">RFI</option>
                <option value="change_order" className="bg-ink">Change order</option>
              </select></label>
            <div className="col-span-2"><Field label="Subject" name="subject" placeholder="e.g. Rebar spec clarification" required /></div>
          </div>
          <Field label="Impact (optional)" name="impact" placeholder="e.g. +₦2.1M · +9 days" />
          <button className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Add</button>
        </form>
      </details>
    </div>
  );
}

function Field({ label, name, placeholder, required, type = "text" }: { label: string; name: string; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-white/50">{label}</span>
      <input name={name} type={type} placeholder={placeholder} required={required} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm outline-none focus:border-brand" />
    </label>
  );
}
