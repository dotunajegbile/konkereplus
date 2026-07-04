"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TYPE = new Set(["dispute", "eviction", "lawsuit", "other"]);
const STATUS = new Set(["open", "active", "hearing_scheduled", "in_hearing", "judgement", "settlement", "closed", "on_hold"]);

async function tenantId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return m.tenant_id as string;
}
const str = (fd: FormData, k: string) => { const v = String(fd.get(k) || "").trim(); return v === "" ? null : v; };

export async function createCase(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const title = String(formData.get("title") || "").trim();
  if (!title) redirect(`/legal/new?error=${encodeURIComponent("Case title is required")}`);
  const type = String(formData.get("type") || "dispute");

  const { data: c, error } = await supabase.from("legal_cases").insert({
    tenant_id: tid, title,
    type: TYPE.has(type) ? type : "dispute",
    party: str(formData, "party"),
    property_id: str(formData, "property_id"),
    tenant_party_id: str(formData, "tenant_party_id"),
    lawyer: str(formData, "lawyer"),
    next_date: str(formData, "next_date"),
    status: "open",
  }).select("id").single();
  if (error || !c) redirect(`/legal/new?error=${encodeURIComponent(error?.message ?? "failed")}`);

  revalidatePath("/legal");
  redirect(`/legal/${c.id}`);
}

export async function updateCase(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "open");
  const { error } = await supabase.from("legal_cases").update({
    status: STATUS.has(status) ? status : "open",
    next_date: str(formData, "next_date"),
    lawyer: str(formData, "lawyer"),
  }).eq("id", id);
  if (error) redirect(`/legal/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/legal");
  revalidatePath(`/legal/${id}`);
  redirect(`/legal/${id}`);
}

export async function setCaseStatus(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (STATUS.has(status)) await supabase.from("legal_cases").update({ status }).eq("id", id);
  revalidatePath("/legal");
  revalidatePath(`/legal/${id}`);
  redirect(`/legal/${id}`);
}

export async function deleteCase(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  await supabase.from("legal_cases").delete().eq("id", id);
  revalidatePath("/legal");
  redirect("/legal");
}

export async function addEvent(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const case_id = String(formData.get("case_id") || "");
  const body = String(formData.get("body") || "").trim();
  const back = `/legal/${case_id}`;
  if (!body) redirect(`${back}?error=${encodeURIComponent("Add a note")}`);
  const { error } = await supabase.from("case_events").insert({
    tenant_id: tid, case_id, kind: String(formData.get("kind") || "note"),
    body, event_date: str(formData, "event_date"),
  });
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(back);
  redirect(back);
}
