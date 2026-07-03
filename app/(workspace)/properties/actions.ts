"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TYPES = new Set([
  "residential", "commercial", "mixed_use", "industrial", "warehouse",
  "retail", "office", "hotel", "student_housing", "short_stay", "vacation",
]);

export async function createProperty(formData: FormData) {
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

  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "residential");
  const city = String(formData.get("city") || "").trim() || null;
  let code = String(formData.get("code") || "").trim().toUpperCase();

  const err = (msg: string) =>
    redirect(`/properties/new?error=${encodeURIComponent(msg)}`);
  if (!name) err("Property name is required");
  if (!TYPES.has(type)) err("Invalid property type");
  if (!code) code = "PR-" + Math.random().toString(36).slice(2, 6).toUpperCase();

  const { error } = await supabase.from("properties").insert({
    tenant_id: m.tenant_id,
    name,
    type,
    city,
    code,
  });
  if (error) {
    err(
      error.code === "23505"
        ? `Code "${code}" already exists — choose another`
        : error.message
    );
  }

  revalidatePath("/properties");
  redirect("/properties");
}
