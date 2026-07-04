"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn } from "@/lib/format";
import { callClaude } from "@/lib/ai";

// Answers a plain-English question over the workspace's live reporting data.
// Claude reasons over a compact snapshot we build here — it never runs SQL.
export async function askReports(
  question: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: staff } = await supabase.from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!staff) return { ok: false, error: "Staff access only." };
  const q = question.trim();
  if (!q) return { ok: false, error: "Type a question first." };

  const [{ data: invoices }, { data: units }] = await Promise.all([
    supabase.from("rent_invoices").select("amount_minor, paid_minor, status, due_date, tenant_parties(full_name), units(unit_number, properties(name, city))"),
    supabase.from("units").select("status"),
  ]);

  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  type Agg = { name: string; unit: string; property: string; city: string; balance: number; daysOverdue: number };
  const perParty = new Map<string, Agg>();
  let billed = 0, collected = 0;

  for (const i of invoices ?? []) {
    if (i.status === "void") continue;
    billed += i.amount_minor; collected += i.paid_minor ?? 0;
    const bal = i.amount_minor - (i.paid_minor ?? 0);
    const name = (i.tenant_parties as { full_name?: string } | null)?.full_name ?? "Unknown";
    const u = i.units as { unit_number?: string; properties?: { name?: string; city?: string } } | null;
    const key = name + "|" + (u?.unit_number ?? "");
    const a = perParty.get(key) ?? { name, unit: u?.unit_number ?? "—", property: u?.properties?.name ?? "—", city: u?.properties?.city ?? "—", balance: 0, daysOverdue: 0 };
    a.balance += bal;
    if (bal > 0 && i.due_date && new Date(i.due_date) < t0) {
      a.daysOverdue = Math.max(a.daysOverdue, Math.floor((t0.getTime() - new Date(i.due_date).getTime()) / 86400000));
    }
    perParty.set(key, a);
  }

  const rows = [...perParty.values()].sort((a, b) => b.balance - a.balance);
  const occupied = (units ?? []).filter((u) => u.status === "occupied").length;
  const occupancy = (units?.length ?? 0) ? Math.round((occupied / units!.length) * 100) : 0;
  const rate = billed ? Math.round((collected / billed) * 100) : 0;

  const lines = rows.map((r) =>
    `${r.name} | ${r.unit} | ${r.property} (${r.city}) | balance ${ngn(r.balance)} | ${r.daysOverdue > 0 ? r.daysOverdue + " days overdue" : "current"}`
  ).join("\n");

  const prompt = `You are an analyst for a property manager in Nigeria. Answer the question using ONLY the data below. Be concise and specific; amounts are in Naira (₦). If listing tenants, give a short list with their balances. If the data does not contain the answer, say so plainly.

QUESTION: ${q}

PORTFOLIO: occupancy ${occupancy}%, collection rate ${rate}%, total billed ${ngn(billed)}, total collected ${ngn(collected)}, ${rows.length} tenants.

TENANTS (name | unit | property (city) | balance | overdue):
${lines || "(no invoiced tenants yet)"}`;

  return callClaude(prompt, 700);
}
