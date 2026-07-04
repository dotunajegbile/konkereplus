import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default async function OwnersPage() {
  const supabase = createClient();
  const { data: owners, error } = await supabase
    .from("owners")
    .select("id, full_name, email, user_id, property_owners(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Owners</h1>
          <p className="mt-1 text-sm text-white/50">{owners?.length ?? 0} property owners</p>
        </div>
        <Link href="/owners/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + New owner
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error.message}</p>}

      {!error && (owners?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-3xl opacity-40">◈</div>
          <p className="mt-3 font-semibold">No owners yet</p>
          <p className="mt-1 text-sm text-white/50">Add a property owner and share their private portfolio link.</p>
          <Link href="/owners/new" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">+ New owner</Link>
        </div>
      )}

      {(owners?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Properties</th>
                <th className="px-4 py-3 font-semibold">Account</th>
              </tr>
            </thead>
            <tbody>
              {owners!.map((o) => {
                const count = (o.property_owners as { count?: number }[] | null)?.[0]?.count ?? 0;
                return (
                  <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link href={`/owners/${o.id}`} className="flex items-center gap-2.5 hover:text-brand">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">{initials(o.full_name)}</span>
                        <span className="font-semibold">{o.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white/60">{o.email ?? "—"}</td>
                    <td className="px-4 py-3 text-white/70">{count}</td>
                    <td className="px-4 py-3">
                      {o.user_id
                        ? <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400">Linked</span>
                        : <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/50">Invite pending</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
