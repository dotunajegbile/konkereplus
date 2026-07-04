import { createClient } from "@/lib/supabase/server";
import { claimOwnerAccount, linkOwnerExisting } from "./actions";

export default async function ClaimOwnerPage({
  params, searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string; mode?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: name } = await supabase.rpc("owner_claim_info", { p_token: params.token });
  const mode = searchParams.mode === "login" ? "login" : "signup";

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-7">
        <div className="mb-5 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">K+</span>
          <span className="font-bold">KonkerePlus</span>
        </div>

        {!name ? (
          <p className="text-sm text-white/60">This link isn’t recognised. Ask your property manager for your owner link.</p>
        ) : (
          <>
            <h1 className="text-lg font-bold">Your property portfolio</h1>
            <p className="mt-1 text-sm text-white/50">Hi {name} — set up an account to see occupancy, income and expenses across your properties.</p>

            {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

            {user ? (
              <form action={linkOwnerExisting} className="mt-5">
                <input type="hidden" name="token" value={params.token} />
                <p className="mb-3 text-sm text-white/60">You’re signed in as <b>{user.email}</b>.</p>
                <button className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Link this portfolio to my account</button>
              </form>
            ) : (
              <form action={claimOwnerAccount} className="mt-5 flex flex-col gap-3">
                <input type="hidden" name="token" value={params.token} />
                <input type="hidden" name="mode" value={mode} />
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-white/70">Email</span>
                  <input name="email" type="email" required autoComplete="email" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" placeholder="you@email.com" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-white/70">Password</span>
                  <input name="password" type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" placeholder="••••••••" />
                </label>
                <button className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                  {mode === "login" ? "Log in & link" : "Create account & link"}
                </button>
                <a href={`/claim-owner/${params.token}?mode=${mode === "login" ? "signup" : "login"}`} className="text-center text-xs text-white/50 hover:text-white">
                  {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
                </a>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
