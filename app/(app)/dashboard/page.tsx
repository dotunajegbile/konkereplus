import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve the caller's tenant + role from the multi-tenant schema.
  const { data: membership } = await supabase
    .from("memberships")
    .select("role, tenants(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  // No tenant yet → send them through onboarding first.
  if (!membership) redirect("/onboarding");

  const tenantName =
    (membership?.tenants as { name?: string } | null)?.name ?? "—";

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">
              K+
            </span>
            <span className="font-bold">KonkerePlus</span>
          </div>
          <form action={signout}>
            <button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">
              Sign out
            </button>
          </form>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-white/60">You are authenticated. Foundation is working.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Tile label="Signed in as" value={user.email ?? "—"} />
          <Tile label="Tenant" value={tenantName} />
          <Tile label="Role" value={membership?.role ?? "no membership yet"} />
        </div>

        <p className="mt-8 text-sm text-white/40">
          Next module lands here: Properties → Units → Tenants → Leases → Rent.
        </p>
      </div>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 truncate font-semibold">{value}</div>
    </div>
  );
}
