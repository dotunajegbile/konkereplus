"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/format";

const STATUS = new Set(["new", "contacted", "qualified", "viewing", "offer", "won", "lost"]);

async function tenantId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return m.tenant_id as string;
}

export async function createLead(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect(`/crm/new?error=${encodeURIComponent("Lead name is required")}`);
  const status = String(formData.get("status") || "new");

  const { data: lead, error } = await supabase.from("leads").insert({
    tenant_id: tid, name,
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    source: String(formData.get("source") || "").trim() || null,
    interest: String(formData.get("interest") || "").trim() || null,
    property_id: String(formData.get("property_id") || "").trim() || null,
    value_minor: toMinor(String(formData.get("value") || "0")),
    status: STATUS.has(status) ? status : "new",
    assigned_to: String(formData.get("assigned_to") || "").trim() || null,
  }).select("id").single();
  if (error || !lead) redirect(`/crm/new?error=${encodeURIComponent(error?.message ?? "failed")}`);

  revalidatePath("/crm");
  redirect(`/crm/${lead.id}`);
}

export async function updateLead(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  const { error } = await supabase.from("leads").update({
    status: STATUS.has(status) ? status : "new",
    value_minor: toMinor(String(formData.get("value") || "0")),
    assigned_to: String(formData.get("assigned_to") || "").trim() || null,
  }).eq("id", id);
  if (error) redirect(`/crm/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/crm");
  revalidatePath(`/crm/${id}`);
  redirect(`/crm/${id}`);
}

// Quick status move (from the pipeline board / detail buttons).
export async function setLeadStatus(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (STATUS.has(status)) await supabase.from("leads").update({ status }).eq("id", id);
  revalidatePath("/crm");
  revalidatePath(`/crm/${id}`);
  redirect(String(formData.get("back") || "/crm"));
}

export async function deleteLead(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/crm");
  redirect("/crm");
}

export async function addActivity(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const lead_id = String(formData.get("lead_id") || "");
  const body = String(formData.get("body") || "").trim();
  const back = `/crm/${lead_id}`;
  if (!body) redirect(`${back}?error=${encodeURIComponent("Add a note")}`);
  const { error } = await supabase.from("lead_activities").insert({
    tenant_id: tid, lead_id, kind: String(formData.get("kind") || "note"), body,
  });
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(back);
  redirect(back);
}
