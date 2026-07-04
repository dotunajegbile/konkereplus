"use client";

import { useState, useTransition } from "react";
import { draftReminder } from "@/app/(workspace)/rent/risk/actions";
import { createThread } from "@/app/(workspace)/communications/actions";

// One-click AI payment reminder: draft with Claude, edit, then send as a real
// message thread to the tenant (reuses the Communications createThread action).
export function ReminderComposer({ partyId, name }: { partyId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function generate() {
    setError(null);
    setOpen(true);
    start(async () => {
      const res = await draftReminder(partyId);
      if (res.ok) { setDraft(res.draft); setSubject(res.subject); }
      else setError(res.error);
    });
  }

  if (!open) {
    return (
      <button onClick={generate} className="rounded-lg border border-white/15 px-2.5 py-1 text-xs font-medium hover:bg-white/5">
        ✨ Draft reminder
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-brand/30 bg-brand/[0.04] p-3">
      {pending && !draft && <div className="text-xs text-white/60">✨ Drafting a reminder for {name}…</div>}
      {error && <div className="text-xs text-red-400">{error}</div>}
      {draft && (
        <form action={createThread} className="flex flex-col gap-2">
          <input type="hidden" name="recipient" value={`tenant:${partyId}`} />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">✨ AI draft — review before sending</span>
            <button type="button" onClick={generate} className="text-[11px] text-white/50 hover:text-white/80">Regenerate</button>
          </div>
          <input
            name="subject" value={subject} onChange={(e) => setSubject(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <textarea
            name="body" value={draft} onChange={(e) => setDraft(e.target.value)} rows={7}
            className="resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">Send to {name.split(" ")[0]}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
