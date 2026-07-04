"use client";

import { useState, useTransition } from "react";
import { askReports } from "@/app/(workspace)/reports/actions";

const SUGGESTIONS = ["Who is more than 60 days behind?", "Total arrears by property", "Which tenants owe the most?"];

// Ask-your-data box on the Reports page. Claude answers over live figures.
export function ReportsAsk() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function ask(question?: string) {
    const query = (question ?? q).trim();
    if (!query) return;
    if (question) setQ(question);
    setError(null); setAnswer("");
    start(async () => {
      const res = await askReports(query);
      if (res.ok) setAnswer(res.text);
      else setError(res.error);
    });
  }

  return (
    <div className="mt-6 rounded-xl border border-brand/25 bg-brand/[0.04] p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand">✨ Ask your data</div>
      <div className="mt-2 flex gap-2">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
          placeholder="e.g. tenants more than 60 days behind in Lekki"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button onClick={() => ask()} disabled={pending}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
          {pending ? "Thinking…" : "Ask"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)} disabled={pending}
            className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-white/50 hover:bg-white/5 disabled:opacity-50">{s}</button>
        ))}
      </div>
      {error && <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
      {answer && <div className="mt-3 whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-white/80">{answer}</div>}
    </div>
  );
}
