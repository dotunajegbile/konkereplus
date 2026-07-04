import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import { createThread, postAnnouncement, deleteAnnouncement } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";

export default async function CommunicationsPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const [{ data: threads }, { data: announcements }, { data: tenants }, { data: owners }] = await Promise.all([
    supabase.from("message_threads").select("id, subject, last_message_at, tenant_parties(full_name), owners(full_name)").order("last_message_at", { ascending: false }),
    supabase.from("announcements").select("id, title, body, audience, created_at").order("created_at", { ascending: false }),
    supabase.from("tenant_parties").select("id, full_name").order("full_name"),
    supabase.from("owners").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Communications</h1>
      <p className="mt-1 text-sm text-white/50">Message tenants &amp; owners, and post announcements.</p>
      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Threads */}
        <section>
          <h2 className="mb-2 font-semibold">Conversations ({threads?.length ?? 0})</h2>
          <div className="flex flex-col gap-2">
            {(threads ?? []).map((t) => {
              const who = (t.tenant_parties as { full_name?: string } | null)?.full_name
                ?? (t.owners as { full_name?: string } | null)?.full_name ?? "—";
              return (
                <Link key={t.id} href={`/communications/${t.id}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{who}</span>
                    <span className="text-[11px] text-white/40">{fmtDate(t.last_message_at)}</span>
                  </div>
                  {t.subject && <div className="text-xs text-white/50">{t.subject}</div>}
                </Link>
              );
            })}
            {(threads?.length ?? 0) === 0 && <div className="rounded-xl border border-dashed border-white/15 py-6 text-center text-sm text-white/50">No conversations yet.</div>}
          </div>

          <form action={createThread} className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-semibold text-white/70">New conversation</div>
            <select name="recipient" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand">
              <optgroup label="Tenants" className="bg-ink">
                {(tenants ?? []).map((t) => <option key={t.id} value={`tenant:${t.id}`} className="bg-ink">{t.full_name}</option>)}
              </optgroup>
              <optgroup label="Owners" className="bg-ink">
                {(owners ?? []).map((o) => <option key={o.id} value={`owner:${o.id}`} className="bg-ink">{o.full_name}</option>)}
              </optgroup>
            </select>
            <input name="subject" placeholder="Subject (optional)" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" />
            <input name="body" placeholder="First message…" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" />
            <button className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Start</button>
          </form>
        </section>

        {/* Announcements */}
        <section>
          <h2 className="mb-2 font-semibold">Announcements ({announcements?.length ?? 0})</h2>
          <div className="flex flex-col gap-2">
            {(announcements ?? []).map((a) => (
              <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm">{a.title}</div>
                  <form action={deleteAnnouncement}><input type="hidden" name="id" value={a.id} /><ConfirmButton message="Delete announcement?" className="text-xs text-red-400 hover:underline">✕</ConfirmButton></form>
                </div>
                {a.body && <div className="mt-0.5 text-xs text-white/60">{a.body}</div>}
                <div className="mt-1 text-[11px] text-white/40">to {a.audience} · {fmtDate(a.created_at)}</div>
              </div>
            ))}
            {(announcements?.length ?? 0) === 0 && <div className="rounded-xl border border-dashed border-white/15 py-6 text-center text-sm text-white/50">No announcements.</div>}
          </div>

          <form action={postAnnouncement} className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-semibold text-white/70">Post an announcement</div>
            <input name="title" placeholder="Title" required className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" />
            <textarea name="body" rows={2} placeholder="Message…" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" />
            <select name="audience" defaultValue="all" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand">
              <option value="all" className="bg-ink">Everyone</option>
              <option value="tenants" className="bg-ink">Tenants</option>
              <option value="owners" className="bg-ink">Owners</option>
            </select>
            <button className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Post</button>
          </form>
        </section>
      </div>
    </div>
  );
}
