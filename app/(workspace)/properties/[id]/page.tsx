import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn, UNIT_STATUS_STYLE } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  residential: "Residential", commercial: "Commercial", mixed_use: "Mixed-use",
  industrial: "Industrial", warehouse: "Warehouse", retail: "Retail",
  office: "Office", hotel: "Hotel", student_housing: "Student Housing",
  short_stay: "Short-stay", vacation: "Vacation",
};

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: p } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!p) notFound();

  const { data: units } = await supabase
    .from("units")
    .select("id, unit_number, bedrooms, bathrooms, rent_amount_minor, status")
    .eq("property_id", p.id)
    .order("unit_number");

  const occupied = (units ?? []).filter((u) => u.status === "occupied").length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/properties" className="text-sm text-white/50 hover:text-white">
        ← Properties
      </Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{p.name}</h1>
          <p className="mt-1 font-mono text-xs text-white/50">{p.code}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium capitalize text-white/70">
          {String(p.status).replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Row label="Type" value={TYPE_LABEL[p.type] ?? p.type} />
        <Row label="City" value={p.city ?? "—"} />
        <Row label="Address" value={p.address ?? "—"} />
        <Row label="Added" value={new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-semibold">
          Units{" "}
          <span className="text-white/40">
            ({units?.length ?? 0}{units?.length ? ` · ${occupied} occupied` : ""})
          </span>
        </h2>
        <Link
          href={`/units/new?property=${p.id}`}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/5"
        >
          + Add unit
        </Link>
      </div>

      {(units?.length ?? 0) === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-white/15 py-10 text-center text-sm text-white/50">
          No units yet.{" "}
          <Link href={`/units/new?property=${p.id}`} className="text-brand hover:underline">
            Add the first one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Unit</th>
                <th className="px-4 py-2.5 font-semibold">Config</th>
                <th className="px-4 py-2.5 text-right font-semibold">Rent / yr</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {units!.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold">{u.unit_number}</td>
                  <td className="px-4 py-2.5 text-white/60">{u.bedrooms} bd · {u.bathrooms} ba</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{ngn(u.rent_amount_minor)}</td>
                  <td className="px-4 py-2.5">
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
