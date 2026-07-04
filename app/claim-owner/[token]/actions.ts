"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function claimOwnerAccount(formData: FormData) {
  const token = String(formData.get("token") || "");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const mode = String(formData.get("mode") || "signup");
  const base = `/claim-owner/${token}`;

  const supabase = createClient();
  const { error: authErr } =
    mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
  if (authErr) redirect(`${base}?error=${encodeURIComponent(authErr.message)}`);

  const { error: claimErr } = await supabase.rpc("claim_owner", { p_token: token });
  if (claimErr) redirect(`${base}?error=${encodeURIComponent(claimErr.message)}`);

  revalidatePath("/", "layout");
  redirect("/owner");
}

export async function linkOwnerExisting(formData: FormData) {
  const token = String(formData.get("token") || "");
  const supabase = createClient();
  const { error } = await supabase.rpc("claim_owner", { p_token: token });
  if (error) redirect(`/claim-owner/${token}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/owner");
}
