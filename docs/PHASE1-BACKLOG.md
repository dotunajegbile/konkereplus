# Phase 1 Backlog — Core Property & Leasing (MVP)

> **Goal:** rent flowing. The anchor tenant models its portfolio, puts tenants on leases, and collects rent online with receipts.
> Stories follow the Workbook §7 standard: role · capability · benefit · FR refs · ≥1 happy + ≥1 negative + ≥1 permission-boundary criterion · estimate (story points) · Definition of Done.
> Mapped to the six sample sprints in Workbook §25.2. Estimates are relative (Fibonacci); ~team velocity assumed 20–26 pts/2-wk sprint/squad.

**Global Definition of Done (every story):** code + unit/integration tests + docs + **audit event** + **i18n keys** + accessibility pass (WCAG 2.1 AA) + **permission check enforced server-side** + pipeline green + product acceptance vs the criteria below.

---

## Epic A — Property & Unit Management  ·  *Sprint 1*

### KP-101 · Property CRUD + hierarchy — 8 pts  *(FR-PROP-1..3)*
As a **Property Manager**, I want to create and edit properties with their building→block→floor→unit hierarchy so that the portfolio is modelled once and referenced everywhere.
- **Happy:** Given I manage a property, when I create a building with 4 floors, then the hierarchy persists and units can be attached to a floor.
- **Negative:** Given a duplicate `property_code` within my tenant, when I save, then I get a `422 validation` error identifying the field.
- **Permission:** A Property Manager for property X cannot edit property Y (403); an Owner sees but cannot edit (read-only).

### KP-102 · Property list + detail screens — 5 pts  *(FR-PROP-2,4; §14.3)*
As a **Property Manager**, I want a filterable property list and a detail view with occupancy/financial roll-ups so I can navigate the portfolio.
- **Happy:** list paginates, filters by type/status, row → detail with occupancy % and MTD net derived (not manually set, BR-10).
- **Negative:** empty portfolio shows the empty state with a primary "Add property" action.
- **Permission:** results are scoped to assigned properties.

### KP-103 · Unit CRUD + status lifecycle — 5 pts  *(FR-UNIT-1,2)*
As a **Property Manager**, I want units with a status lifecycle (Available→Reserved→Occupied→Notice→Vacant/Maintenance) so occupancy is accurate.
- **Happy:** creating a unit defaults to Available; status transitions follow the allowed lifecycle.
- **Negative:** an invalid transition (e.g. Vacant→Occupied without a lease) is rejected.
- **Permission:** scoped to assigned property.

### KP-104 · Bulk unit creation from template — 3 pts  *(FR-UNIT-3)*
As a **Property Manager**, I want to generate N units from a building template so I don't hand-enter 40 near-identical units.
- **Happy:** "40 units, 4 floors, 2 layouts" creates 40 correctly-numbered units.
- **Negative:** template that would collide with existing unit numbers is rejected with a preview of conflicts.

### KP-105 · Seed data + role/permission fixtures — 3 pts  *(FR-IAM-3,4)*
Enablement: seed the anchor tenant with sample properties/units and the Phase-1 role set + permission catalogue entries used by this epic.

**Sprint 1 total: ~24 pts**

---

## Epic B — Tenant Management  ·  *Sprint 2*

### KP-201 · Tenant profile CRUD — 8 pts  *(FR-TEN-1)*
As a **Property Manager**, I want a tenant profile (details, ID/passport, emergency contacts, guarantor, documents) so I have a complete record.
- **Happy:** create a tenant, attach a government ID document; profile shows rental/payment history sections (empty initially).
- **Negative:** required-field validation on save; invalid file type/size on ID upload is rejected (upload scanning, §13.1).
- **Permission:** a Tenant can read/update **only their own** profile (RU(S)); a PM can CRUD within assigned properties.

### KP-202 · Tenant party model + link to unit — 3 pts  *(FR-TEN-1; §11.2)*
Model the `tenant_party` entity distinct from the login `user`, linkable to units/leases (a corporate tenant may have several contacts).

### KP-203 · Move-in checklist + condition photos — 5 pts  *(FR-TEN-2)*
As a **Property Manager**, I want a move-in checklist with condition photos so the deposit can be reconciled fairly at move-out.
- **Happy:** completing move-in records condition photos and sets the unit to Occupied.
- **Negative:** cannot complete move-in without a linked active lease.

### KP-204 · Document attach (polymorphic) — 5 pts  *(FR-DOC-1,4; §11.3 documents)*
Reusable document attach/list/preview component (S3 presigned upload, versioned, polymorphic owner) — first consumer is the tenant profile; reused by leases.
- **Permission:** document visibility follows the owner entity's scope.

**Sprint 2 total: ~21 pts**

---

## Epic C — Lease Drafting & Approval  ·  *Sprint 3*

### KP-301 · Lease templates + variable substitution — 5 pts  *(FR-LEASE-1)*
As a **Company Admin**, I want lease templates with variables (parties, unit, term, rent, deposit, clauses) so leases are consistent.

### KP-302 · Lease wizard (draft, save-per-step) — 8 pts  *(FR-LEASE-1; §14.3)*
As a **Property Manager**, I want a stepper (Parties→Unit→Term & rent→Deposit & clauses→Review) that saves a draft at each step. *(Interaction reference: `/prototype` lease wizard.)*
- **Happy:** each step saves; leaving and returning restores the draft.
- **Negative:** selecting a unit that already has an **active** lease is blocked (BR-01) with `unit_occupied`.
- **Permission:** only a manager of that property can create the lease (403 otherwise).

### KP-303 · Approval workflow (draft→pending_approval→pending_signature) — 5 pts  *(FR-LEASE-2; §15.1)*
As a **Company Admin**, I want an approval step before a lease is sent for signature so terms are checked.
- **Negative:** a rent increase above the per-tenant cap requires explicit approval (BR-06 ⚠).

### KP-304 · Lease version history + audit — 3 pts  *(FR-LEASE-7; BR-09)*
Every lease change creates a version; audit trail shows actor + timestamp + diff.

**Sprint 3 total: ~21 pts**

---

## Epic D — E-signature & Activation  ·  *Sprint 4*

### KP-401 · DocuSign adapter (behind interface) — 8 pts  *(FR-LEASE-3; A-07; §24)*
As the **system**, I want e-signature behind an adapter interface so DocuSign can be swapped for the native fallback later.
- **Happy:** sending a lease creates a DocuSign envelope; the signed document returns and is stored (versioned).
- **Negative:** envelope failure surfaces a retry and does **not** mark the lease active.

### KP-402 · Lease → Active on signature + deposit terms — 5 pts  *(FR-LEASE-2; BR-02)*
As a **Property Manager**, I want a lease to become Active only when all signatures are captured **and** deposit terms are recorded.
- **Negative:** attempting to activate without recorded deposit terms is rejected.
- **Permission-boundary:** the tenant party can sign but cannot change terms.

### KP-403 · Security deposit tracking — 5 pts  *(FR-LEASE-6; BR-05)*
Record deposit on activation; expose deposit balance for later move-out reconciliation (refund = deposit − approved deductions).

### KP-404 · Renewal-window + expiry alerts — 3 pts  *(FR-LEASE-5; §19)*
Configurable lead-time alerts for renewal window and expiry, routed through the notification matrix.

**Sprint 4 total: ~21 pts**

---

## Epic E — Rent Collection & Payments  ·  *Sprint 5*  ·  **highest-risk, do not compress**

### KP-501 · Rent invoice generation (cadences) — 5 pts  *(FR-RENT-1; §11.4 fn_generate_rent_invoices)*
As an **Accountant**, I want invoices generated per lease cadence (monthly/annual/biannual/custom) so tenants are billed correctly.
- **Negative:** re-running generation for a period does not create duplicate invoices (idempotent).

### KP-502 · Paystack adapter + pay endpoint (idempotent) — 8 pts  *(FR-RENT-2,5; BR-04; §12.3)*
As a **Tenant**, I want to pay an invoice online and never be double-charged.
- **Happy:** `POST /invoices/{id}/pay` with `Idempotency-Key` returns `202`; a retry with the same key returns the original result (no second charge).
- **Negative:** a gateway failure leaves the invoice open with a clear retry (US-RENT-01 edge).
- **Permission:** a tenant can pay **only their own** invoice.

### KP-503 · Signed webhook + fn_apply_payment (exactly-once) — 8 pts  *(FR-RENT-5; BR-04; §15.3)*
As the **system**, I want to apply a gateway webhook exactly once so balances are never corrupted.
- **Happy:** a success webhook applies payment once, marks invoice Paid/Part-paid, generates a receipt, notifies.
- **Negative:** the **same webhook delivered twice** changes the balance exactly once (`UNIQUE(tenant_id,gateway,gateway_ref)`).
- **Negative:** an invalid HMAC signature is rejected.

### KP-504 · Receipts (PDF) + outstanding balance — 3 pts  *(FR-RENT-4)*
Auto-generate a downloadable receipt PDF; invoice progress + outstanding balance reflect payments.

### KP-505 · Partial payments + payment plans — 5 pts  *(FR-RENT-3)*
Support part-payment and scheduled instalments; invoice status transitions Open→Part-paid→Paid.

### KP-506 · Daily reconciliation job + alerting — 5 pts  *(FR-RENT-5; NFR-REL-1; R-02)*
Nightly reconcile gateway settlements to invoices; flag unmatched; alert on discrepancy.

**Sprint 5 total: ~34 pts** *(over nominal velocity — this epic may need the full squad or a 3-week sprint; it is the riskiest and least compressible work in Phase 1).*

---

## Epic F — Tenant Portal & Manager Dashboard  ·  *Sprint 6*

### KP-601 · Tenant portal dashboard (mobile-first) — 5 pts  *(FR-TEN-3; §14.3)*
As a **Tenant**, I want rent-due, next-payment, open-maintenance, unread-messages, and lease-countdown at a glance. *(Reference: `/prototype` tenant dashboard.)*
- **Permission-boundary:** shows only the tenant's own lease/unit.

### KP-602 · Pay-rent flow + receipts list — 5 pts  *(FR-RENT-2,4; US-RENT-01)*
As a **Tenant**, I want to pay from the portal and download past receipts. *(Reference: `/prototype` pay-rent flow with idempotency messaging.)*

### KP-603 · Lease view (read-only) — 3 pts  *(FR-LEASE; FR-TEN-3)*
As a **Tenant**, I want to view my lease terms and download the signed document.

### KP-604 · Manager collection dashboard — 8 pts  *(FR-RENT-4; §14.4)*
As a **Property Manager**, I want collection rate, arrears, and outstanding invoices so I can chase rent.
- **Happy:** a payment appears in the manager dashboard within 60s (US-RENT-01).
- **Permission:** aggregates scoped to assigned properties only.

### KP-605 · UAT + hardening — 5 pts
Cross-browser, accessibility audit (axe + manual), tenant-isolation test pass, alpha sign-off against §7 criteria.

**Sprint 6 total: ~26 pts**

---

## Phase 1 summary

| Sprint | Epic | Pts | Milestone |
|---|---|---|---|
| S1 | Property & Unit | ~24 | Portfolio modelled |
| S2 | Tenant Management | ~21 | Tenants + documents |
| S3 | Lease drafting & approval | ~21 | Draft leases with approval |
| S4 | E-signature & activation | ~21 | Leases go Active (signed) |
| S5 | Rent & payments | ~34 | **Rent collectible, idempotent** |
| S6 | Portals & dashboards | ~26 | **Internal alpha** |

**Total ≈ 147 pts.** Critical path runs C→D→E→F (a lease must exist and be active before it can be invoiced and paid). Epics A and B feed C. Epic E (payments) carries the most risk (R-02) and should be staffed and reviewed most heavily — including a gateway sandbox test suite and the reconciliation job **in the same sprint it ships**, never after.

### Phase-1 exit / "internal alpha" acceptance
- Anchor tenant models ≥1 real property with units.
- A tenant is placed on a lease that goes Active via e-signature with deposit recorded.
- That tenant pays a (sandbox) invoice; the receipt generates and the manager dashboard updates within SLA.
- A duplicate webhook is proven to change the balance exactly once.
- Cross-tenant isolation test is green in CI.
