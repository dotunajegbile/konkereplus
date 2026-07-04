// Seeds a fresh, fully-populated demo tenant so KonkerePlus is instantly demoable.
// Usage:  node scripts/seed-demo.mjs [email] [password]
// Reads Supabase URL + anon key from .env.local. Creates (or signs into) the given
// account, spins up a company, and fills every module with realistic Nigerian data.
import fs from "node:fs";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const pick = (k) => (env.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]?.trim();
const BASE = pick("NEXT_PUBLIC_SUPABASE_URL");
const ANON = pick("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!BASE || !ANON) { console.error("Missing Supabase env in .env.local"); process.exit(1); }

const EMAIL = process.argv[2] || `demo+${Date.now()}@konkereplus.dev`;
const PASSWORD = process.argv[3] || "DemoPass-2026!";
const N = (naira) => Math.round(naira * 100); // → minor units (kobo)

// today is fixed off the wall clock; used to place invoices in the past/present.
const now = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const monthsAgo = (m) => iso(new Date(now.getFullYear(), now.getMonth() - m, 1));

let TOKEN = "";
async function req(method, path, { body, prefer, auth = true } = {}) {
  const headers = { apikey: ANON, "content-type": "application/json" };
  if (auth && TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  if (prefer) headers.Prefer = prefer;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
      const text = await res.text();
      if (!res.ok) throw new Error(`${res.status} ${path} :: ${text.slice(0, 200)}`);
      return text ? JSON.parse(text) : null;
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1))); // flaky-network retry
    }
  }
}
const ins = async (table, row) => (await req("POST", `/rest/v1/${table}`, { body: row, prefer: "return=representation" }))[0];

async function main() {
  // ---- auth: sign up (email confirmation is off) or sign in ----
  let auth = await req("POST", "/auth/v1/signup", { body: { email: EMAIL, password: PASSWORD }, auth: false }).catch(() => null);
  if (!auth?.access_token) {
    auth = await req("POST", "/auth/v1/token?grant_type=password", { body: { email: EMAIL, password: PASSWORD }, auth: false });
  }
  TOKEN = auth.access_token;

  // reuse an existing company if this account already has one, else create it
  let tid = (await req("GET", "/rest/v1/memberships?select=tenant_id"))[0]?.tenant_id;
  if (!tid) tid = await req("POST", "/rest/v1/rpc/create_tenant", { body: { tenant_name: "Lagos Prime Properties" } });
  const T = tid;
  console.log(`✓ company ready (tenant ${T})`);

  // wipe any prior demo data for this tenant (child → parent) so re-runs stay clean
  for (const table of [
    "messages", "message_threads", "announcements", "case_events", "legal_cases",
    "lead_activities", "leads", "project_rfis", "project_reports", "construction_projects",
    "expenses", "vendors", "documents", "payments", "rent_invoices", "maintenance_requests",
    "leases", "property_owners", "owners", "tenant_parties", "units", "bank_accounts", "properties",
  ]) await req("DELETE", `/rest/v1/${table}?tenant_id=eq.${T}`).catch(() => {});
  console.log("✓ cleared prior demo data");

  // ---- properties ----
  const props = [];
  for (const p of [
    { code: "LEK", name: "Lekki Gardens Estate", city: "Lekki" },
    { code: "YAB", name: "Yaba Heights", city: "Yaba" },
    { code: "IKY", name: "Ikoyi Court", city: "Ikoyi" },
  ]) props.push(await ins("properties", { tenant_id: T, ...p }));

  // ---- units (some occupied, some available) ----
  const rents = [1500000, 2200000, 4200000, 1800000, 3600000, 2000000, 5000000, 1600000];
  const units = [];
  let ri = 0;
  for (const p of props) for (const label of ["Flat 1", "Flat 2", "Flat 3"]) {
    const occupied = units.length < 6; // first 6 get tenants
    units.push(await ins("units", {
      tenant_id: T, property_id: p.id, unit_number: label,
      bedrooms: 2 + (ri % 2), bathrooms: 2, rent_amount_minor: N(rents[ri % rents.length]),
      status: occupied ? "occupied" : "available",
    }));
    ri++;
  }

  // ---- tenants + leases + invoices + payments ----
  const names = ["Chidi Okonkwo", "Amina Bello", "Tunde Balogun", "Ngozi Eze", "Emeka Obi", "Fatima Sani"];
  const parties = [];
  let firstToken = null;
  for (let i = 0; i < 6; i++) {
    const u = units[i];
    const party = await ins("tenant_parties", { tenant_id: T, full_name: names[i], unit_id: u.id, kyc_status: "verified" });
    parties.push(party);
    const lease = await ins("leases", {
      tenant_id: T, unit_id: u.id, tenant_party_id: party.id, reference: `LSE-${u.unit_number.replace(/\s/g, "")}-${i + 1}`,
      status: "active", rent_amount_minor: u.rent_amount_minor, deposit_minor: N(300000), cadence: "annual",
    });
    // give each tenant 2 invoices; vary status to populate collections + arrears + risk
    const scenarios = [
      // i=0 chronic: two overdue        i=1 one overdue    i=2 part-paid    i=3 paid   i=4 paid+reported  i=5 current
      [["Apr 2026", monthsAgo(3), "overdue", 0], ["May 2026", monthsAgo(2), "overdue", 0]],
      [["May 2026", monthsAgo(2), "overdue", 0], ["Jun 2026", monthsAgo(1), "open", 0]],
      [["Jun 2026", monthsAgo(1), "part_paid", 0.4], ["Jul 2026", iso(now), "open", 0]],
      [["Jun 2026", monthsAgo(1), "paid", 1], ["Jul 2026", iso(now), "paid", 1]],
      [["Jun 2026", monthsAgo(1), "paid", 1], ["Jul 2026", iso(now), "open", 0]],
      [["Jul 2026", iso(now), "open", 0], ["Aug 2026", iso(new Date(now.getFullYear(), now.getMonth() + 1, 1)), "open", 0]],
    ][i];
    for (const [label, due, status, paidFrac] of scenarios) {
      const amount = Math.round(u.rent_amount_minor / 12); // monthly slice
      const paid = Math.round(amount * paidFrac);
      const invoice = await ins("rent_invoices", {
        tenant_id: T, lease_id: lease.id, tenant_party_id: party.id, unit_id: u.id,
        period_label: label, amount_minor: amount, paid_minor: paid, due_date: due, status,
      });
      if (paid > 0) await ins("payments", {
        tenant_id: T, invoice_id: invoice.id, tenant_party_id: party.id, amount_minor: paid,
        status: "confirmed", paid_on: due, method: "bank_transfer",
      });
    }
    if (i === 4) { // one reported-but-unconfirmed payment → "payments to confirm" on dashboard
      const inv = (await req("GET", `/rest/v1/rent_invoices?tenant_party_id=eq.${party.id}&status=eq.open&select=id,amount_minor&limit=1`))[0];
      if (inv) await ins("payments", { tenant_id: T, invoice_id: inv.id, tenant_party_id: party.id, amount_minor: inv.amount_minor, status: "reported", paid_on: iso(now), method: "bank_transfer", bank_ref: "TRF-DEMO-88231" });
    }
    if (i === 0) firstToken = party.access_token; // for a demo pay-link
  }

  // ---- bank account ----
  await ins("bank_accounts", { tenant_id: T, bank_name: "GTBank", account_name: "Lagos Prime Properties Ltd", account_number: "0123456789", instructions: "Use your flat number as the transfer narration." });

  // ---- maintenance ----
  await ins("maintenance_requests", { tenant_id: T, property_id: props[0].id, unit_id: units[0].id, tenant_party_id: parties[0].id, title: "Kitchen tap leaking", category: "plumbing", priority: "medium", status: "open" });
  await ins("maintenance_requests", { tenant_id: T, property_id: props[1].id, title: "Generator not starting", category: "electrical", priority: "emergency", status: "assigned", assignee: "PowerFix Ltd" });
  await ins("maintenance_requests", { tenant_id: T, property_id: props[2].id, title: "AC servicing (annual)", category: "hvac", priority: "low", status: "completed", cost_minor: N(45000) });

  // ---- owners ----
  const owner = await ins("owners", { tenant_id: T, full_name: "Chief Adewale Johnson", email: "adewale@example.ng" });
  await ins("property_owners", { tenant_id: T, owner_id: owner.id, property_id: props[0].id });
  await ins("property_owners", { tenant_id: T, owner_id: owner.id, property_id: props[2].id });

  // ---- construction ----
  const proj = await ins("construction_projects", { tenant_id: T, property_id: props[0].id, name: "Lekki Gardens Phase 2", status: "on_track", budget_minor: N(320000000), spent_minor: N(198000000), progress: 62, start_date: monthsAgo(6), due_date: iso(new Date(now.getFullYear(), now.getMonth() + 4, 1)) });
  await ins("project_reports", { tenant_id: T, project_id: proj.id, report_date: iso(now), crew_count: 12, weather: "Dry", work_done: "Blockwork on 2nd floor completed; roofing materials delivered.", issues: "Awaiting balcony railing spec sign-off." });
  await ins("project_rfis", { tenant_id: T, project_id: proj.id, subject: "Confirm balcony railing spec", status: "submitted" });
  const proj2 = await ins("construction_projects", { tenant_id: T, property_id: props[1].id, name: "Yaba Heights Renovation", status: "at_risk", budget_minor: N(85000000), spent_minor: N(71000000), progress: 45, start_date: monthsAgo(4), due_date: monthsAgo(-1) });
  await ins("project_rfis", { tenant_id: T, project_id: proj2.id, subject: "Budget overrun approval", status: "review" });

  // ---- CRM ----
  const leads = [
    { name: "Bukola Adeyemi", interest: "3-bed in Lekki", status: "new", value_minor: N(4500000), source: "Instagram" },
    { name: "Ibrahim Musa", interest: "Office space Ikoyi", status: "viewing", value_minor: N(8000000), source: "Referral" },
    { name: "Grace Okafor", interest: "2-bed Yaba", status: "qualified", value_minor: N(2200000), source: "Website" },
    { name: "Segun Oyelaran", interest: "Shortlet Lekki", status: "won", value_minor: N(3600000), source: "Walk-in" },
  ];
  for (const l of leads) {
    const lead = await ins("leads", { tenant_id: T, property_id: props[0].id, ...l });
    await ins("lead_activities", { tenant_id: T, lead_id: lead.id, body: "Initial call — sent brochure and pricing." });
  }

  // ---- legal ----
  const c1 = await ins("legal_cases", { tenant_id: T, title: "Rent recovery — Flat 1 (Apr–May)", type: "dispute", party: "Chidi Okonkwo", status: "hearing_scheduled", property_id: props[0].id, tenant_party_id: parties[0].id, lawyer: "Balogun & Co.", next_date: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12)) });
  await ins("case_events", { tenant_id: T, case_id: c1.id, kind: "note", body: "Demand letter served; hearing date set.", event_date: iso(now) });
  await ins("legal_cases", { tenant_id: T, title: "Title verification — Ikoyi Court", type: "other", party: "Lagos State Lands Bureau", status: "open" });

  // ---- finance ----
  const v1 = await ins("vendors", { tenant_id: T, name: "PowerFix Ltd", category: "Electrical" });
  const v2 = await ins("vendors", { tenant_id: T, name: "CleanPro Services", category: "Cleaning" });
  await ins("expenses", { tenant_id: T, vendor_id: v1.id, property_id: props[1].id, description: "Generator repair", amount_minor: N(120000), status: "paid", expense_date: monthsAgo(1) });
  await ins("expenses", { tenant_id: T, vendor_id: v2.id, property_id: props[0].id, description: "Monthly estate cleaning", amount_minor: N(80000), status: "paid", expense_date: monthsAgo(1) });
  await ins("expenses", { tenant_id: T, vendor_id: v1.id, description: "Spare parts (pending approval)", amount_minor: N(35000), status: "pending", expense_date: iso(now) });

  // ---- communications ----
  await ins("announcements", { tenant_id: T, title: "Water supply maintenance Saturday", body: "Storage tanks will be cleaned this Saturday 8am–2pm. Please store water in advance.", audience: "all" });
  await ins("announcements", { tenant_id: T, title: "Q3 service charge statements ready", body: "Owners can view updated statements in the portal.", audience: "owners" });
  const thread = await ins("message_threads", { tenant_id: T, subject: "Parking allocation", tenant_party_id: parties[1].id });
  await ins("messages", { tenant_id: T, thread_id: thread.id, body: "Hi Amina, your assigned parking bay is B-14. Let us know if you have questions." });

  // ---- summary ----
  const appUrl = "https://konkereplus.com";
  console.log(`
✅ Demo seeded into "Lagos Prime Properties"
   3 properties · ${units.length} units · 6 tenants · leases + 12 invoices (paid / overdue / part-paid / reported)
   maintenance · 2 owners · 2 construction projects · 4 leads · 2 legal cases · 3 expenses · announcements + a thread

   Log in at ${appUrl}/login
     email:    ${EMAIL}
     password: ${PASSWORD}
${firstToken ? `\n   Tenant pay-link (portal demo):  ${appUrl}/pay/${firstToken}` : ""}
`);
}

main().catch((e) => { console.error("SEED FAILED:", e.message); process.exit(1); });
