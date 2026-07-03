"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: [string, string, string][] = [
  ["/dashboard", "Dashboard", "▤"],
  ["/properties", "Properties", "▦"],
  ["/units", "Units", "▥"],
  ["/tenants", "Tenants", "☺"],
];

// Modules coming next — shown disabled so the roadmap is visible in-product.
const SOON: [string, string][] = [
  ["Leases", "✎"],
  ["Rent & Invoices", "₦"],
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {ITEMS.map(([href, label, icon]) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition " +
              (active
                ? "bg-brand/15 text-brand"
                : "text-white/70 hover:bg-white/5 hover:text-white")
            }
          >
            <span className="w-4 text-center opacity-80">{icon}</span>
            {label}
          </Link>
        );
      })}
      <div className="mt-3 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
        Coming next
      </div>
      {SOON.map(([label, icon]) => (
        <div
          key={label}
          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/25"
          title="Next modules"
        >
          <span className="w-4 text-center">{icon}</span>
          {label}
        </div>
      ))}
    </nav>
  );
}
