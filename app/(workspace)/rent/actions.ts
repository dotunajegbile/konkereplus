"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/format";

async function tenantId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return { tid: m.tenant_id as string, uid: user.id };
}

// Generate a rent invoice from an active lease (called from the lease page).
export async function generateInvoice(formData: FormData) {
  const supabase = createClient();
  const { tid } = await tenantId(supabase);
  const leaseId = String(formData.get("lease_id") || "");
  const back = `/leases/${leaseId}`;

  const { data: lease } = await supabase
    .from("leases")
    .select("id, unit_id, tenant_party_id, rent_amount_minor, cadence, status")
    .eq("id", leaseId)
    .maybeSingle();
  if (!lease) redirect("/leases");
  if (lease.status !== "active")
    redirect(`${back}?error=${encodeURIComponent("Only active leases can be invoiced")}`);

  const now = new Date();
  const period = `${now.getFullYear()} ${lease.cadence === "annual" ? "Annual" : "Period"}`;
  const due = new Date(now);
  due.setDate(due.getDate() + 7);

  const { error } = await supabase.from("rent_invoices").insert({
    tenant_id: tid,
    lease_id: lease.id,
    tenant_party_id: lease.tenant_party_id,
    unit_id: lease.unit_id,
    period_label: period,
    amount_minor: lease.rent_amount_minor,
    due_date: due.toISOString().slice(0, 10),
    status: "open",
  });
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/rent");
  revalidatePath(back);
  redirect("/rent");
}

// Confirm a reported payment → apply it to the invoice balance (idempotent per report).
export async function confirmPayment(formData: FormData) {
  const supabase = createClient();
  const { uid } = await tenantId(supabase);
  const paymentId = String(formData.get("payment_id") || "");

  const { data: pmt } = await supabase
    .from("payments")
    .select("id, invoice_id, amount_minor, status")
    .eq("id", paymentId)
    .maybeSingle();
  if (!pmt || pmt.status !== "reported") redirect("/rent"); // only apply once

  await supabase
    .from("payments")
    .update({ status: "confirmed", confirmed_by: uid, confirmed_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (pmt.invoice_id) {
    const { data: inv } = await supabase
      .from("rent_invoices")
      .select("amount_minor, paid_minor")
      .eq("id", pmt.invoice_id)
      .maybeSingle();
    if (inv) {
      const paid = (inv.paid_minor ?? 0) + pmt.amount_minor;
      const status = paid >= inv.amount_minor ? "paid" : "part_paid";
      await supabase
        .from("rent_invoices")
        .update({ paid_minor: paid, status })
        .eq("id", pmt.invoice_id);
    }
  }

  revalidatePath("/rent");
  redirect("/rent");
}

export async function rejectPayment(formData: FormData) {
  const supabase = createClient();
  const { uid } = await tenantId(supabase);
  const paymentId = String(formData.get("payment_id") || "");
  await supabase
    .from("payments")
    .update({ status: "rejected", confirmed_by: uid, confirmed_at: new Date().toISOString() })
    .eq("id", paymentId)
    .eq("status", "reported");
  revalidatePath("/rent");
  redirect("/rent");
}

export async function addBankAccount(formData: FormData) {
  const supabase = createClient();
  const { tid } = await tenantId(supabase);
  const bank_name = String(formData.get("bank_name") || "").trim();
  const account_name = String(formData.get("account_name") || "").trim();
  const account_number = String(formData.get("account_number") || "").trim();
  const err = (m: string) => redirect(`/rent/bank-accounts?error=${encodeURIComponent(m)}`);
  if (!bank_name || !account_name || !account_number) err("Bank, account name and number are required");

  const property_id = String(formData.get("property_id") || "").trim() || null;
  const is_default = formData.get("is_default") === "on";

  const { error } = await supabase.from("bank_accounts").insert({
    tenant_id: tid, bank_name, account_name, account_number,
    instructions: String(formData.get("instructions") || "").trim() || null,
    property_id, is_default,
  });
  if (error) err(error.message);

  revalidatePath("/rent/bank-accounts");
  redirect("/rent/bank-accounts");
}
