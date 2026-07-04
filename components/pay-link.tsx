"use client";

import { useState } from "react";

export function PayLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/pay/${token}`;
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Tenant pay link</div>
      <p className="mt-1 text-sm text-white/50">Share this private link so the tenant can see the bank details and report payments — no login needed.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white/80">{url}</code>
        <button
          onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <a href={path} target="_blank" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5">Open ↗</a>
      </div>
    </div>
  );
}
