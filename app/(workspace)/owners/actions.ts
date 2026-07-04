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

export async function createOwner(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);

  const full_name = String(formData.get("full_name") || "").trim();
  if (!full_name) redirect(`/owners/new?error=${encodeURIComponent("Owner name is required")}`);
  const email = String(formData.get("email") || "").trim() || null;
  const propertyIds = formData.getAll("property_ids").map(String).filter(Boolean);

  const { data: owner, error } = await supabase
    .from("owners")
    .insert({ tenant_id: tid, full_name, email })
    .select("id")
    .single();
  if (error || !owner) redirect(`/owners/new?error=${encodeURIComponent(error?.message ?? "Could not create owner")}`);

  if (propertyIds.length) {
    const rows = propertyIds.map((pid) => ({ tenant_id: tid, owner_id: owner.id, property_id: pid }));
    await supabase.from("property_owners").insert(rows);
  }

  revalidatePath("/owners");
  redirect(`/owners/${owner.id}`);
}

export async function deleteOwner(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const { error } = await supabase.from("owners").delete().eq("id", id);
  if (error) redirect(`/owners/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/owners");
  redirect("/owners");
}

// Add / remove a property from an owner (from the owner detail page).
export async function addOwnerProperty(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const owner_id = String(formData.get("owner_id") || "");
  const property_id = String(formData.get("property_id") || "");
  if (owner_id && property_id) {
    await supabase.from("property_owners").insert({ tenant_id: tid, owner_id, property_id });
  }
  revalidatePath(`/owners/${owner_id}`);
  redirect(`/owners/${owner_id}`);
}

export async function removeOwnerProperty(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const link_id = String(formData.get("link_id") || "");
  const owner_id = String(formData.get("owner_id") || "");
  await supabase.from("property_owners").delete().eq("id", link_id);
  revalidatePath(`/owners/${owner_id}`);
  redirect(`/owners/${owner_id}`);
}
