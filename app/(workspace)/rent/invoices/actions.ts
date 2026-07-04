"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function voidInvoice(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const { error } = await supabase.from("rent_invoices").update({ status: "void" }).eq("id", id);
  if (error) redirect(`/rent/invoices/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/rent");
  redirect("/rent");
}

// Flag every past-due, unpaid invoice as overdue (reconciliation sweep).
export async function reconcileOverdue() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("rent_invoices")
    .update({ status: "overdue" })
    .lt("due_date", today)
    .in("status", ["open", "part_paid"]);
  if (error) redirect(`/rent?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/rent");
  redirect("/rent?reconciled=1");
}
