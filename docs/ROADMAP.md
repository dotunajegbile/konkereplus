# KonkerePlus — Delivery Roadmap (refined)

> Operationalises Workbook §25. This version makes **dependencies, decision-gates, and "definition of ready" explicit**, and sequences work so each phase ships something usable and de-risks the next. Durations assume ~2 squads; they are planning guidance, not commitments (see Workbook §26 Risk Register).

---

## Guiding sequencing principles

1. **Money and multi-tenancy are load-bearing.** Nothing ships to a real tenant until tenant isolation, RBAC, audit, and idempotent payments are proven. These belong at the bottom of the stack (Phase 0–1), not bolted on later.
2. **Each phase produces a demoable, usable slice** for the anchor tenant (Konkere Plus) — not horizontal layers with no vertical value.
3. **Buy the commodity, build the differentiator.** Auth (OIDC provider), e-sign (DocuSign), payments (gateway routers), accounting (QuickBooks/Xero sync) are integrated, not rebuilt. The differentiator is the *unified* construction↔leasing↔management data model.
4. **Every open question (§3.2) is a decision-gate**, not a blocker — build behind a feature flag with the documented assumption, and revisit at the named gate.

---

## Phase map & dependency chain

```
Phase 0 Foundation ─┬─> Phase 1 Core Property & Leasing (MVP) ─┬─> Phase 2 Maintenance & Comms
 (multi-tenancy,    │    (properties, units, tenants, leases,   │    (maintenance, DMS, notifications,
  IAM/RBAC, audit,  │     rent + 1 gateway, tenant portal)      │     owner portal)
  CI/CD, IaC,       │                                           │
  design system)    │                                           ├─> Phase 3 Construction & CRM + public site
                    │                                           │    (reports, RFIs, change orders, Gantt,
                    │                                           │     CRM, listings, SEO)
                    │                                           │
                    │                                           └─> Phase 4 Legal & Finance depth
                    │                                                (legal module, full finance,
                    │                                                 accounting sync, statements)
                    │
                    └────────────────────────────────────> Phase 5 Mobile, AI & Scale
                                                             (native apps, offline, AI, search depth,
                                                              perf/scale hardening)
```

Phases 2, 3, 4 can partially overlap once Phase 1 lands (they share the core but touch different modules). Phase 5 depends on the domain being stable.

---

## Phase 0 — Foundation (~6–8 wks)

**Goal:** a deployable, empty, secure, multi-tenant skeleton that everything else is built inside.

| Workstream | Deliverables | Depends on |
|---|---|---|
| Tenancy | `tenant_id` on every table; repository-level tenant filter; **Postgres RLS as defence-in-depth**; tenant provisioning path (US-ADM-01) | — |
| IAM/RBAC | OIDC provider wired (Cognito/Auth0/Keycloak); login + 2FA; **permission catalogue** + role composition; deny-by-default guard/interceptor; ownership-scope checks | Tenancy |
| Audit | append-only `audit_events`; write on every state-changing action; scoped read views | Tenancy |
| Platform | CI/CD (lint, type-check, unit, SAST, container build, preview envs); Terraform for dev/staging/prod; secrets manager; observability baseline (traces/metrics/logs) | — |
| Design system | tokens, dark/light, core components, all component states (§14.1) — **the prototype in `/prototype` is the reference for this** | — |

**Exit criteria (Definition of Ready for Phase 1):**
- A new tenant can be provisioned; its data is invisible to another tenant (proven by an automated cross-tenant isolation test in CI — mitigates R-03).
- A user can log in with 2FA and hit a deny-by-default endpoint.
- Every write emits an audit event.
- Trunk → preview → staging deploy is green and one-click.

**Decision-gates opened:** Q-04 (data residency → cloud region), Q-05 (mobile stack — decide before Phase 5 staffing), backend stack (NestJS vs Spring — **decide org-wide here**, R-10).

---

## Phase 1 — Core Property & Leasing / MVP (~10–12 wks)

**Goal:** rent flowing. The anchor tenant can model its portfolio, put tenants on leases, and collect rent online with receipts.

**Scope:** Properties/Units + hierarchy · Tenant profiles + move-in · Lease wizard + templates + approval + **e-signature** · Rent invoice generation + **one gateway (Paystack)** + idempotent webhooks + receipts · Tenant portal (pay rent, receipts, lease view) · Manager collection dashboard.

**Detailed, estimated ticket breakdown → [`PHASE1-BACKLOG.md`](./PHASE1-BACKLOG.md).**

**Critical dependencies & risks:**
- Lease → Active requires e-sign integration (DocuSign) **and** deposit terms recorded (BR-02) — sequence e-sign before "go-live" of leases.
- Payments must be **idempotent from day one** (BR-04, R-02): `UNIQUE(tenant_id, gateway, gateway_ref)` + `Idempotency-Key` on the pay endpoint + daily reconciliation job. Do not defer.

**Exit criteria:** internal alpha with the anchor tenant on a limited set of real properties; a real tenant pays a real (sandbox) invoice and the receipt + dashboard update within SLA.

---

## Phase 2 — Maintenance & Comms (~8–10 wks)

**Goal:** operations. Requests get raised, dispatched, SLA-tracked, and closed; everyone can communicate; documents live in one place.

**Scope:** Maintenance (intake → assign → SLA timers + escalation → complete → rate) · Communication Center (threads, multichannel via Notifications service) · Documents/DMS (folders, versioning, permissions, PDF/image viewer) · Notification service (retry/dedupe/fallback, §19 matrix) · **Owner portal**.

**Depends on:** Phase 1 (units/tenants/leases exist to attach requests and documents to). Notifications service is a carve-out (§10.1) — can be built in parallel with Phase 1's tail.

**Exit criteria:** private beta. Emergency maintenance auto-escalates on SLA breach (US-MNT-01); owners see their portfolio.

---

## Phase 3 — Construction & CRM + Public site (~10–12 wks)

**Goal:** build + sell. Capture the construction lifecycle and the sales funnel that feeds it.

**Scope:** Construction (daily/progress reports with geo-stamped photos, RFIs, change orders with approval + baseline impact, Gantt, budget-vs-actual) · CRM (lead capture, pipeline, appointments, campaigns) · Public marketing website + **SSR listings** + SEO (sitemap, structured data) + lead forms feeding CRM.

**Depends on:** Foundation (audit/approval workflows), Properties. Largely **independent of leasing/rent**, so it can overlap Phase 2. Offline photo capture here is a *preview* of Phase 5 mobile — build the sync-queue contract now (A-11).

**Exit criteria:** anchor tenant runs a live project's daily reporting through the system; public listings are indexable; a website lead lands in CRM.

---

## Phase 4 — Legal & Finance depth (~10–12 wks)

**Goal:** compliance & money maturity.

**Scope:** Legal (cases, notices/hearings with approval + reminders, external lawyer isolation, links to property/unit/tenant) · Full Financial management (expenses, POs, vendor payments, refunds, deposits) · Financial statements (owner statements, P&L, cash flow) · **Accounting sync (QuickBooks/Xero)** · additional payment gateways (Flutterwave/Stripe/PayPal).

**Depends on:** Rent/payments (Phase 1) for the financial base; documents/audit (Phase 0/2) for legal evidence and immutability (BR-09, BR-12).

**Decision-gate:** Q-01 (statutory tax regimes) must resolve before tax computation / owner-statement tax lines.

**Exit criteria:** **GA.** Owner statements reconcile to the ledger and sync to QuickBooks; a legal notice goes through approval → e-sign → issued (immutable) (US-LEG-01).

---

## Phase 5 — Mobile, AI & Scale (~10–12 wks)

**Goal:** field-ready + intelligent + proven at scale.

**Scope:** Native apps (React Native pending Q-05) for tenant/contractor/inspector/PM · **Offline field capture** with conflict-free sync (A-11, MOB-4) · AI features (all advisory-only, human-approved, per §16 governance) · Search depth (OpenSearch + OCR) · performance/scale hardening + load tests against the A-09 ceiling.

**Depends on:** stable domain + APIs from Phases 1–4. AI features depend on having historical data (payments, requests) to learn from — hence last.

**Exit criteria:** **Mobile GA.** Offline daily report syncs without duplication (US-CON-01); load test meets §6 P95 targets at the next scale milestone.

---

## Cross-cutting tracks (run continuously from Phase 0)

- **Security & compliance:** SAST/DAST/dep-scanning in CI; NDPR/GDPR DSAR tooling and data map (R-07); annual pen test.
- **QA:** test pyramid; tenant-isolation tests as a permanent CI gate; contract tests for every gateway/webhook.
- **Observability & SRE:** SLO dashboards; DR drills **quarterly from the moment there is prod data** (a backup is only real once a restore is tested — §21.5).
- **Docs/ADRs:** record the backend-stack and every open-question decision as an ADR (R-10).

---

## Immediate next steps (before Phase 0 sprint 1)

1. **Decide the backend stack** (NestJS vs Spring) org-wide and write the ADR — this gates all hiring and scaffolding (R-10).
2. **Resolve or explicitly defer** Q-04 (data residency) and Q-05 (mobile stack); pin the launch cloud region.
3. **Stand up the tenancy + RBAC + audit spike** end-to-end for one entity (e.g. `properties`) to prove the isolation pattern before building breadth.
4. **Adopt `/prototype` as the design-system reference** and Phase-1 UX spec; hand it to the frontend squad as the interaction baseline.
