"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCompany(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect(`/onboarding?error=${encodeURIComponent("Company name is required")}`);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("create_tenant", { tenant_name: name });
  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
