"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/format";

async function myParty(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: party } = await supabase
    .from("tenant_parties")
    .select("id, tenant_id, unit_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!party) redirect("/login");
  return party;
}

export async function reportPaymentPortal(formData: FormData) {
  const supabase = createClient();
  const party = await myParty(supabase);
  const invoice_id = String(formData.get("invoice_id") || "");
  const amount = toMinor(String(formData.get("amount") || "0"));
  if (!invoice_id) redirect(`/portal?error=${encodeURIComponent("Choose which invoice you paid")}`);
  if (amount <= 0) redirect(`/portal?error=${encodeURIComponent("Enter the amount you paid")}`);

  const { error } = await supabase.from("payments").insert({
    tenant_id: party.tenant_id,
    invoice_id,
    tenant_party_id: party.id,
    amount_minor: amount,
    method: "bank_transfer",
    bank_ref: String(formData.get("bank_ref") || "").trim() || null,
    paid_on: String(formData.get("paid_on") || "").trim() || null,
    note: String(formData.get("note") || "").trim() || null,
    status: "reported",
  });
  if (error) redirect(`/portal?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/portal");
  redirect("/portal?reported=1");
}

export async function reportIssuePortal(formData: FormData) {
  const supabase = createClient();
  const party = await myParty(supabase);
  const title = String(formData.get("title") || "").trim();
  if (!title) redirect(`/portal?error=${encodeURIComponent("Describe the issue")}`);
  if (!party.unit_id) redirect(`/portal?error=${encodeURIComponent("No unit is assigned to you yet")}`);

  const { data: unit } = await supabase
    .from("units").select("property_id").eq("id", party.unit_id).maybeSingle();

  const { error } = await supabase.from("maintenance_requests").insert({
    tenant_id: party.tenant_id,
    property_id: unit?.property_id,
    unit_id: party.unit_id,
    tenant_party_id: party.id,
    title,
    description: String(formData.get("description") || "").trim() || null,
    category: String(formData.get("category") || "other"),
    priority: String(formData.get("priority") || "medium"),
    status: "open",
  });
  if (error) redirect(`/portal?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/portal");
  redirect("/portal?issue=1");
}
