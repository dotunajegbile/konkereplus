"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/format";

const CADENCE = new Set(["monthly", "quarterly", "biannual", "annual"]);
const STATUS = new Set([
  "draft", "pending_approval", "pending_signature", "active", "expired", "terminated", "renewed",
]);

async function tenantId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");
  return m.tenant_id as string;
}

export async function createLease(formData: FormData) {
  const supabase = createClient();
  const tid = await tenantId(supabase);

  const tenant_party_id = String(formData.get("tenant_party_id") || "");
  const unit_id = String(formData.get("unit_id") || "");
  const cadence = String(formData.get("cadence") || "annual");
  const err = (msg: string) => redirect(`/leases/new?error=${encodeURIComponent(msg)}`);
  if (!tenant_party_id) err("Choose a tenant");
  if (!unit_id) err("Choose a unit");
  if (!CADENCE.has(cadence)) err("Invalid cadence");

  const date = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v === "" ? null : v;
  };
  const esc = String(formData.get("escalation_pct") || "").trim();

  const { error } = await supabase.from("leases").insert({
    tenant_id: tid,
    unit_id,
    tenant_party_id,
    reference: "LSE-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    status: "draft",
    start_date: date("start_date"),
    end_date: date("end_date"),
    rent_amount_minor: toMinor(String(formData.get("rent") || "0")),
    deposit_minor: toMinor(String(formData.get("deposit") || "0")),
    cadence,
    escalation_pct: esc === "" ? null : Number(esc),
  });
  if (error) err(error.message);

  revalidatePath("/leases");
  redirect("/leases");
}

export async function updateLease(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const back = `/leases/${id}`;
  const cadence = String(formData.get("cadence") || "annual");
  if (!CADENCE.has(cadence)) redirect(`${back}/edit?error=${encodeURIComponent("Invalid cadence")}`);
  const date = (k: string) => { const v = String(formData.get(k) || "").trim(); return v === "" ? null : v; };
  const esc = String(formData.get("escalation_pct") || "").trim();

  const { error } = await supabase.from("leases").update({
    start_date: date("start_date"),
    end_date: date("end_date"),
    rent_amount_minor: toMinor(String(formData.get("rent") || "0")),
    deposit_minor: toMinor(String(formData.get("deposit") || "0")),
    cadence,
    escalation_pct: esc === "" ? null : Number(esc),
  }).eq("id", id);
  if (error) redirect(`${back}/edit?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/leases");
  revalidatePath(back);
  redirect(back);
}

export async function deleteLease(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);
  const id = String(formData.get("id") || "");
  const { error } = await supabase.from("leases").delete().eq("id", id);
  if (error) redirect(`/leases/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/leases");
  redirect("/leases");
}

// Advance the lease lifecycle, with unit/tenant side effects on activate/terminate.
export async function setLeaseStatus(formData: FormData) {
  const supabase = createClient();
  await tenantId(supabase);

  const id = String(formData.get("lease_id") || "");
  const status = String(formData.get("status") || "");
  const back = `/leases/${id}`;
  if (!id || !STATUS.has(status)) redirect(`${back}?error=${encodeURIComponent("Invalid transition")}`);

  const { data: lease } = await supabase
    .from("leases").select("unit_id, tenant_party_id").eq("id", id).maybeSingle();
  if (!lease) redirect("/leases");

  const { error } = await supabase.from("leases").update({ status }).eq("id", id);
  if (error) {
    // BR-01: partial unique index rejects a second active lease on the unit.
    const msg = error.code === "23505"
      ? "That unit already has an active lease (BR-01)."
      : error.message;
    redirect(`${back}?error=${encodeURIComponent(msg)}`);
  }

  if (status === "active") {
    await supabase.from("units").update({ status: "occupied" }).eq("id", lease.unit_id);
    await supabase.from("tenant_parties").update({ unit_id: lease.unit_id }).eq("id", lease.tenant_party_id);
  } else if (status === "terminated" || status === "expired") {
    await supabase.from("units").update({ status: "vacant" }).eq("id", lease.unit_id);
  }

  revalidatePath("/leases");
  revalidatePath(back);
  redirect(back);
}
