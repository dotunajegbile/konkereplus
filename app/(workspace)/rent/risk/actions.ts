"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn, fmtDate } from "@/lib/format";

type DraftResult = { ok: true; draft: string; subject: string } | { ok: false; error: string };

// Generates a payment-reminder draft for one tenant with Claude.
// Server-only: the API key never reaches the browser. RLS scopes the tenant read.
export async function draftReminder(partyId: string): Promise<DraftResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "AI is not configured yet — add ANTHROPIC_API_KEY in Netlify to enable drafting." };

  // Tenant context (RLS: staff only see parties in their own tenant).
  const { data: party } = await supabase
    .from("tenant_parties")
    .select("full_name, units(unit_number, properties(name))")
    .eq("id", partyId)
    .maybeSingle();
  if (!party) return { ok: false, error: "Tenant not found." };

  const { data: invoices } = await supabase
    .from("rent_invoices")
    .select("period_label, amount_minor, paid_minor, status, due_date")
    .eq("tenant_party_id", partyId);

  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const unpaid = (invoices ?? []).filter((i) => i.status !== "void" && i.amount_minor - (i.paid_minor ?? 0) > 0);
  const balance = unpaid.reduce((s, i) => s + (i.amount_minor - (i.paid_minor ?? 0)), 0);
  const overdue = unpaid
    .filter((i) => i.due_date && new Date(i.due_date) < t0)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1));

  const unit = party.units as { unit_number?: string; properties?: { name?: string } } | null;
  const lines = overdue.length
    ? overdue.map((i) => `- ${i.period_label}: ${ngn(i.amount_minor - (i.paid_minor ?? 0))} outstanding, was due ${fmtDate(i.due_date)}`).join("\n")
    : unpaid.map((i) => `- ${i.period_label}: ${ngn(i.amount_minor - (i.paid_minor ?? 0))} outstanding`).join("\n");

  const prompt = `You are a property manager in Nigeria writing a short rent-payment reminder to a tenant.

Tenant: ${party.full_name}
Unit: ${unit?.unit_number ?? "—"}${unit?.properties?.name ? ` at ${unit.properties.name}` : ""}
Total outstanding: ${ngn(balance)}
Invoices:
${lines || "- (no itemised invoices)"}

Write the message body only — no subject line, no placeholders like [Name], no markdown. Requirements:
- Address the tenant by their first name.
- Polite and respectful, but clear that payment is due.
- State the total amount outstanding in Naira (₦) and briefly reference the overdue period(s).
- Remind them they can pay by bank transfer and report the payment from their tenant portal pay-link.
- Keep it to 4-6 short sentences. Sign off as "Your property manager".`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Claude API error (${res.status}). ${t.slice(0, 140)}` };
    }
    const data = await res.json();
    const draft = (data?.content?.[0]?.text ?? "").trim();
    if (!draft) return { ok: false, error: "Claude returned an empty draft — try again." };
    return { ok: true, draft, subject: `Rent reminder — ${ngn(balance)} outstanding` };
  } catch (e) {
    return { ok: false, error: `Could not reach Claude: ${(e as Error).message}` };
  }
}
