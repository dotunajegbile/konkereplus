"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/format";

const P_STATUS = new Set(["planning", "on_track", "at_risk", "on_hold", "completed"]);
const RFI_STATUS = new Set(["draft", "submitted", "review", "approved", "rejected"]);

async function tenantId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return m.tenant_id as string;
}
const num = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};

export async function createProject(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect(`/construction/new?error=${encodeURIComponent("Project name is required")}`);
  const status = String(formData.get("status") || "planning");
  if (!P_STATUS.has(status)) redirect(`/construction/new?error=${encodeURIComponent("Invalid status")}`);

  const { data: p, error } = await supabase.from("construction_projects").insert({
    tenant_id: tid,
    property_id: String(formData.get("property_id") || "").trim() || null,
    name, status,
    budget_minor: toMinor(String(formData.get("budget") || "0")),
    progress: Math.max(0, Math.min(100, num(formData.get("progress")))),
    start_date: String(formData.get("start_date") || "").trim() || null,
    due_date: String(formData.get("due_date") || "").trim() || null,
    crew_count: num(formData.get("crew_count")),
  }).select("id").single();
  if (error || !p) redirect(`/construction/new?error=${encodeURIComponent(error?.message ?? "failed")}`);

  revalidatePath("/construction");
  redirect(`/construction/${p.id}`);
}

export async function updateProject(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "planning");
  const patch: Record<string, unknown> = {
    status: P_STATUS.has(status) ? status : "planning",
    progress: Math.max(0, Math.min(100, num(formData.get("progress")))),
    spent_minor: toMinor(String(formData.get("spent") || "0")),
    crew_count: num(formData.get("crew_count")),
  };
  const { error } = await supabase.from("construction_projects").update(patch).eq("id", id);
  if (error) redirect(`/construction/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/construction/${id}`);
  redirect(`/construction/${id}`);
}

export async function deleteProject(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  await supabase.from("construction_projects").delete().eq("id", id);
  revalidatePath("/construction");
  redirect("/construction");
}

export async function addReport(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const project_id = String(formData.get("project_id") || "");
  const report_date = String(formData.get("report_date") || "").trim();
  const back = `/construction/${project_id}`;
  if (!report_date) redirect(`${back}?error=${encodeURIComponent("Report date is required")}`);
  const { error } = await supabase.from("project_reports").insert({
    tenant_id: tid, project_id, report_date,
    weather: String(formData.get("weather") || "").trim() || null,
    crew_count: num(formData.get("crew_count")),
    work_done: String(formData.get("work_done") || "").trim() || null,
    issues: String(formData.get("issues") || "").trim() || null,
  });
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(back);
  redirect(back);
}

export async function addRfi(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const project_id = String(formData.get("project_id") || "");
  const subject = String(formData.get("subject") || "").trim();
  const back = `/construction/${project_id}`;
  if (!subject) redirect(`${back}?error=${encodeURIComponent("Subject is required")}`);
  const kind = String(formData.get("kind") || "rfi") === "change_order" ? "change_order" : "rfi";
  const { error } = await supabase.from("project_rfis").insert({
    tenant_id: tid, project_id, kind, subject,
    status: "submitted",
    impact: String(formData.get("impact") || "").trim() || null,
  });
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(back);
  redirect(back);
}

export async function setRfiStatus(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("rfi_id") || "");
  const project_id = String(formData.get("project_id") || "");
  const status = String(formData.get("status") || "");
  if (RFI_STATUS.has(status)) {
    await supabase.from("project_rfis").update({ status }).eq("id", id);
  }
  revalidatePath(`/construction/${project_id}`);
  redirect(`/construction/${project_id}`);
}
