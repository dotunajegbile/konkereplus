import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, LEAD_STAGES, LEAD_STATUS_STYLE } from "@/lib/format";
import { updateLead, deleteLead, addActivity, setLeadStatus } from "../actions";
import { ConfirmButton } from "@/components/confirm-button";

export default async function LeadDetailPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: l } = await supabase
    .from("leads")
    .select("*, properties(name, id)")
    .eq("id", params.id)
    .maybeSingle();
  if (!l) notFound();

  const { data: activities } = await supabase
    .from("lead_activities").select("*").eq("lead_id", l.id).order("created_at", { ascending: false });

  const prop = l.properties as { name?: string; id?: string } | null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/crm" className="text-sm text-white/50 hover:text-white">← CRM</Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{l.name}</h1>
          <p className="mt-1 text-sm text-white/50">{[l.phone, l.email, l.source].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={"rounded-full px-3 py-1 text-xs font-medium capitalize " + (LEAD_STATUS_STYLE[l.status] ?? "bg-white/10 text-white/60")}>{l.status}</span>
          <form action={deleteLead}>
            <input type="hidden" name="id" value={l.id} />
            <ConfirmButton message="Delete this lead and its activity?" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">Delete</ConfirmButton>
          </form>
        </div>
      </div>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      {/* Quick pipeline move */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {LEAD_STAGES.map(([s, label]) => (
          <form key={s} action={setLeadStatus}>
            <input type="hidden" name="id" value={l.id} />
            <input type="hidden" name="status" value={s} />
            <input type="hidden" name="back" value={`/crm/${l.id}`} />
            <button disabled={s === l.status} className={"rounded-lg px-3 py-1.5 text-xs font-semibold " + (s === l.status ? "bg-brand text-white" : "border border-white/15 hover:bg-white/5")}>{label}</button>
          </form>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Row label="Interest" value={l.interest ?? "—"} />
        <Row label="Value" value={ngn(l.value_minor)} />
        <Row label="Property" value={prop?.name ?? "—"} href={prop?.id ? `/properties/${prop.id}` : undefined} />
      </div>

      {/* Edit value / assignee / status */}
      <form action={updateLead} className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input type="hidden" name="id" value={l.id} />
        <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Stage</span>
          <select name="status" defaultValue={l.status} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand">
            {LEAD_STAGES.map(([v, lb]) => <option key={v} value={v} className="bg-ink">{lb}</option>)}
          </select></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Value (₦)</span>
          <input name="value" defaultValue={l.value_minor ? String(Math.round(l.value_minor / 100)) : ""} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Assigned to</span>
          <input name="assigned_to" defaultValue={l.assigned_to ?? ""} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand" /></label>
        <button className="col-span-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Save</button>
      </form>

      {/* Activity log */}
      <h2 className="mt-8 mb-2 font-semibold">Activity ({activities?.length ?? 0})</h2>
      <form action={addActivity} className="flex gap-2">
        <input type="hidden" name="lead_id" value={l.id} />
        <select name="kind" defaultValue="note" className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand">
          {["note", "call", "email", "meeting"].map((k) => <option key={k} value={k} className="bg-ink capitalize">{k}</option>)}
        </select>
        <input name="body" placeholder="Log a note / call…" className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" />
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Log</button>
      </form>
      <div className="mt-3 flex flex-col gap-2">
        {(activities ?? []).map((a) => (
          <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <div className="flex items-center justify-between text-xs text-white/40"><span className="capitalize">{a.kind}</span><span>{fmtDate(a.created_at)}</span></div>
            <div className="text-sm text-white/80">{a.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className={"mt-1 font-semibold " + (href ? "text-brand" : "")}>{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
