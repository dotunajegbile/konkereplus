"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const KYC = new Set(["pending", "verified", "corporate"]);

export async function createTenantParty(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: m } = await supabase
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!m) redirect("/onboarding");

  const full_name = String(formData.get("full_name") || "").trim();
  const kyc_status = String(formData.get("kyc_status") || "pending");
  const err = (msg: string) =>
    redirect(`/tenants/new?error=${encodeURIComponent(msg)}`);
  if (!full_name) err("Full name is required");
  if (!KYC.has(kyc_status)) err("Invalid KYC status");

  const str = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v === "" ? null : v;
  };
  const unit_id = str("unit_id");

  const { error } = await supabase.from("tenant_parties").insert({
    tenant_id: m.tenant_id,
    full_name,
    email: str("email"),
    phone: str("phone"),
    government_id: str("government_id"),
    emergency_contact: str("emergency_contact"),
    kyc_status,
    unit_id,
  });
  if (error) err(error.message);

  revalidatePath("/tenants");
  redirect("/tenants");
}

export async function updateTenantParty(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const full_name = String(formData.get("full_name") || "").trim();
  const kyc_status = String(formData.get("kyc_status") || "pending");
  const back = `/tenants/${id}`;
  if (!full_name) redirect(`${back}/edit?error=${encodeURIComponent("Full name is required")}`);
  if (!KYC.has(kyc_status)) redirect(`${back}/edit?error=${encodeURIComponent("Invalid KYC status")}`);

  const str = (k: string) => { const v = String(formData.get(k) || "").trim(); return v === "" ? null : v; };
  const { error } = await supabase.from("tenant_parties").update({
    full_name, kyc_status,
    email: str("email"), phone: str("phone"),
    government_id: str("government_id"), emergency_contact: str("emergency_contact"),
    unit_id: str("unit_id"),
  }).eq("id", id);
  if (error) redirect(`${back}/edit?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/tenants");
  revalidatePath(back);
  redirect(back);
}

export async function deleteTenantParty(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const { error } = await supabase.from("tenant_parties").delete().eq("id", id);
  if (error) redirect(`/tenants/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/tenants");
  redirect("/tenants");
}
