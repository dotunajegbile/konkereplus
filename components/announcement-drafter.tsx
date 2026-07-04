"use client";

import { useState, useTransition } from "react";
import { draftAnnouncement, postAnnouncement } from "@/app/(workspace)/communications/actions";

// Post-announcement form with AI drafting: type a topic, Claude fills title + body,
// you edit and Post (via the existing postAnnouncement action).
export function AnnouncementDrafter() {
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function generate() {
    setError(null);
    start(async () => {
      const res = await draftAnnouncement(topic, audience);
      if (res.ok) { setTitle(res.title); setBody(res.body); }
      else setError(res.error);
    });
  }

  return (
    <form action={postAnnouncement} className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs font-semibold text-white/70">Post an announcement</div>

      <div className="flex gap-2">
        <input
          value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic, e.g. water outage Saturday 8am–2pm"
          className="flex-1 rounded-lg border border-brand/30 bg-brand/[0.04] px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button type="button" onClick={generate} disabled={pending}
          className="shrink-0 rounded-lg border border-brand/40 px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/10 disabled:opacity-50">
          {pending ? "Drafting…" : "✨ Draft"}
        </button>
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}

      <input name="title" required value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Title" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" />
      <textarea name="body" rows={4} value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="Message…" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" />
      <select name="audience" value={audience} onChange={(e) => setAudience(e.target.value)}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand">
        <option value="all" className="bg-ink">Everyone</option>
        <option value="tenants" className="bg-ink">Tenants</option>
        <option value="owners" className="bg-ink">Owners</option>
      </select>
      <button className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Post</button>
    </form>
  );
}
