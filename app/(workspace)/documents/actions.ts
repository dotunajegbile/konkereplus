"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function tenantId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return m.tenant_id as string;
}

// Called after the file has been uploaded to Storage (client-side) to save metadata.
export async function saveDocument(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const storage_path = String(formData.get("storage_path") || "");
  const name = String(formData.get("name") || "").trim();
  if (!storage_path || !name) redirect(`/documents?error=${encodeURIComponent("Upload failed")}`);

  const size = Number(formData.get("size_bytes"));
  const { error } = await supabase.from("documents").insert({
    tenant_id: tid,
    name,
    category: String(formData.get("category") || "").trim() || null,
    property_id: String(formData.get("property_id") || "").trim() || null,
    storage_path,
    mime_type: String(formData.get("mime_type") || "").trim() || null,
    size_bytes: Number.isFinite(size) ? size : null,
    expires_at: String(formData.get("expires_at") || "").trim() || null,
  });
  if (error) redirect(`/documents?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/documents");
  redirect("/documents");
}

export async function deleteDocument(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const path = String(formData.get("storage_path") || "");
  if (path) await supabase.storage.from("documents").remove([path]);
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/documents");
  redirect("/documents");
}
