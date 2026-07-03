import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/50">
        Units, financials, maintenance and documents attach here next — this detail
        view is the anchor the remaining modules hang off.
      </div>
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
