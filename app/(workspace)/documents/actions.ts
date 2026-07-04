"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai";

async function tenantId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return m.tenant_id as string;
}

const MAX_DOC_BYTES = 12 * 1024 * 1024; // 12 MB — keep the base64 payload sane
const INSTRUCTION = `Summarise this document for a property manager. Respond in plain text:
1) A 2–3 sentence plain-English summary of what it is.
2) Then "Key terms:" followed by short bullet lines for any of: parties, property/unit, rent or amounts (in ₦), dates, duration/term, key obligations, termination/notice. Omit anything not present. Do not invent details.`;

// Summarises one stored document with Claude (PDF, text, or image). Server-only.
export async function summariseDocument(
  docId: string,
): Promise<{ ok: true; text: string; name: string } | { ok: false; error: string }> {
  const supabase = createClient();
  await tenantId(supabase);

  const { data: doc } = await supabase
    .from("documents").select("name, storage_path, mime_type, size_bytes").eq("id", docId).maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };
  if ((doc.size_bytes ?? 0) > MAX_DOC_BYTES) return { ok: false, error: "File is too large to summarise (max 12 MB)." };

  const { data: blob, error } = await supabase.storage.from("documents").download(doc.storage_path);
  if (error || !blob) return { ok: false, error: "Could not read the file from storage." };

  const bytes = Buffer.from(await blob.arrayBuffer());
  const mime = (doc.mime_type || "").toLowerCase();

  let content: string | unknown[];
  if (mime.includes("pdf")) {
    content = [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: bytes.toString("base64") } },
      { type: "text", text: INSTRUCTION },
    ];
  } else if (mime.startsWith("image/")) {
    content = [
      { type: "image", source: { type: "base64", media_type: mime, data: bytes.toString("base64") } },
      { type: "text", text: INSTRUCTION },
    ];
  } else if (mime.startsWith("text/") || mime.includes("json") || mime.includes("csv")) {
    content = `${INSTRUCTION}\n\n--- DOCUMENT: ${doc.name} ---\n${bytes.toString("utf8").slice(0, 40000)}`;
  } else {
    return { ok: false, error: `Can't summarise this file type (${doc.mime_type || "unknown"}). Supported: PDF, text, images.` };
  }

  const res = await callClaude(content, 700);
  if (!res.ok) return res;
  return { ok: true, text: res.text, name: doc.name };
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
