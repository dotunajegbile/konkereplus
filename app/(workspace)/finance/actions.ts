"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/format";

const STATUS = new Set(["pending", "approved", "paid"]);

async function tenantId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return m.tenant_id as string;
}
const str = (fd: FormData, k: string) => { const v = String(fd.get(k) || "").trim(); return v === "" ? null : v; };

export async function createExpense(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const amount = toMinor(String(formData.get("amount") || "0"));
  if (amount <= 0) redirect(`/finance/expenses/new?error=${encodeURIComponent("Enter an amount")}`);

  const { error } = await supabase.from("expenses").insert({
    tenant_id: tid,
    vendor_id: str(formData, "vendor_id"),
    property_id: str(formData, "property_id"),
    category: str(formData, "category"),
    description: str(formData, "description"),
    amount_minor: amount,
    expense_date: str(formData, "expense_date"),
    status: "pending",
  });
  if (error) redirect(`/finance/expenses/new?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/finance");
  redirect("/finance");
}

export async function setExpenseStatus(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (STATUS.has(status)) await supabase.from("expenses").update({ status }).eq("id", id);
  revalidatePath("/finance");
  redirect("/finance");
}

export async function deleteExpense(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  await supabase.from("expenses").delete().eq("id", String(formData.get("id") || ""));
  revalidatePath("/finance");
  redirect("/finance");
}

export async function createVendor(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect(`/finance/vendors?error=${encodeURIComponent("Vendor name is required")}`);
  const { error } = await supabase.from("vendors").insert({
    tenant_id: tid, name,
    category: str(formData, "category"), contact: str(formData, "contact"),
  });
  if (error) redirect(`/finance/vendors?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/finance/vendors");
  redirect("/finance/vendors");
}

export async function deleteVendor(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  await supabase.from("vendors").delete().eq("id", String(formData.get("id") || ""));
  revalidatePath("/finance/vendors");
  redirect("/finance/vendors");
}
