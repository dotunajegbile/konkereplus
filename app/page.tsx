import Link from "next/link";

export const metadata = {
  title: "KonkerePlus — Build. Sell. Lease. Manage.",
  description:
    "One platform to build, sell, lease and manage every property — construction, leasing, tenants, rent and maintenance for Nigeria and beyond.",
};

const MODULES: [string, string, string][] = [
  ["⌂", "Construction", "Projects, daily reports and progress from the ground up."],
  ["▦", "Properties & Units", "Property → building → unit hierarchy with occupancy roll-ups."],
  ["✎", "Leasing", "Draft leases, activate, renew — one active lease per unit, enforced."],
  ["₦", "Rent collection", "Bank-transfer rent with tenant self-report and manager reconciliation."],
  ["☺", "Tenants", "Profiles, KYC, a login-less pay-link and a full tenant portal."],
  ["⚒", "Maintenance", "Requests, assignment, SLA and cost — from tenant to resolution."],
];

const STATS: [string, string][] = [
  ["6", "core modules"],
  ["Multi-tenant", "isolated by design"],
  ["Row-level", "security on every table"],
  ["₦", "rent, reconciled"],
];

const LISTINGS: [string, string, string, string, string][] = [
  ["3-Bedroom Apartment", "Lekki, Lagos", "₦1.5M / yr", "For Rent", "from-blue-800 to-brand"],
  ["Premium Office Floor", "Victoria Island", "₦4.2M / 6mo", "For Lease", "from-teal-700 to-green-500"],
  ["Serviced Studio", "Lekki Phase 1", "₦85k / night", "Short-stay", "from-rose-700 to-rose-400"],
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2 font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">K+</span>
            KonkerePlus
          </div>
          <nav className="hidden gap-7 text-sm font-medium text-white/70 md:flex">
            <a href="#modules" className="hover:text-white">Platform</a>
            <a href="#listings" className="hover:text-white">Listings</a>
            <a href="#how" className="hover:text-white">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:text-white">Log in</Link>
            <Link href="/login" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-semibold text-white/70">
          🇳🇬 Built for West-African developers · multi-tenant SaaS
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
          One platform to{" "}
          <span className="bg-gradient-to-r from-brand to-purple-500 bg-clip-text text-transparent">build, sell, lease</span>{" "}
          &amp; manage every property.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
          Construction, leasing, tenants, rent and maintenance — unified, permission-first, and isolated per company.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-600">Open the platform →</Link>
          <a href="#modules" className="rounded-lg border border-white/15 px-6 py-3 font-semibold hover:bg-white/5">See the modules</a>
        </div>
        <div className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map(([a, b]) => (
            <div key={b}><div className="text-2xl font-extrabold">{a}</div><div className="text-xs text-white/50">{b}</div></div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Everything, in one system of record</h2>
          <p className="mt-2 text-white/60">Six deep modules behind a single permission-first login.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(([icon, title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-xl text-brand">{icon}</div>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-white/60">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section id="listings" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Featured listings</h2>
          <p className="mt-2 text-white/60">Residential, commercial and short-stay across Nigeria.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LISTINGS.map(([title, city, price, deal, grad]) => (
            <div key={title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className={`flex h-40 items-start justify-between bg-gradient-to-br ${grad} p-3`}>
                <span className="rounded-full bg-black/30 px-2.5 py-1 text-xs font-semibold text-white">{deal}</span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{title}</h3>
                <div className="text-sm text-white/50">📍 {city}</div>
                <div className="mt-2 text-lg font-extrabold">{price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700/40 to-purple-900/30 p-10 text-center sm:p-14">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Rent that reconciles itself</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Tenants pay by bank transfer and tap “I’ve paid” from their private link. Managers confirm, balances update, receipts generate — no gateway fees.
          </p>
          <Link href="/login" className="mt-7 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-white/90">Start managing →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-8 text-sm text-white/50">
          <div className="flex items-center gap-2 font-bold text-white/80">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-black text-white">K+</span>
            KonkerePlus
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs">🔒 AES-256 · TLS 1.2+</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs">NG · NDPR aligned</span>
          <span className="ml-auto">© 2026 KonkerePlus</span>
          <Link href="/login" className="hover:text-white">Log in</Link>
        </div>
      </footer>
    </div>
  );
}
