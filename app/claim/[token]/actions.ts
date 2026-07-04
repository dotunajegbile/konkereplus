"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Sign up (or log in) and link the account to the tenancy behind the token.
export async function claimAccount(formData: FormData) {
  const token = String(formData.get("token") || "");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const mode = String(formData.get("mode") || "signup");
  const base = `/claim/${token}`;

  const supabase = createClient();
  const { error: authErr } =
    mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
  if (authErr) redirect(`${base}?error=${encodeURIComponent(authErr.message)}`);

  const { error: claimErr } = await supabase.rpc("claim_tenant_party", { p_token: token });
  if (claimErr) redirect(`${base}?error=${encodeURIComponent(claimErr.message)}`);

  revalidatePath("/", "layout");
  redirect("/portal");
}

// Already logged in → just link.
export async function linkExisting(formData: FormData) {
  const token = String(formData.get("token") || "");
  const supabase = createClient();
  const { error } = await supabase.rpc("claim_tenant_party", { p_token: token });
  if (error) redirect(`/claim/${token}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/portal");
}
