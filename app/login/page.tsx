import { login, signup } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-7">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">
            K+
          </span>
          <span className="font-bold">KonkerePlus</span>
        </div>
        <h1 className="mb-1 text-lg font-bold">Log in</h1>
        <p className="mb-5 text-sm text-white/50">
          Access the KonkerePlus workspace.
        </p>

        {searchParams.error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {searchParams.error}
          </p>
        )}
        {searchParams.message && (
          <p className="mb-4 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
            {searchParams.message}
          </p>
        )}

        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand"
              placeholder="you@company.com"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-white/70">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand"
              placeholder="••••••••"
            />
          </label>
          <button
            formAction={login}
            className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Log in
          </button>
          <button
            formAction={signup}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"
          >
            Create account
          </button>
        </form>
      </div>
    </main>
  );
}
