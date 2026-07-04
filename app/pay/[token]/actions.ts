"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/format";

// Tenant reports a bank-transfer payment against one of their invoices.
export async function reportPayment(formData: FormData) {
  const token = String(formData.get("token") || "");
  const invoice_id = String(formData.get("invoice_id") || "");
  const amount = toMinor(String(formData.get("amount") || "0"));
  const paid_on = String(formData.get("paid_on") || "").trim() || null;
  const bank_ref = String(formData.get("bank_ref") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;

  const base = `/pay/${token}`;
  if (!invoice_id) redirect(`${base}?error=${encodeURIComponent("Choose which invoice you paid")}`);
  if (amount <= 0) redirect(`${base}?error=${encodeURIComponent("Enter the amount you paid")}`);

  const supabase = createClient();
  const { error } = await supabase.rpc("report_payment", {
    p_token: token,
    p_invoice_id: invoice_id,
    p_amount_minor: amount,
    p_paid_on: paid_on,
    p_bank_ref: bank_ref,
    p_note: note,
  });
  if (error) redirect(`${base}?error=${encodeURIComponent(error.message)}`);

  redirect(`${base}?reported=1`);
}
