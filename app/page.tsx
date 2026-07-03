import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand font-black text-white">
          K+
        </span>
        <span className="text-2xl font-extrabold tracking-tight">KonkerePlus</span>
      </div>
      <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        The real platform is being built here.
      </h1>
      <p className="max-w-xl text-white/60">
        Next.js + Supabase foundation. Auth and the multi-tenant core come first,
        then Properties → Units → Tenants → Leases → Rent.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-600"
        >
          Log in
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-white/15 px-5 py-2.5 font-semibold hover:bg-white/5"
        >
          Dashboard
        </Link>
      </div>
      <p className="text-xs text-white/40">
        Marketing prototype still lives at{" "}
        <a className="underline" href="https://konkereplus.com">
          konkereplus.com
        </a>
      </p>
    </main>
  );
}
