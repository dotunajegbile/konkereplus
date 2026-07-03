import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();

  const { count: propertyCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-white/60">Your workspace is live.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tile label="Properties" value={String(propertyCount ?? 0)} href="/properties" />
        <Tile label="Units" value="—" />
        <Tile label="Active leases" value="—" />
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold">Get started</h2>
        <p className="mt-1 text-sm text-white/60">
          Add your first property — the rest of the modules build on top of it.
        </p>
        <Link
          href="/properties/new"
          className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          + New property
        </Link>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
