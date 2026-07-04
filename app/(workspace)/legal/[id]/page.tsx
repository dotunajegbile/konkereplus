import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, CASE_STAGES, CASE_STATUS_STYLE } from "@/lib/format";
import { updateCase, deleteCase, addEvent, setCaseStatus } from "../actions";
import { ConfirmButton } from "@/components/confirm-button";

export default async function CaseDetailPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("legal_cases")
    .select("*, properties(name, id), tenant_parties(full_name, id)")
    .eq("id", params.id)
    .maybeSingle();
  if (!c) notFound();

  const { data: events } = await supabase
    .from("case_events").select("*").eq("case_id", c.id).order("created_at", { ascending: false });

  const prop = c.properties as { name?: string; id?: string } | null;
  const party = c.tenant_parties as { full_name?: string; id?: string } | null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/legal" className="text-sm text-white/50 hover:text-white">← Legal</Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{c.title}</h1>
          <p className="mt-1 text-sm capitalize text-white/50">{c.type}{c.party ? ` · ${c.party}` : ""}{c.lawyer ? ` · ${c.lawyer}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={"rounded-full px-3 py-1 text-xs font-medium capitalize " + (CASE_STATUS_STYLE[c.status] ?? "bg-white/10 text-white/60")}>{String(c.status).replace(/_/g, " ")}</span>
          <form action={deleteCase}>
            <input type="hidden" name="id" value={c.id} />
            <ConfirmButton message="Delete this case and its events?" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">Delete</ConfirmButton>
          </form>
        </div>
      </div>

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      {/* Status lifecycle */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {CASE_STAGES.map(([s, label]) => (
          <form key={s} action={setCaseStatus}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="status" value={s} />
            <button disabled={s === c.status} className={"rounded-lg px-3 py-1.5 text-xs font-semibold " + (s === c.status ? "bg-brand text-white" : "border border-white/15 hover:bg-white/5")}>{label}</button>
          </form>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Row label="Property" value={prop?.name ?? "—"} href={prop?.id ? `/properties/${prop.id}` : undefined} />
        <Row label="Tenant" value={party?.full_name ?? "—"} href={party?.id ? `/tenants/${party.id}` : undefined} />
        <Row label="Next date" value={fmtDate(c.next_date)} />
      </div>

      {/* Update next date / lawyer / status */}
      <form action={updateCase} className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input type="hidden" name="id" value={c.id} />
        <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Status</span>
          <select name="status" defaultValue={c.status} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand">
            {CASE_STAGES.map(([v, l]) => <option key={v} value={v} className="bg-ink">{l}</option>)}
          </select></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Next date</span>
          <input name="next_date" type="date" defaultValue={c.next_date ?? ""} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] text-white/50">Lawyer</span>
          <input name="lawyer" defaultValue={c.lawyer ?? ""} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand" /></label>
        <button className="col-span-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Save</button>
      </form>

      {/* Case events */}
      <h2 className="mt-8 mb-2 font-semibold">Case log ({events?.length ?? 0})</h2>
      <form action={addEvent} className="flex flex-wrap gap-2">
        <input type="hidden" name="case_id" value={c.id} />
        <select name="kind" defaultValue="note" className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand">
          {["note", "filing", "hearing", "notice"].map((k) => <option key={k} value={k} className="bg-ink capitalize">{k}</option>)}
        </select>
        <input name="event_date" type="date" className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand" />
        <input name="body" placeholder="What happened…" className="min-w-[8rem] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" />
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Log</button>
      </form>
      <div className="mt-3 flex flex-col gap-2">
        {(events ?? []).map((e) => (
          <div key={e.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <div className="flex items-center justify-between text-xs text-white/40"><span className="capitalize">{e.kind}</span><span>{fmtDate(e.event_date ?? e.created_at)}</span></div>
            <div className="text-sm text-white/80">{e.body}</div>
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
