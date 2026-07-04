import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/login/actions";
import { ngn } from "@/lib/format";
import { PortalComms } from "@/components/portal-comms";

export default async function OwnerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: owner } = await supabase
    .from("owners").select("id, full_name").eq("user_id", user.id).maybeSingle();

  if (!owner) {
    return (
      <main className="min-h-screen grid place-items-center px-6 text-center">
        <div className="max-w-sm">
          <div className="text-3xl opacity-40">◈</div>
          <h1 className="mt-3 text-lg font-bold">No portfolio linked</h1>
          <p className="mt-1 text-sm text-white/50">Open the owner link from your property manager to link this account.</p>
          <form action={signout} className="mt-4"><button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">Sign out</button></form>
        </div>
      </main>
    );
  }

  const [{ data: properties }, { data: units }, { data: invoices }, { data: maint }] = await Promise.all([
    supabase.from("properties").select("id, name, code, city, status").order("name"),
    supabase.from("units").select("id, property_id, status"),
    supabase.from("rent_invoices").select("unit_id, amount_minor, paid_minor"),
    supabase.from("maintenance_requests").select("property_id, cost_minor"),
  ]);

  const unitToProp = new Map((units ?? []).map((u) => [u.id, u.property_id]));
  const perProp = new Map<string, { units: number; occupied: number; income: number; expenses: number }>();
  for (const p of properties ?? []) perProp.set(p.id, { units: 0, occupied: 0, income: 0, expenses: 0 });
  for (const u of units ?? []) {
    const r = perProp.get(u.property_id); if (!r) continue;
    r.units++; if (u.status === "occupied") r.occupied++;
  }
  for (const i of invoices ?? []) {
    const pid = unitToProp.get(i.unit_id as string); const r = pid ? perProp.get(pid) : null;
    if (r) r.income += i.paid_minor ?? 0;
  }
  for (const m of maint ?? []) {
    const r = perProp.get(m.property_id as string); if (r) r.expenses += m.cost_minor ?? 0;
  }

  const totalIncome = [...perProp.values()].reduce((s, r) => s + r.income, 0);
  const totalExpenses = [...perProp.values()].reduce((s, r) => s + r.expenses, 0);
  const totalUnits = [...perProp.values()].reduce((s, r) => s + r.units, 0);
  const totalOcc = [...perProp.values()].reduce((s, r) => s + r.occupied, 0);

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">K+</span>
            <span className="font-bold">KonkerePlus</span>
          </div>
          <form action={signout}><button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">Sign out</button></form>
        </header>

        <h1 className="text-xl font-extrabold tracking-tight">Welcome, {owner.full_name}</h1>
        <p className="mt-1 text-sm text-white/50">Your portfolio — read-only.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Tile label="Properties" value={String(properties?.length ?? 0)} />
          <Tile label="Occupancy" value={totalUnits ? `${Math.round((totalOcc / totalUnits) * 100)}%` : "—"} />
          <Tile label="Income (collected)" value={ngn(totalIncome)} />
          <Tile label="Net" value={ngn(totalIncome - totalExpenses)} />
        </div>

        <h2 className="mt-8 mb-2 font-semibold">Properties</h2>
        <div className="flex flex-col gap-2">
          {(properties?.length ?? 0) === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 py-10 text-center text-sm text-white/50">No properties assigned to you yet.</div>
          )}
          {(properties ?? []).map((p) => {
            const r = perProp.get(p.id)!;
            const occ = r.units ? Math.round((r.occupied / r.units) * 100) : 0;
            return (
              <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <div><div className="font-semibold">{p.name}</div><div className="text-xs text-white/50">{p.city ?? p.code}</div></div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs capitalize text-white/60">{String(p.status).replace(/_/g, " ")}</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                  <Mini label="Units" value={`${r.occupied}/${r.units}`} />
                  <Mini label="Occupancy" value={`${occ}%`} />
                  <Mini label="Income" value={ngn(r.income)} />
                  <Mini label="Expenses" value={ngn(r.expenses)} />
                </div>
              </div>
            );
          })}
        </div>

        <PortalComms back="/owner" />
      </div>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-white/40">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}
