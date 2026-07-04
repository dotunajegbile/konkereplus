import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import { sendMessage } from "../actions";

export default async function ThreadPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: thread } = await supabase
    .from("message_threads")
    .select("id, subject, tenant_parties(full_name), owners(full_name)")
    .eq("id", params.id)
    .maybeSingle();
  if (!thread) notFound();

  const { data: messages } = await supabase
    .from("messages").select("id, body, sender_user_id, created_at").eq("thread_id", thread.id).order("created_at");

  const who = (thread.tenant_parties as { full_name?: string } | null)?.full_name
    ?? (thread.owners as { full_name?: string } | null)?.full_name ?? "Conversation";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/communications" className="text-sm text-white/50 hover:text-white">← Communications</Link>
      <h1 className="mt-3 text-xl font-extrabold tracking-tight">{who}</h1>
      {thread.subject && <p className="text-sm text-white/50">{thread.subject}</p>}

      {searchParams.error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <div className="mt-5 flex flex-col gap-2">
        {(messages ?? []).map((mm) => {
          const mine = mm.sender_user_id === user?.id;
          return (
            <div key={mm.id} className={"max-w-[80%] rounded-2xl px-4 py-2.5 text-sm " + (mine ? "self-end bg-brand text-white" : "self-start border border-white/10 bg-white/[0.04]")}>
              <div>{mm.body}</div>
              <div className={"mt-1 text-[10px] " + (mine ? "text-white/70" : "text-white/40")}>{fmtDate(mm.created_at)}</div>
            </div>
          );
        })}
        {(messages?.length ?? 0) === 0 && <div className="py-8 text-center text-sm text-white/50">No messages yet — say hello.</div>}
      </div>

      <form action={sendMessage} className="mt-5 flex gap-2">
        <input type="hidden" name="thread_id" value={thread.id} />
        <input type="hidden" name="back" value={`/communications/${thread.id}`} />
        <input name="body" placeholder="Type a message…" className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand" />
        <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">Send</button>
      </form>
    </div>
  );
}
