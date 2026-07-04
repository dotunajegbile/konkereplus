import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import { sendMessage } from "@/app/(workspace)/communications/actions";

// Renders announcements + the caller's message threads with reply boxes.
// Used on both the tenant (/portal) and owner (/owner) portals — RLS scopes everything.
export async function PortalComms({ back }: { back: string }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: announcements }, { data: threads }] = await Promise.all([
    supabase.from("announcements").select("id, title, body, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("message_threads").select("id, subject").order("last_message_at", { ascending: false }),
  ]);

  const threadMsgs = new Map<string, { id: string; body: string; sender_user_id: string; created_at: string }[]>();
  await Promise.all((threads ?? []).map(async (t) => {
    const { data } = await supabase.from("messages").select("id, body, sender_user_id, created_at").eq("thread_id", t.id).order("created_at");
    threadMsgs.set(t.id, data ?? []);
  }));

  return (
    <>
      {(announcements?.length ?? 0) > 0 && (
        <>
          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/40">Announcements</h2>
          <div className="mt-2 flex flex-col gap-2">
            {(announcements ?? []).map((a) => (
              <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="font-semibold text-sm">{a.title}</div>
                {a.body && <div className="mt-0.5 text-sm text-white/60">{a.body}</div>}
                <div className="mt-1 text-[11px] text-white/40">{fmtDate(a.created_at)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {(threads?.length ?? 0) > 0 && (
        <>
          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/40">Messages</h2>
          <div className="mt-2 flex flex-col gap-3">
            {(threads ?? []).map((t) => (
              <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                {t.subject && <div className="mb-2 text-xs font-semibold text-white/60">{t.subject}</div>}
                <div className="flex flex-col gap-1.5">
                  {(threadMsgs.get(t.id) ?? []).map((mm) => {
                    const mine = mm.sender_user_id === user?.id;
                    return (
                      <div key={mm.id} className={"max-w-[80%] rounded-2xl px-3 py-2 text-sm " + (mine ? "self-end bg-brand text-white" : "self-start border border-white/10 bg-white/[0.04]")}>
                        {mm.body}
                      </div>
                    );
                  })}
                </div>
                <form action={sendMessage} className="mt-3 flex gap-2">
                  <input type="hidden" name="thread_id" value={t.id} />
                  <input type="hidden" name="back" value={back} />
                  <input name="body" placeholder="Reply…" className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" />
                  <button className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600">Send</button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
