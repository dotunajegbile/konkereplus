"use client";

import { useState, useTransition } from "react";
import { summariseDocument } from "@/app/(workspace)/documents/actions";

// "Summarise" button → calls Claude → shows the result in a modal overlay.
export function DocumentSummary({ docId, name }: { docId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run() {
    setError(null); setText(""); setOpen(true);
    start(async () => {
      const res = await summariseDocument(docId);
      if (res.ok) setText(res.text);
      else setError(res.error);
    });
  }

  return (
    <>
      <button onClick={run} className="rounded-lg border border-brand/40 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/10">
        ✨ Summarise
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-ink p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-brand">✨ AI summary</div>
                <div className="truncate text-sm font-semibold">{name}</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg border border-white/15 px-2 py-0.5 text-sm hover:bg-white/5">✕</button>
            </div>
            {pending && <div className="py-6 text-center text-sm text-white/60">✨ Reading the document…</div>}
            {error && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
            {text && <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">{text}</div>}
            <p className="mt-4 text-[11px] text-white/30">AI-generated — verify against the original before relying on it.</p>
          </div>
        </div>
      )}
    </>
  );
}
