import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/login/actions";
import { Nav } from "@/components/nav";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, tenants(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  // Not staff? Route linked tenants / owners to their portal; otherwise onboard a new company.
  if (!membership) {
    const { data: party } = await supabase
      .from("tenant_parties").select("id").eq("user_id", user.id).maybeSingle();
    if (party) redirect("/portal");
    const { data: owner } = await supabase
      .from("owners").select("id").eq("user_id", user.id).maybeSingle();
    redirect(owner ? "/owner" : "/onboarding");
  }

  const tenantName = (membership.tenants as { name?: string } | null)?.name ?? "—";
  const role = membership.role.replace(/_/g, " ");

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="hidden flex-col border-r border-white/10 bg-white/[0.02] md:flex">
        <Link href="/dashboard" aria-label="Dashboard" className="flex items-center gap-2 px-4 py-4 transition hover:opacity-80">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">
            K+
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold">KonkerePlus</div>
            <div className="text-[11px] text-white/40">{tenantName}</div>
          </div>
        </Link>
        <div className="flex-1 py-2">
          <Nav />
        </div>
        <div className="border-t border-white/10 p-3 text-[11px] text-white/40">
          <div className="capitalize">{role}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
          <div className="text-sm text-white/50">{tenantName}</div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">{user.email}</span>
            <form action={signout}>
              <button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-6 py-7">{children}</main>
      </div>
    </div>
  );
}
