"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/format";

const CATEGORY = new Set(["plumbing", "electrical", "hvac", "appliance", "structural", "other"]);
const PRIORITY = new Set(["low", "medium", "high", "emergency"]);
const STATUS = new Set(["open", "assigned", "in_progress", "on_hold", "completed", "cancelled"]);

async function tenantId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return { tid: m.tenant_id as string, uid: user.id };
}

export async function createRequest(formData: FormData) {
  const supabase = createClient();
  const { tid } = await tenantId(supabase);

  const property_id = String(formData.get("property_id") || "");
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "other");
  const priority = String(formData.get("priority") || "medium");
  const err = (m: string) => redirect(`/maintenance/new?error=${encodeURIComponent(m)}`);
  if (!property_id) err("Choose a property");
  if (!title) err("A short title is required");
  if (!CATEGORY.has(category)) err("Invalid category");
  if (!PRIORITY.has(priority)) err("Invalid priority");

  const unit_id = String(formData.get("unit_id") || "").trim() || null;

  const { error } = await supabase.from("maintenance_requests").insert({
    tenant_id: tid,
    property_id,
    unit_id,
    title,
    description: String(formData.get("description") || "").trim() || null,
    category,
    priority,
    status: "open",
  });
  if (error) err(error.message);

  revalidatePath("/maintenance");
  redirect("/maintenance");
}

// Update status / assignee / cost from the detail page.
export async function updateRequest(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const back = `/maintenance/${id}`;

  const patch: Record<string, unknown> = {};
  const status = String(formData.get("status") || "");
  if (status) {
    if (!STATUS.has(status)) redirect(`${back}?error=${encodeURIComponent("Invalid status")}`);
    patch.status = status;
    if (status === "completed" || status === "cancelled") patch.resolved_at = new Date().toISOString();
  }
  if (formData.has("assignee")) patch.assignee = String(formData.get("assignee") || "").trim() || null;
  if (formData.has("cost")) patch.cost_minor = toMinor(String(formData.get("cost") || "0"));

  const { error } = await supabase.from("maintenance_requests").update(patch).eq("id", id);
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/maintenance");
  revalidatePath(back);
  redirect(back);
}
