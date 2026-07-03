import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABEL: Record<string, string> = {
  residential: "Residential", commercial: "Commercial", mixed_use: "Mixed-use",
  industrial: "Industrial", warehouse: "Warehouse", retail: "Retail",
  office: "Office", hotel: "Hotel", student_housing: "Student Housing",
  short_stay: "Short-stay", vacation: "Vacation",
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  completed: "bg-green-500/15 text-green-400",
  under_construction: "bg-amber-500/15 text-amber-400",
  planning: "bg-white/10 text-white/60",
  inactive: "bg-white/10 text-white/50",
};

export default async function PropertiesPage() {
  const supabase = createClient();
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, code, name, type, status, city")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Properties</h1>
          <p className="mt-1 text-sm text-white/50">
            {properties?.length ?? 0} in your portfolio
          </p>
        </div>
        <Link
          href="/properties/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          + New property
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error.message}
        </p>
      )}

      {!error && (properties?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-3xl opacity-40">▦</div>
          <p className="mt-3 font-semibold">No properties yet</p>
          <p className="mt-1 text-sm text-white/50">Add your first property to get started.</p>
          <Link
            href="/properties/new"
            className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            + New property
          </Link>
        </div>
      )}

      {(properties?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {properties!.map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/properties/${p.id}`} className="font-mono text-xs text-white/70 hover:text-brand">
                      {p.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/properties/${p.id}`} className="font-semibold hover:text-brand">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/70">{TYPE_LABEL[p.type] ?? p.type}</td>
                  <td className="px-4 py-3 text-white/60">{p.city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + (STATUS_STYLE[p.status] ?? "bg-white/10 text-white/60")}>
                      {String(p.status).replace(/_/g, " ")}
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
