"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/format";

const STATUSES = new Set([
  "available", "reserved", "occupied", "notice", "vacant", "maintenance",
]);

export async function createUnit(formData: FormData) {
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

  const propertyId = String(formData.get("property_id") || "");
  const unitNumber = String(formData.get("unit_number") || "").trim();
  const status = String(formData.get("status") || "available");
  const back = propertyId ? `?property=${propertyId}` : "";
  const err = (msg: string) =>
    redirect(`/units/new${back}${back ? "&" : "?"}error=${encodeURIComponent(msg)}`);

  if (!propertyId) err("Choose a property");
  if (!unitNumber) err("Unit number is required");
  if (!STATUSES.has(status)) err("Invalid status");

  const num = (v: FormDataEntryValue | null) => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null;
  };

  const { error } = await supabase.from("units").insert({
    tenant_id: m.tenant_id,
    property_id: propertyId,
    unit_number: unitNumber,
    floor: num(formData.get("floor")),
    bedrooms: num(formData.get("bedrooms")) ?? 0,
    bathrooms: num(formData.get("bathrooms")) ?? 0,
    sq_ft: num(formData.get("sq_ft")),
    rent_amount_minor: toMinor(String(formData.get("rent") || "0")),
    status,
  });
  if (error) {
    err(
      error.code === "23505"
        ? `Unit "${unitNumber}" already exists in this property`
        : error.message
    );
  }

  revalidatePath("/units");
  revalidatePath(`/properties/${propertyId}`);
  redirect("/units");
}

export async function updateUnit(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const unit_number = String(formData.get("unit_number") || "").trim();
  const status = String(formData.get("status") || "available");
  const back = `/units/${id}/edit`;
  if (!unit_number) redirect(`${back}?error=${encodeURIComponent("Unit number is required")}`);

  const num = (v: FormDataEntryValue | null) => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null;
  };
  const { error } = await supabase.from("units").update({
    unit_number, status,
    floor: num(formData.get("floor")),
    bedrooms: num(formData.get("bedrooms")) ?? 0,
    bathrooms: num(formData.get("bathrooms")) ?? 0,
    sq_ft: num(formData.get("sq_ft")),
    rent_amount_minor: toMinor(String(formData.get("rent") || "0")),
  }).eq("id", id);
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/units");
  redirect("/units");
}

export async function deleteUnit(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) redirect(`/units/${id}/edit?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/units");
  redirect("/units");
}
