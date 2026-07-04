import type { SupabaseClient } from "@supabase/supabase-js";
import { ngn } from "@/lib/format";

// Transparent, rules-based arrears-risk scoring — no external API, no cost.
// Score 0–100 from a tenant's own invoice + payment history; every point is explainable.
export type RiskTier = "low" | "medium" | "high";
export type RiskResult = { score: number; tier: RiskTier; balance: number; factors: string[] };

type RiskInvoice = { amount_minor: number; paid_minor: number | null; status: string; due_date: string | null };
type RiskPayment = { paid_on: string | null; due: string | null }; // due = matched invoice due_date

const DAY = 86400000;
const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / DAY);

export function scoreArrearsRisk(invoices: RiskInvoice[], payments: RiskPayment[], today = new Date()): RiskResult {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const live = invoices.filter((i) => i.status !== "void");
  const unpaid = live.filter((i) => i.amount_minor - (i.paid_minor ?? 0) > 0);
  const balance = unpaid.reduce((s, i) => s + (i.amount_minor - (i.paid_minor ?? 0)), 0);

  const overdue = unpaid.filter((i) => i.due_date && new Date(i.due_date) < t);
  const oldestOverdueDays = overdue.reduce((m, i) => Math.max(m, daysBetween(t, new Date(i.due_date!))), 0);

  // Payment punctuality: of payments we can match to a due date, how many landed late.
  const matched = payments.filter((p) => p.paid_on && p.due);
  const late = matched.filter((p) => new Date(p.paid_on!) > new Date(p.due!)).length;
  const lateRate = matched.length ? late / matched.length : 0;

  const daysPts = Math.min(40, Math.round(oldestOverdueDays * 0.9)); // ~45 days late → full 40
  const countPts = Math.min(20, overdue.length * 10); // 2+ overdue invoices → full 20
  const balancePts = balance > 0 ? 10 : 0;
  const latePts = Math.min(30, Math.round(lateRate * 30)); // habitual lateness

  const score = Math.min(100, daysPts + countPts + balancePts + latePts);
  const tier: RiskTier = score >= 60 ? "high" : score >= 30 ? "medium" : "low";

  const factors: string[] = [];
  if (balance > 0) factors.push(`${ngn(balance)} outstanding`);
  if (overdue.length > 0) factors.push(`${overdue.length} overdue invoice${overdue.length === 1 ? "" : "s"}`);
  if (oldestOverdueDays > 0) factors.push(`${oldestOverdueDays} day${oldestOverdueDays === 1 ? "" : "s"} past due`);
  if (matched.length > 0 && lateRate > 0) factors.push(`${Math.round(lateRate * 100)}% of past payments were late`);
  if (factors.length === 0) factors.push("Up to date — no arrears on record");

  return { score, tier, balance, factors };
}

export type RankedParty = { id: string; name: string; unit: string | null } & RiskResult;

// Loads every tenant party in the caller's tenant (RLS-scoped) and ranks them by risk.
export async function loadArrearsRisk(supabase: SupabaseClient, today = new Date()): Promise<RankedParty[]> {
  const [{ data: parties }, { data: invoices }, { data: payments }] = await Promise.all([
    supabase.from("tenant_parties").select("id, full_name, units(unit_number)"),
    supabase.from("rent_invoices").select("tenant_party_id, amount_minor, paid_minor, status, due_date"),
    supabase.from("payments").select("tenant_party_id, paid_on, rent_invoices(due_date)").eq("status", "confirmed"),
  ]);

  const invByParty = new Map<string, RiskInvoice[]>();
  for (const i of invoices ?? []) {
    const k = (i as { tenant_party_id: string }).tenant_party_id;
    if (!k) continue;
    (invByParty.get(k) ?? invByParty.set(k, []).get(k)!).push(i);
  }
  const payByParty = new Map<string, RiskPayment[]>();
  for (const p of payments ?? []) {
    const k = (p as { tenant_party_id: string }).tenant_party_id;
    if (!k) continue;
    const due = (p.rent_invoices as { due_date?: string } | null)?.due_date ?? null;
    (payByParty.get(k) ?? payByParty.set(k, []).get(k)!).push({ paid_on: p.paid_on, due });
  }

  return (parties ?? [])
    .map((party) => {
      const r = scoreArrearsRisk(invByParty.get(party.id) ?? [], payByParty.get(party.id) ?? [], today);
      return {
        id: party.id,
        name: party.full_name as string,
        unit: (party.units as { unit_number?: string } | null)?.unit_number ?? null,
        ...r,
      };
    })
    .sort((a, b) => b.score - a.score || b.balance - a.balance);
}

export const RISK_TIER_STYLE: Record<RiskTier, string> = {
  high: "bg-red-500/15 text-red-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-green-500/15 text-green-400",
};
