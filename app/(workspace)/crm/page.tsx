import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ngn, LEAD_STAGES } from "@/lib/format";

export default async function CrmPage() {
  const supabase = createClient();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, name, source, interest, value_minor, status, assigned_to")
    .order("created_at", { ascending: false });

  const byStatus = new Map<string, typeof leads>();
  for (const [s] of LEAD_STAGES) byStatus.set(s, []);
  for (const l of leads ?? []) byStatus.get(l.status)?.push(l);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">CRM</h1>
          <p className="mt-1 text-sm text-white/50">{leads?.length ?? 0} leads in the pipeline</p>
        </div>
        <Link href="/crm/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">+ New lead</Link>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error.message}</p>}

      {!error && (leads?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-3xl opacity-40">◎</div>
          <p className="mt-3 font-semibold">No leads yet</p>
          <p className="mt-1 text-sm text-white/50">Capture a lead and move it through the pipeline.</p>
          <Link href="/crm/new" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">+ New lead</Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {LEAD_STAGES.map(([s, label]) => {
            const items = byStatus.get(s) ?? [];
            return (
              <div key={s} className="w-60 flex-none">
                <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-white/40">
                  <span>{label}</span><span>{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((l) => (
                    <Link key={l.id} href={`/crm/${l.id}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm">{l.name}</div>
                        {l.value_minor > 0 && <div className="font-mono text-xs text-brand">{ngn(l.value_minor)}</div>}
                      </div>
                      {l.interest && <div className="mt-1 text-xs text-white/50 line-clamp-2">{l.interest}</div>}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
                        <span>{l.source ?? "—"}</span><span>{l.assigned_to ?? ""}</span>
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && <div className="rounded-lg border border-dashed border-white/10 py-4 text-center text-[11px] text-white/30">empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
