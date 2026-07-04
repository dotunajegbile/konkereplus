import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ngn, UNIT_STATUS_STYLE } from "@/lib/format";

export default async function UnitsPage() {
  const supabase = createClient();
  const { data: units, error } = await supabase
    .from("units")
    .select("id, unit_number, bedrooms, bathrooms, sq_ft, rent_amount_minor, status, property_id, properties(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Units</h1>
          <p className="mt-1 text-sm text-white/50">{units?.length ?? 0} across your properties</p>
        </div>
        <Link href="/units/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + New unit
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error.message}</p>
      )}

      {!error && (units?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-3xl opacity-40">▥</div>
          <p className="mt-3 font-semibold">No units yet</p>
          <p className="mt-1 text-sm text-white/50">Add units to your properties to track occupancy and rent.</p>
          <Link href="/units/new" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            + New unit
          </Link>
        </div>
      )}

      {(units?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Property</th>
                <th className="px-4 py-3 font-semibold">Config</th>
                <th className="px-4 py-3 text-right font-semibold">Rent / yr</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {units!.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">
                    <Link href={`/units/${u.id}/edit`} className="hover:text-brand">{u.unit_number}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/properties/${u.property_id}`} className="text-white/70 hover:text-brand">
                      {(u.properties as { name?: string } | null)?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {u.bedrooms} bd · {u.bathrooms} ba{u.sq_ft ? ` · ${u.sq_ft} ft²` : ""}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{ngn(u.rent_amount_minor)}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium capitalize " + (UNIT_STATUS_STYLE[u.status] ?? "bg-white/10 text-white/60")}>
                      {String(u.status).replace(/_/g, " ")}
                    </span>
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
