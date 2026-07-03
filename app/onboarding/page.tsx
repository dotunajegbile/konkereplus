import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCompany } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already in a tenant? Skip onboarding.
  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (membership) redirect("/dashboard");

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">
            K+
          </span>
          <span className="font-bold">KonkerePlus</span>
        </div>
        <h1 className="mb-1 text-lg font-bold">Create your company</h1>
        <p className="mb-5 text-sm text-white/50">
          This becomes your isolated tenant. You'll be its administrator.
        </p>

        {searchParams.error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {searchParams.error}
          </p>
        )}

        <form action={createCompany} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Company name</span>
            <input
              name="name"
              required
              autoFocus
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand"
              placeholder="e.g. Konkere Plus Ltd"
            />
          </label>
          <button className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            Create company →
          </button>
        </form>
      </div>
    </main>
  );
}
