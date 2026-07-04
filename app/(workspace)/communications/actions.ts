"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai";

async function staffTenant(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return { tid: m.tenant_id as string, uid: user.id };
}

// Drafts an announcement (title + body) with Claude from a short topic.
export async function draftAnnouncement(
  topic: string,
  audience: string,
): Promise<{ ok: true; title: string; body: string } | { ok: false; error: string }> {
  const supabase = createClient();
  await staffTenant(supabase);
  const who = audience === "tenants" ? "tenants" : audience === "owners" ? "property owners" : "tenants and owners";
  const prompt = `You are a property manager in Nigeria posting a building announcement to ${who}.
Topic: ${topic || "(general update)"}

Write it in this exact format and nothing else:
TITLE: <a short, clear title, max 8 words>
<one or two short paragraphs, plain text, no markdown, polite and professional>`;
  const res = await callClaude(prompt, 400);
  if (!res.ok) return res;
  const m = res.text.match(/^\s*TITLE:\s*(.+?)\n([\s\S]*)$/i);
  if (!m) return { ok: true, title: (topic || "Announcement").slice(0, 60), body: res.text.trim() };
  return { ok: true, title: m[1].trim(), body: m[2].trim() };
}

export async function createThread(formData: FormData) {
  const supabase = createClient();
  const { tid } = await staffTenant(supabase);
  const recipient = String(formData.get("recipient") || ""); // "tenant:<id>" or "owner:<id>"
  const subject = String(formData.get("subject") || "").trim() || null;
  const [kind, rid] = recipient.split(":");
  if (!rid) redirect(`/communications?error=${encodeURIComponent("Choose a recipient")}`);

  const { data: thread, error } = await supabase.from("message_threads").insert({
    tenant_id: tid, subject,
    tenant_party_id: kind === "tenant" ? rid : null,
    owner_id: kind === "owner" ? rid : null,
  }).select("id").single();
  if (error || !thread) redirect(`/communications?error=${encodeURIComponent(error?.message ?? "failed")}`);

  const first = String(formData.get("body") || "").trim();
  if (first) {
    await supabase.from("messages").insert({ tenant_id: tid, thread_id: thread.id, body: first });
  }
  revalidatePath("/communications");
  redirect(`/communications/${thread.id}`);
}

// Shared: staff (workspace) AND tenant/owner (portal) send into a thread they can access.
export async function sendMessage(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const thread_id = String(formData.get("thread_id") || "");
  const body = String(formData.get("body") || "").trim();
  const back = String(formData.get("back") || "/communications");
  if (!body) redirect(`${back}?error=${encodeURIComponent("Type a message")}`);

  // Thread is visible via RLS only if the caller can access it → gives us tenant_id.
  const { data: thread } = await supabase
    .from("message_threads").select("tenant_id").eq("id", thread_id).maybeSingle();
  if (!thread) redirect(`${back}?error=${encodeURIComponent("Thread not found")}`);

  const { error } = await supabase.from("messages").insert({
    tenant_id: thread.tenant_id, thread_id, sender_user_id: user.id, body,
  });
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(back);
  redirect(back);
}

export async function postAnnouncement(formData: FormData) {
  const supabase = createClient();
  const { tid } = await staffTenant(supabase);
  const title = String(formData.get("title") || "").trim();
  if (!title) redirect(`/communications?error=${encodeURIComponent("Title is required")}`);
  const audience = String(formData.get("audience") || "all");
  const { error } = await supabase.from("announcements").insert({
    tenant_id: tid, title,
    body: String(formData.get("body") || "").trim() || null,
    audience: ["all", "tenants", "owners"].includes(audience) ? audience : "all",
  });
  if (error) redirect(`/communications?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/communications");
  redirect("/communications");
}

export async function deleteAnnouncement(formData: FormData) {
  const supabase = createClient();
  await staffTenant(supabase);
  await supabase.from("announcements").delete().eq("id", String(formData.get("id") || ""));
  revalidatePath("/communications");
  redirect("/communications");
}
