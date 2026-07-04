import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate, PROJECT_STATUS_STYLE } from "@/lib/format";

export default async function ConstructionPage() {
  const supabase = createClient();
  const { data: projects, error } = await supabase
    .from("construction_projects")
    .select("id, name, status, budget_minor, spent_minor, progress, due_date, crew_count, properties(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Construction</h1>
          <p className="mt-1 text-sm text-white/50">{projects?.length ?? 0} projects</p>
        </div>
        <Link href="/construction/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + New project
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error.message}</p>}

      {!error && (projects?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-3xl opacity-40">⌂</div>
          <p className="mt-3 font-semibold">No projects yet</p>
          <p className="mt-1 text-sm text-white/50">Track construction with budget, progress and daily reports.</p>
          <Link href="/construction/new" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">+ New project</Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {(projects ?? []).map((p) => {
          const used = p.budget_minor ? Math.round((p.spent_minor / p.budget_minor) * 100) : 0;
          return (
            <Link key={p.id} href={`/construction/${p.id}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-white/50">{(p.properties as { name?: string } | null)?.name ?? "—"}</div>
                </div>
                <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (PROJECT_STATUS_STYLE[p.status] ?? "bg-white/10 text-white/60")}>{String(p.status).replace(/_/g, " ")}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/50"><span>Progress</span><b className="text-white/80">{p.progress}%</b></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand" style={{ width: `${p.progress}%` }} /></div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Mini label="Budget" value={ngn(p.budget_minor)} />
                <Mini label="Spent" value={`${used}%`} />
                <Mini label="Due" value={fmtDate(p.due_date)} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[11px] text-white/40">{label}</div><div className="font-semibold tabular-nums">{value}</div></div>;
}
