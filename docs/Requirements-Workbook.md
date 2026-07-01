# KonkerePlus.com — Product & Technical Requirements Workbook

**Single Source of Truth for Product, Engineering, QA, Design, and DevOps**

| Field | Value |
|---|---|
| Product | KonkerePlus.com |
| Document type | Combined SRS + PRD + Technical Architecture + Delivery Plan |
| Version | 0.9 (Foundation Draft) |
| Status | For review — foundation complete, enumerable sections marked for extension |
| Audience | Product, Architecture, Backend, Frontend, Mobile, QA, DevOps, Security, UI/UX |
| Classification | Confidential |

---

## How to read this workbook

This document is organised so each discipline can jump to what it needs:

- **Product / BA** → §1–§9 (vision, personas, functional & non-functional requirements, user stories, business rules)
- **Architects** → §10, §19–§22 (architecture, data model, scalability, DR)
- **Backend** → §11 (data model), §12 (API), §13 (security), §15 (workflows)
- **Frontend / Mobile** → §9 (IA/navigation), §14 (UX & wireframes), §18 (mobile)
- **QA** → §7 (acceptance criteria), §23 (test strategy)
- **DevOps / SRE** → §20–§22 (deployment, DevOps, DR)
- **Delivery** → §25–§27 (roadmap, risks, future)

**A note on completeness.** Sections that are inherently repetitive at scale — the full catalogue of ~40 screens, ~300 REST endpoints, every stored procedure — are specified by (a) a complete inventory, (b) a governing standard/pattern, and (c) fully worked representative examples. This is deliberate: it lets a team start immediately and generate the remaining artefacts mechanically from the pattern, rather than reading (and maintaining) hundreds of near-identical entries. Where an item is a design decision rather than a mechanical repeat, it is written out in full.

---

# 1. Executive Summary

KonkerePlus.com is a **multi-tenant, cloud-native SaaS platform** that unifies the full lifecycle of real estate — from ground-up **construction**, through **sales and leasing**, into ongoing **property and facilities management**, **tenant relations**, **legal case management**, and **financial reporting** — behind a single authentication and permissions system.

The platform serves a construction-and-property company (Konkere Plus) as the anchor tenant and is architected so the same product can be sold to other construction/property firms as isolated tenants. It exposes:

- A **public marketing website** with property/rental listings, lead capture, and portal entry points.
- Ten+ **role-specific portals and dashboards** (Super Admin, Company Admin, Property Manager, Construction PM, Owner, Tenant, Legal, Lawyer, Contractor, Accountant, Receptionist, Vendor).
- Deep functional modules: **Property Management, Unit Management, Tenant Management, Lease, Rent Collection, Maintenance, Construction Management, CRM, Legal, Communication Center, Document Management, Financial Management.**
- **Mobile-ready** responsive web plus native mobile apps (Android/iOS) for field and tenant use.
- **AI-assisted** features (risk prediction, maintenance forecasting, document summarisation, OCR, chatbot).

**Primary business outcomes**

1. Collapse fragmented tools (spreadsheets, standalone accounting, ad-hoc chat) into one system of record.
2. Increase rent-collection rates and reduce arrears via automated reminders, payment plans, and multi-gateway payments.
3. Shorten construction reporting cycles with structured daily/progress reporting and photo evidence.
4. Reduce legal and compliance risk through auditable document management, e-signature, and case tracking.
5. Create a saleable multi-tenant SaaS asset.

---

# 2. Product Vision

**Vision statement.** *"One platform to build, sell, lease, and manage every property — for owners, managers, tenants, and the teams in between."*

**Positioning.** KonkerePlus sits at the intersection of three normally-separate categories — construction ERP (e.g. Procore-style), property management (e.g. AppFolio/Buildium-style), and a legal/document workflow layer — targeted initially at emerging-market developers who operate across all three and currently have no integrated option.

**Product principles**

1. **Single source of truth.** Every property, unit, person, payment, and document exists once and is referenced everywhere.
2. **Permission-first.** Every screen, field, and API is gated by role + tenant + ownership scope. No data leaks across tenants or outside a user's remit.
3. **Auditable by default.** Every state-changing action is logged with actor, before/after, and timestamp.
4. **Field-ready.** Contractors and inspectors work on phones, often with poor connectivity — offline capture and sync are first-class.
5. **Money is sacred.** Financial flows are idempotent, reconciled, and never silently lost.
6. **Composable.** Modules integrate but degrade gracefully — a tenant can disable Construction or Legal without breaking the rest.

---

# 3. Assumptions & Open Questions

Per the brief, the following are **explicit assumptions** made where the source material did not specify a rule. **None of these should be treated as confirmed business rules until signed off.** Each is tagged with an owner to resolve.

### 3.1 Assumptions (proceeding on these unless corrected)

| # | Area | Assumption | Rationale |
|---|---|---|---|
| A-01 | Market/region | Primary market is West Africa (Nigeria-first) with international reach. | Inclusion of Paystack + Flutterwave alongside Stripe/PayPal. |
| A-02 | Currency | Multi-currency; base/reporting currency configurable per tenant (default NGN). FX rates cached daily. | Cross-border owners; local rent in NGN. |
| A-03 | Tenancy model | Full multi-tenant with logical isolation (shared DB, tenant_id partitioning) at launch; dedicated-DB option for enterprise tier later. | Cost vs isolation trade-off for early stage. |
| A-04 | Language | English at launch; i18n framework in place for later French/local languages. | ECOWAS francophone expansion likely. |
| A-05 | Rent cadence | Common cadence is annual/biannual advance (typical in target market) plus monthly; system supports all. | Local leasing norms differ from monthly-default markets. |
| A-06 | Legal jurisdiction | Legal module is a case/document/workflow tracker, **not** legal advice or jurisdiction-specific automation. | Avoids fabricating statutory rules. |
| A-07 | E-signature | DocuSign is primary; a native lightweight e-sign is a fallback for low-value documents. | Cost per envelope matters at volume. |
| A-08 | Accounting | KonkerePlus holds the operational ledger and **syncs** to QuickBooks/Xero as the system of record for statutory accounts. | Avoids rebuilding a full GL; respects accountants' existing tools. |
| A-09 | Scale target | Design target: 5M properties, 20M units, 50M documents, 10M active users across all tenants over 5 years. Launch capacity sized 100× smaller. | "Millions" in brief taken as ceiling, not launch load. |
| A-10 | KYC | ID/passport capture is for record-keeping and manual verification at launch; automated KYC provider integration is Phase 3. | No KYC vendor named. |
| A-11 | Offline scope | Offline applies to field capture (photos, forms, readings) and read-cached data — **not** payments or legal signing. | Consistency/fraud risk. |

### 3.2 Open questions (block certain sub-features until answered)

| # | Question | Blocks | Owner |
|---|---|---|---|
| Q-01 | Which statutory tax regimes must Financial module compute (VAT/WHT rates, filing formats)? | Tax computation, owner statements | Finance/Client |
| Q-02 | Is short-stay/vacation rental channel-managed (Airbnb/Booking sync) or direct only? | Short-stay pricing, calendar sync | Product/Client |
| Q-03 | Do property owners get self-serve billing (they pay KonkerePlus) or is the company billed? | Billing module design | Commercial |
| Q-04 | Required data-residency (must NGN data stay in-country)? | Cloud region strategy | Legal/Security |
| Q-05 | Native mobile = React Native/Flutter single codebase, or fully native? | Mobile staffing & roadmap | Eng leadership |

---

# 4. User Personas

Each persona lists: profile, goals, pain points, key jobs-to-be-done, primary devices, and the permission scope they operate under (see §13 for the full matrix).

### 4.1 Super Administrator — "Sade, Platform Operator"
- **Profile.** Runs the KonkerePlus platform itself (the SaaS operator), not a customer.
- **Goals.** Keep tenants isolated and healthy; manage billing; respond to incidents; enforce security.
- **Pain points.** Cross-tenant support without seeing tenant PII unnecessarily; safe impersonation.
- **JTBD.** Provision/suspend tenants, manage platform users & roles, view platform-wide analytics & audit logs, configure system settings, manage subscription/billing, rotate secrets.
- **Devices.** Desktop.
- **Scope.** Platform-wide; tenant data access is *break-glass* and fully audited.

### 4.2 Company Administrator — "Emeka, Operations Director"
- **Profile.** Senior staff at a customer tenant.
- **Goals.** Oversee employees, projects, vendors, owners, payments; see the whole business.
- **JTBD.** Manage staff & roles within tenant, configure company settings/branding, approve high-value actions, run cross-module reports.
- **Devices.** Desktop, tablet.
- **Scope.** Full access within their tenant only.

### 4.3 Property Manager — "Ngozi"
- **Goals.** Keep units occupied, rent collected, maintenance closed, leases renewed on time.
- **Pain points.** Chasing arrears; scheduling inspections; renewal deadlines slipping.
- **JTBD.** Manage properties/units/tenants, run inspections, dispatch maintenance, trigger renewals, view occupancy & collection dashboards.
- **Devices.** Desktop + mobile (on-site).
- **Scope.** Assigned properties within tenant.

### 4.4 Construction Project Manager — "Tunde"
- **Goals.** Deliver projects on time, on budget, safely.
- **Pain points.** Daily reporting is manual; change orders and RFIs get lost; photo evidence scattered.
- **JTBD.** Manage schedule/budget/materials/labour, log daily & progress reports with photos/drone images, raise/track RFIs & change orders, manage contractors, track milestones on a Gantt.
- **Devices.** Mobile (site) + desktop (planning).
- **Scope.** Assigned projects within tenant.

### 4.5 Property Owner — "Mr. & Mrs. Adeyemi (Investor)"
- **Goals.** Understand returns; low-effort oversight; trust the numbers.
- **JTBD.** View owned properties, occupancy, rental income vs expenses, statements, maintenance activity, documents, legal matters.
- **Devices.** Mobile + desktop.
- **Scope.** Read-mostly, restricted to owned entities; can raise requests/approvals.

### 4.6 Tenant — "Bola, Renter"
- **Goals.** Simple rent payment, receipts, fast maintenance response, clear communication.
- **JTBD.** View lease, pay rent, download receipts, report maintenance with photos, chat with management, receive notices, request renewal, upload documents.
- **Devices.** Mobile-first.
- **Scope.** Own lease/unit only.

### 4.7 Legal Department — "Chika, In-house Counsel"
- **JTBD.** Track cases/disputes/evictions, upload notices & court documents, manage contracts & agreements, run approval workflows, monitor court dates.
- **Devices.** Desktop.
- **Scope.** All legal entities within tenant (may be restricted by property portfolio).

### 4.8 Lawyer (External) — "Barrister Okoro"
- **JTBD.** Access only assigned cases, upload court/settlement documents, schedule hearings, communicate with owners/tenants within case context.
- **Devices.** Desktop + mobile.
- **Scope.** Assigned cases only (external-user isolation).

### 4.9 Contractor (External) — "BuildRight Ltd"
- **JTBD.** View assigned work orders, submit quotations, upload invoices, update progress with images, chat with the PM.
- **Devices.** Mobile-first.
- **Scope.** Assigned work orders/projects only.

### 4.10 Accountant — "Ifeoma"
- **JTBD.** Manage invoices/receipts, rent collection reconciliation, vendor payments, payroll, taxes, financial statements; sync to QuickBooks/Xero.
- **Devices.** Desktop.
- **Scope.** Financial data within tenant.

### 4.11 Receptionist / Front Desk — "Grace"
- **JTBD.** Register visitors, schedule appointments, capture and route inquiries into CRM.
- **Devices.** Desktop/tablet at front desk.
- **Scope.** CRM (limited), visitor & appointment records.

### 4.12 Vendor — "MegaSupply (Materials)"
- **JTBD.** Register, receive purchase orders, submit quotes/invoices, track payment status, communicate.
- **Devices.** Desktop + mobile.
- **Scope.** Own vendor record, POs and invoices addressed to them.

### 4.13 Executive (Dashboard-only) — "CEO"
- **JTBD.** Consume the executive dashboard: revenue, occupancy, collection, construction progress, cash flow, legal exposure. No operational editing.
- **Scope.** Read-only aggregate within tenant.

---

# 5. Functional Requirements

Requirements are grouped by module. IDs are stable (`FR-<MODULE>-<n>`) so tests, stories, and code can reference them. Priority uses MoSCoW (M/S/C/W). "Actor" = primary role(s).

### 5.1 Identity, Tenancy & Access (FR-IAM)

| ID | Requirement | Priority | Actor |
|---|---|---|---|
| FR-IAM-1 | System supports multiple isolated tenants; all business data carries a `tenant_id` and is never visible across tenants. | M | Super Admin |
| FR-IAM-2 | Users authenticate via email+password with mandatory 2FA option (TOTP/SMS) and optional SSO (OAuth2/OIDC, SAML for enterprise). | M | All |
| FR-IAM-3 | Role-Based Access Control with roles as in §4 plus custom roles composed from a permission catalogue. | M | Admin |
| FR-IAM-4 | Ownership-scoped access: users see only entities they own/are assigned (property, project, case, unit). | M | All |
| FR-IAM-5 | Super Admin impersonation ("break-glass") is time-boxed, reason-logged, and visibly banners the impersonated session. | S | Super Admin |
| FR-IAM-6 | Session management: idle timeout, concurrent-session limits, device list, remote revoke. | M | All |
| FR-IAM-7 | Password policy (length, complexity, rotation, breach-check), account lockout with backoff. | M | All |
| FR-IAM-8 | External users (tenants, owners, lawyers, contractors, vendors) are isolated from internal navigation and data. | M | System |

### 5.2 Public Website (FR-WEB)

| ID | Requirement | Priority |
|---|---|---|
| FR-WEB-1 | Public marketing pages (Home, About, Services & sub-services, Projects completed/current, Blog, News, Careers, Contact, FAQ). | M |
| FR-WEB-2 | Property & rental listings with search/filter (type, location on map, price, beds, status), detail pages with photos, floor plans, virtual tour, GPS map. | M |
| FR-WEB-3 | Lead-capture forms: Request Quote, Book Consultation, Vendor Registration, Become an Owner, Contact — all feed CRM. | M |
| FR-WEB-4 | Portal entry points: Tenant, Owner, Employee, Vendor logins. | M |
| FR-WEB-5 | SEO essentials: server-rendered listing/detail pages, sitemap.xml, structured data (RealEstateListing), OG tags. | S |
| FR-WEB-6 | Investment Opportunities section with gated detail (lead capture before full financials). | C |
| FR-WEB-7 | Cookie consent + privacy controls (GDPR/NDPR-aligned). | M |

### 5.3 Property Management (FR-PROP)

| ID | Requirement | Priority |
|---|---|---|
| FR-PROP-1 | CRUD properties with type (Residential, Commercial, Mixed-use, Industrial, Warehouse, Retail, Office, Hotel, Student Housing, Short-stay, Vacation). | M |
| FR-PROP-2 | Each property stores: Property ID, GPS coordinates, owner(s), developer, manager, status, construction stage, insurance, utilities, media (photos/floor plans/videos/virtual tour), documents, certificates, inspection & maintenance history, warranty, occupancy, revenue, expenses. | M |
| FR-PROP-3 | Property hierarchy: Property → Buildings → Blocks → Floors → Units, plus Parking, Storage, Amenities. | M |
| FR-PROP-4 | Occupancy & financial roll-ups computed from units/leases/payments. | M |
| FR-PROP-5 | Media gallery with virtual tour embed and geolocated map view. | S |
| FR-PROP-6 | Certificate/warranty expiry tracking with alerts. | S |

### 5.4 Unit Management (FR-UNIT)

| ID | Requirement | Priority |
|---|---|---|
| FR-UNIT-1 | CRUD units with: unit number, floor, bedrooms, bathrooms, square footage, rent, service charge, occupancy status, current tenant, active lease, inspection record, photos, documents, utilities. | M |
| FR-UNIT-2 | Unit status lifecycle: Available → Reserved → Occupied → Notice → Vacant/Under-maintenance. | M |
| FR-UNIT-3 | Bulk unit creation from a building template (e.g. "40 units, 4 floors, 2 layouts"). | S |
| FR-UNIT-4 | Parking/storage as assignable sub-units linkable to a lease. | C |

### 5.5 Tenant Management (FR-TEN)

| ID | Requirement | Priority |
|---|---|---|
| FR-TEN-1 | Tenant profile: personal details, photo, government ID, passport, employment, emergency contacts, guarantor, credit score (manual/entered), rental & lease history, documents, vehicles, visitors, family members, pets, payment history, complaints, maintenance requests, communication & legal history, move-in/move-out records. | M |
| FR-TEN-2 | Move-in and move-out checklists with condition photos and deposit reconciliation. | M |
| FR-TEN-3 | Tenant self-service portal (see FR-TEN portal stories §7). | M |
| FR-TEN-4 | Document expiry (ID/visa) alerts. | C |

### 5.6 Lease Management (FR-LEASE)

| ID | Requirement | Priority |
|---|---|---|
| FR-LEASE-1 | Lease drafting from templates with variable substitution (parties, unit, term, rent, deposit, clauses). | M |
| FR-LEASE-2 | Approval workflow (draft → internal approval → tenant signature → active). | M |
| FR-LEASE-3 | Electronic signature (DocuSign primary; native fallback). | M |
| FR-LEASE-4 | Renewals, extensions, termination; rent increase with configurable rules/caps. | M |
| FR-LEASE-5 | Automatic expiration & renewal-window alerts (configurable lead time). | M |
| FR-LEASE-6 | Penalty/late-fee calculation rules; security deposit & refund tracking. | M |
| FR-LEASE-7 | Lease document version history and audit trail. | M |

### 5.7 Rent Collection (FR-RENT)

| ID | Requirement | Priority |
|---|---|---|
| FR-RENT-1 | Support monthly/weekly/annual/biannual cadences and custom schedules. | M |
| FR-RENT-2 | Multiple methods: bank transfer, card, wallet, and recorded cash. | M |
| FR-RENT-3 | Partial payments and payment plans with scheduled instalments. | M |
| FR-RENT-4 | Auto receipts, outstanding-balance tracking, reminders, late penalties. | M |
| FR-RENT-5 | Reconciliation of gateway settlements to invoices; idempotent payment handling. | M |
| FR-RENT-6 | Accounting sync (QuickBooks/Xero) for posted payments. | S |

### 5.8 Maintenance (FR-MNT)

| ID | Requirement | Priority |
|---|---|---|
| FR-MNT-1 | Request intake (tenant/manager/inspection-generated) with category, priority, media. | M |
| FR-MNT-2 | Types: emergency, preventive (scheduled), routine, inspection-driven. | M |
| FR-MNT-3 | Assignment to internal technician or external vendor/contractor. | M |
| FR-MNT-4 | Status tracking, before/after photos, cost tracking, approval gates, completion report, tenant rating. | M |
| FR-MNT-5 | Preventive maintenance scheduler (asset-based, recurring). | S |
| FR-MNT-6 | SLA timers per priority with escalation on breach. | S |

### 5.9 Construction Management (FR-CON)

| ID | Requirement | Priority |
|---|---|---|
| FR-CON-1 | Project CRUD with schedule, budget, materials, equipment, workers, contractors. | M |
| FR-CON-2 | Daily reports & progress reports with site photos and drone images (geo/time-stamped). | M |
| FR-CON-3 | RFIs and change orders with approval workflow and cost/schedule impact. | M |
| FR-CON-4 | Inspection, QA, safety & incident reporting. | M |
| FR-CON-5 | Drawings/blueprints repository with versioning and viewer. | M |
| FR-CON-6 | Milestones, timeline, and Gantt chart with dependencies. | M |
| FR-CON-7 | Budget vs actual tracking; material/equipment consumption. | S |

### 5.10 CRM (FR-CRM)

| ID | Requirement | Priority |
|---|---|---|
| FR-CRM-1 | Lead capture from website & manual entry; lead source tracking. | M |
| FR-CRM-2 | Sales pipeline stages, follow-up tasks, appointment booking. | M |
| FR-CRM-3 | Campaigns: email, SMS, WhatsApp; conversion reporting. | S |
| FR-CRM-4 | Property-inquiry linkage (lead ↔ listing). | M |

### 5.11 Legal Management (FR-LEG)

| ID | Requirement | Priority |
|---|---|---|
| FR-LEG-1 | Case CRUD (disputes, evictions, lawsuits) with parties, status, court dates. | M |
| FR-LEG-2 | Document handling: notices, court documents, evidence, settlements, contracts, land/property/lease agreements. | M |
| FR-LEG-3 | Lawyer assignment (external isolation) & case-scoped communication. | M |
| FR-LEG-4 | Approval workflows for notices/agreements; deadline & hearing reminders. | M |
| FR-LEG-5 | Link cases to property/unit/tenant/owner for context. | M |

### 5.12 Communication Center (FR-COMM)

| ID | Requirement | Priority |
|---|---|---|
| FR-COMM-1 | In-app messaging across relationships (internal, tenant, owner, lawyer, maintenance, vendor) with threads, read receipts, attachments, search. | M |
| FR-COMM-2 | Multichannel delivery: email, SMS, push, WhatsApp; voice notes. | M |
| FR-COMM-3 | Announcements & broadcast messages with templates and audience targeting. | M |
| FR-COMM-4 | Video calls (integration) for scheduled meetings. | C |
| FR-COMM-5 | Per-user notification preferences and quiet hours. | S |

### 5.13 Document Management (FR-DOC)

| ID | Requirement | Priority |
|---|---|---|
| FR-DOC-1 | Folder structure, categories, permissions, version control. | M |
| FR-DOC-2 | OCR + full-text search across documents. | S |
| FR-DOC-3 | Approval workflows and e-signatures. | M |
| FR-DOC-4 | PDF preview, image viewer, expiration tracking, audit logs. | M |

### 5.14 Financial Management (FR-FIN)

| ID | Requirement | Priority |
|---|---|---|
| FR-FIN-1 | Invoices, receipts, budgets, expenses, vendor payments, purchase orders, refunds, deposits. | M |
| FR-FIN-2 | Payroll and tax handling (scope per Q-01). | S |
| FR-FIN-3 | Financial statements: owner statements, cash flow, P&L, balance sheet. | M |
| FR-FIN-4 | Sync to QuickBooks/Xero as statutory system of record. | S |
| FR-FIN-5 | Multi-currency with per-tenant base currency and FX capture. | S |

### 5.15 Dashboards, Search, Reporting, AI, Integrations
Covered in dedicated sections: dashboards §14.4, search §5.16, reporting/analytics §17, AI §16, integrations §24.

### 5.16 Search (FR-SRCH)
| ID | Requirement | Priority |
|---|---|---|
| FR-SRCH-1 | Global search across properties, units, tenants, leases, invoices, documents, legal cases (permission-filtered). | M |
| FR-SRCH-2 | Entity-specific advanced filters and saved searches. | S |
| FR-SRCH-3 | OCR/document content search (ties to FR-DOC-2). | C |

---

# 6. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Target/Metric |
|---|---|---|---|
| NFR-PERF-1 | Performance | Interactive page/API P95 latency | ≤ 400 ms server time for reads, ≤ 800 ms for writes at target load |
| NFR-PERF-2 | Performance | Listing/search results | ≤ 1.5 s end-to-end P95 |
| NFR-SCAL-1 | Scalability | Horizontal scale of stateless services | Linear to ceiling in A-09 |
| NFR-SCAL-2 | Scalability | Data volume | 50M documents, 20M units without schema change |
| NFR-AVAIL-1 | Availability | Platform uptime | 99.9% monthly (≤ ~43 min/mo) |
| NFR-AVAIL-2 | Availability | RPO / RTO | RPO ≤ 15 min, RTO ≤ 1 h |
| NFR-SEC-1 | Security | Encryption | TLS 1.2+ in transit; AES-256 at rest |
| NFR-SEC-2 | Security | AuthZ | Deny-by-default; every endpoint checks tenant + role + ownership |
| NFR-SEC-3 | Security | Audit | 100% of state-changing actions logged, immutable, 7-yr retention (financial/legal) |
| NFR-SEC-4 | Security | Secrets | Central secret manager, rotation, no secrets in code/logs |
| NFR-COMP-1 | Compliance | Privacy | GDPR + NDPR aligned: consent, DSAR export/delete, data-processing records |
| NFR-USE-1 | Usability | Accessibility | WCAG 2.1 AA |
| NFR-USE-2 | Usability | Responsive | Usable 320px → 4K; core tenant flows mobile-first |
| NFR-USE-3 | Usability | i18n | All user-facing strings externalised |
| NFR-REL-1 | Reliability | Payment ops | Idempotent, exactly-once effect, reconciled daily |
| NFR-MNT-1 | Maintainability | Code | ≥ 80% unit coverage on domain logic; documented public APIs |
| NFR-OBS-1 | Observability | Telemetry | Structured logs, distributed tracing, RED/USE metrics, alerting |
| NFR-PORT-1 | Portability | Deployment | Containerised; reproducible via IaC |
| NFR-DATA-1 | Data | Residency | Configurable region per tenant (see Q-04) |

---

# 7. User Stories & Acceptance Criteria (Representative)

Full backlog is generated per module; below are canonical stories per key flow with Gherkin-style acceptance criteria. Each maps to FR IDs and is the template for the rest.

### 7.1 Tenant pays rent
> **US-RENT-01** — As a **tenant**, I want to pay my rent online so that I receive an instant receipt and my balance updates. *(FR-RENT-1..5)*

**Acceptance criteria**
```
Given I have an outstanding rent invoice
And I am logged into the tenant portal
When I choose "Pay now" and complete a card/transfer/wallet payment
Then the payment is captured idempotently (no double charge on retry)
And a receipt PDF is generated and available to download
And my outstanding balance decreases by the paid amount
And the payment appears in the manager's collection dashboard within 60s
And on gateway webhook confirmation the invoice is marked Paid/Part-paid
```
**Negative/edge**
```
Given a payment webhook is received twice for the same reference
Then the invoice balance changes exactly once
Given a payment fails at the gateway
Then the invoice remains unpaid and I see a clear retry option
```

### 7.2 Manager dispatches maintenance
> **US-MNT-01** — As a **property manager**, I want to assign a maintenance request to a vendor with an SLA so that it is resolved on time. *(FR-MNT-1..6)*
```
Given an open maintenance request with priority "Emergency"
When I assign it to a vendor
Then an SLA timer starts per the Emergency policy
And the vendor is notified via their preferred channel
And if the SLA is breached the request escalates to me and my supervisor
When the vendor uploads "after" photos and marks complete
Then the tenant is asked to rate, and cost posts to the property expenses
```

### 7.3 Construction PM logs a daily report
> **US-CON-01** — As a **construction PM**, I want to submit a daily site report with photos even with poor signal so that progress is captured reliably. *(FR-CON-2, FR mobile)*
```
Given I am on-site with intermittent connectivity
When I fill the daily report and attach geo/time-stamped photos offline
Then the report is queued locally
And syncs automatically when connectivity returns without duplication
And appears on the project timeline with the correct capture timestamp
```

### 7.4 Owner reviews returns
> **US-OWN-01** — As an **owner**, I want an at-a-glance view of income vs expenses per property so I can trust my returns. *(FR-PROP-4, FR-FIN-3)*
```
Given I own 3 properties
When I open my dashboard
Then I see occupancy %, MTD/YTD income, expenses, and net per property
And I can drill into any figure to its underlying transactions
And I can download an owner statement PDF for a chosen period
And I cannot see any property I do not own
```

### 7.5 Legal issues an eviction notice
> **US-LEG-01** — As **legal**, I want to issue an eviction notice tied to a tenant and case with an approval step so it is defensible. *(FR-LEG-1,2,4)*
```
Given a case linked to a tenant/unit with arrears evidence
When I generate an eviction notice from a template
Then it enters an approval workflow before issuance
And on approval it is e-signed, versioned, and logged with actor+timestamp
And the tenant and assigned lawyer are notified in-case
```

### 7.6 Super Admin provisions a tenant
> **US-ADM-01** — As a **super admin**, I want to provision a new tenant with isolation and an initial admin. *(FR-IAM-1..8)*
```
Given I provision "Tenant B"
Then all Tenant B data is tagged tenant_id=B and invisible to other tenants
And an initial Company Admin invite is sent
And default roles and permission sets are seeded
And the action is recorded in the platform audit log
```

**Story-writing standard for the rest of the backlog:** every story states role, capability, benefit; lists FR references; includes ≥1 happy path + ≥1 negative + permission-boundary criterion; is estimated in points; carries a `Definition of Done` (code + tests + docs + audit event + i18n keys).

---

# 8. Business Rules

Rules are numbered and testable. **Rules marked ⚠ are assumptions (see §3) pending sign-off, not confirmed policy.**

| ID | Rule |
|---|---|
| BR-01 | A unit may have at most one **active** lease at a time. |
| BR-02 | A lease cannot become Active until all required signatures are captured and deposit terms are recorded. |
| BR-03 | ⚠ Late fee accrues from N days after due date at a per-tenant configurable rate; default grace = 5 days. |
| BR-04 | A payment reference (gateway id) is unique per tenant and processed at most once (idempotency). |
| BR-05 | Security deposit refund = deposit − documented, approved deductions; refund tracked to closure. |
| BR-06 | ⚠ Rent increase on renewal capped at a per-tenant configurable %; increases require manager approval. |
| BR-07 | Emergency maintenance must be assignable within its SLA; unassigned emergencies escalate automatically. |
| BR-08 | External users (tenant/owner/lawyer/contractor/vendor) can only read/write entities explicitly linked to them. |
| BR-09 | Financial and legal records are append-only for audit; corrections are new entries referencing the original. |
| BR-10 | A property's occupancy and financial roll-ups are always derived, never manually overridden. |
| BR-11 | Change orders and RFIs altering budget/schedule require approval before they affect project baselines. |
| BR-12 | Documents in an approval workflow are immutable once approved; changes create a new version. |
| BR-13 | Impersonation by Super Admin requires a reason and is time-boxed; the impersonated user's data actions are attributed to the impersonator in audit. |
| BR-14 | Cash payments must be recorded by an authorised role and are flagged for reconciliation. |
| BR-15 | ⚠ Tenant-visible balances exclude internal accruals not yet invoiced. |

---

# 9. Information Architecture, Sitemap & Navigation

### 9.1 Top-level product surfaces
```
KonkerePlus.com
├── Public Website (unauthenticated)
├── Auth (login, 2FA, SSO, reset, invite acceptance)
└── Application (authenticated, role-scoped)
    ├── Internal workspace (staff roles)
    └── External portals (Tenant, Owner, Lawyer, Contractor, Vendor)
```

### 9.2 Public website sitemap
```
/                         Home
/about                    About Us
/services                 Our Services
  /services/construction
  /services/property-development
  /services/property-management
  /services/facilities-management
  /services/equipment-leasing
/projects/completed       Completed Projects
/projects/current         Current Projects
/listings                 Property Listings (filter)
  /listings/rental
  /listings/commercial
  /listings/residential
  /listings/:id           Listing detail (photos, tour, GPS)
/investments              Investment Opportunities (gated)
/blog, /blog/:slug        Blog
/news, /news/:slug        News
/careers, /careers/:id    Careers
/contact                  Contact Us
/support                  Customer Support
/faqs                     FAQs
/request-quote            Request Quote (lead)
/book-consultation        Book Consultation (lead)
/vendor-registration      Vendor Registration (lead)
/become-owner             Become a Property Owner (lead)
/login/tenant  /login/owner  /login/employee  /login/vendor
```

### 9.3 Application navigation (internal, permission-filtered)
Left sidebar, collapsible; items hidden if the user lacks permission.
```
Dashboard
Properties ▸ Units ▸ Amenities/Parking
Tenants ▸ Leases ▸ Rent & Invoices
Maintenance ▸ Inspections ▸ Preventive schedules
Construction ▸ Projects ▸ RFIs ▸ Change Orders ▸ Reports ▸ Drawings
CRM ▸ Leads ▸ Pipeline ▸ Campaigns ▸ Appointments
Legal ▸ Cases ▸ Documents ▸ Hearings
Finance ▸ Invoices ▸ Expenses ▸ Vendor Payments ▸ Payroll ▸ Statements
Documents (DMS)
Communications (Inbox, Announcements, Templates)
Reports & Analytics
Admin ▸ Users & Roles ▸ Company Settings ▸ Integrations ▸ Audit Logs
```

### 9.4 External portal navigation (examples)
- **Tenant:** Dashboard · My Lease · Pay Rent · Receipts · Maintenance · Messages · Documents · Notices.
- **Owner:** Dashboard · My Properties · Financials/Statements · Occupancy · Maintenance · Documents · Legal.
- **Contractor:** My Work Orders · Quotations · Invoices · Messages.
- **Vendor:** Purchase Orders · Quotes · Invoices · Payments · Messages.
- **Lawyer:** My Cases · Documents · Hearings · Messages.

---

# 10. System Architecture

### 10.1 Style decision — Modular Monolith → selective services
**Recommendation:** launch as a **modular monolith** (clear module boundaries, single deployable) with a few **independently-scaled services** carved out where load/latency justifies it: **Notifications/Comms**, **Payments/Webhooks**, **Document/Media processing (OCR, thumbnails)**, and **Search indexing**. This avoids premature microservice sprawl while isolating the spiky, IO-heavy workloads.

**Rationale.** Early-stage team velocity and transactional integrity (money, leases) favour a monolith core; the carve-outs are exactly the parts that are async, bursty, or CPU-heavy and benefit from separate scaling and failure isolation.

### 10.2 High-level component diagram (textual)
```
                         ┌────────────────────────┐
   Web (SSR/SPA) ───────▶│      API Gateway /      │
   Mobile (native) ─────▶│   BFF + AuthN/AuthZ     │
   Public site (SSR) ───▶└───────────┬────────────┘
                                     │  (REST/JSON, some GraphQL for dashboards)
                         ┌───────────▼────────────┐
                         │   Modular Monolith Core │
                         │  IAM · Property · Unit  │
                         │  Tenant · Lease · Rent  │
                         │  Maintenance · Construct │
                         │  CRM · Legal · Finance  │
                         │  DMS · Reporting        │
                         └──┬───────┬───────┬──────┘
              async events  │       │       │  reads/writes
             ┌──────────────▼┐ ┌────▼───┐ ┌─▼────────────┐
             │ Message Queue │ │ Cache  │ │ Primary RDBMS │
             │  (events)     │ │(Redis) │ │ (Postgres)    │
             └───┬───┬───┬───┘ └────────┘ └───────┬───────┘
   ┌─────────────▼┐ ┌▼─────────┐ ┌▼──────────┐    │ read replicas
   │ Notifications│ │ Payments │ │ Doc/Media │    │ + partitioning
   │  service     │ │ webhooks │ │ OCR/thumbs│    ▼
   └──────────────┘ └──────────┘ └─────┬─────┘  ┌──────────────┐
                                       ▼        │ Object store │
                                 ┌───────────┐  │ (S3)         │
                                 │  Search   │  └──────────────┘
                                 │  index    │
                                 └───────────┘
   External: Stripe/PayPal/Paystack/Flutterwave · Twilio/WhatsApp ·
   DocuSign · Google Maps · QuickBooks/Xero · Firebase (push) · Cloudflare (CDN/WAF)
```

### 10.3 Recommended technology stack

| Layer | Recommendation | Notes |
|---|---|---|
| Frontend (app) | **React + TypeScript** (Next.js for SSR public site) | Component ecosystem, SSR for SEO listings |
| Styling/UI | Tailwind + a headless component lib (Radix/shadcn) | Accessible primitives, design tokens |
| Mobile | **React Native** (single codebase) *(pending Q-05)* | Reuse TS skills; native modules for camera/biometrics/offline |
| Backend | **Node.js (NestJS)** *or* **Java/Spring Boot** | NestJS = velocity + shared TS; Spring = strong typing/enterprise. Pick one org-wide. |
| API | REST/JSON primary; **GraphQL** for dashboard aggregation | GraphQL only where over-fetching hurts |
| Primary DB | **PostgreSQL** | JSONB for flexible attrs, PostGIS for GPS, partitioning for scale |
| Cache | **Redis** | Sessions, hot reads, rate limiting, queues (optional) |
| Search | **OpenSearch/Elasticsearch** | Global + OCR full-text search |
| Object storage | **AWS S3** (+ Cloudflare CDN) | Media, documents |
| Queue/events | **SQS/RabbitMQ/Kafka** (start SQS/Rabbit) | Async comms, webhooks, indexing |
| Auth | OIDC provider (Cognito/Auth0/Keycloak) | SSO, 2FA, social/enterprise |
| Push | Firebase Cloud Messaging | Mobile push |
| Infra | AWS (EKS or ECS Fargate), Terraform IaC | Region choice per Q-04 |
| Observability | OpenTelemetry + Grafana/Prometheus + centralized logs | Traces/metrics/logs |
| CI/CD | GitHub Actions → containers → EKS/ECS | Trunk-based, preview envs |

---

# 11. Data Model

### 11.1 Design principles
- Every business table carries `tenant_id` (FK to `tenants`), `created_at`, `updated_at`, `created_by`, `updated_by`, and soft-delete `deleted_at`.
- Financial & legal tables are **append-only**; corrections reference originals.
- Money stored as integer minor units + ISO currency code (never floats).
- GPS via PostGIS `geography(Point)`. Flexible per-type attributes via JSONB where schema would otherwise explode.
- UUID primary keys (v7 for index locality).

### 11.2 Core entities (ER overview — textual)
```
tenants ─1─* users ─*─* roles ─*─* permissions
tenants ─1─* properties ─1─* buildings ─1─* blocks ─1─* floors ─1─* units
properties ─*─* owners(users) via property_owners
units ─1─* leases ─*─1 tenants(party)
leases ─1─* rent_invoices ─1─* payments ─1─* receipts
units/properties ─1─* maintenance_requests ─*─1 vendors/technicians
tenants(company) ─1─* projects ─1─* project_reports / rfis / change_orders / milestones
tenants ─1─* legal_cases ─*─* documents ; legal_cases ─*─1 lawyers(users)
tenants ─1─* leads ─1─* opportunities (CRM)
* ─1─* documents (polymorphic owner via owner_type/owner_id)
* ─1─* audit_events (polymorphic)
* ─1─* messages / notifications
tenants ─1─* invoices / expenses / vendor_payments / purchase_orders / journal_sync
```

### 11.3 Selected table definitions (representative — the pattern for all)
The following are written in full; remaining tables follow the same conventions (audit columns, tenant_id, indexes on FKs + status + tenant_id).

**tenants**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| base_currency | char(3) | default 'NGN' (A-02) |
| status | enum(active,suspended) | |
| region | text | data residency (Q-04) |
| settings | jsonb | branding, policies (grace days, rent cap) |
| created_at/updated_at | timestamptz | |

**users**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | null only for platform Super Admin |
| email | citext UNIQUE(tenant_id,email) | |
| password_hash | text | argon2 |
| status | enum(invited,active,disabled) | |
| mfa_enabled | bool | |
| type | enum(internal,external) | external = tenant/owner/lawyer/contractor/vendor |
| Indexes | (tenant_id), (email) | |

**properties**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| type | enum(...11 types) | |
| name / property_code | text | property_code unique per tenant |
| geo | geography(Point) | GPS |
| developer_id / manager_id | uuid FK users | |
| status | enum(planning,under_construction,completed,active,inactive) | |
| construction_stage | text/enum | |
| attributes | jsonb | insurance, utilities, warranty, certificates meta |
| Indexes | (tenant_id,status), GIST(geo) | |

**units**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | tenant_id, floor_id FK |
| unit_number | text | unique per building |
| bedrooms/bathrooms/sq_ft | int/int/numeric | |
| rent_amount_minor / service_charge_minor | bigint | + currency |
| status | enum(available,reserved,occupied,notice,vacant,maintenance) | |
| current_lease_id | uuid FK (nullable) | |

**leases**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | tenant_id, unit_id FK, tenant_party_id FK |
| status | enum(draft,pending_approval,pending_signature,active,expired,terminated,renewed) | |
| start_date/end_date | date | |
| rent_amount_minor/cadence | bigint/enum | |
| deposit_minor | bigint | |
| terms | jsonb | clauses, escalation, penalties |
| document_id | uuid FK documents | signed lease |

**rent_invoices**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | tenant_id, lease_id FK |
| period_start/period_end | date | |
| amount_minor/currency | bigint/char3 | |
| status | enum(open,part_paid,paid,overdue,void) | |
| due_date | date | |

**payments**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | tenant_id, invoice_id FK |
| gateway | enum(stripe,paypal,paystack,flutterwave,cash,bank_transfer) | |
| gateway_ref | text | UNIQUE(tenant_id,gateway,gateway_ref) → idempotency (BR-04) |
| amount_minor/currency | bigint/char3 | |
| status | enum(pending,succeeded,failed,refunded) | |

**maintenance_requests**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | tenant_id, property_id/unit_id FK, requester_id |
| type | enum(emergency,preventive,routine,inspection) | |
| priority | enum(low,medium,high,emergency) | |
| status | enum(open,assigned,in_progress,on_hold,completed,cancelled) | |
| assignee_type/assignee_id | enum/uuid | technician or vendor |
| sla_due_at | timestamptz | |
| cost_minor | bigint | |

**documents** (polymorphic, versioned)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | tenant_id |
| owner_type/owner_id | text/uuid | property, unit, lease, case, tenant... |
| category | text | |
| current_version | int | |
| storage_key | text | S3 key of current version |
| ocr_text | tsvector (nullable) | full-text search |
| expires_at | timestamptz (nullable) | |

**audit_events** (append-only)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | tenant_id |
| actor_id / impersonator_id | uuid | BR-13 |
| entity_type/entity_id | text/uuid | |
| action | text | create/update/delete/approve/sign/pay... |
| before/after | jsonb | diff |
| ip / user_agent | text | |
| created_at | timestamptz | immutable |

### 11.4 Indexing, partitioning, views
- **Indexes:** every FK; composite `(tenant_id, status)` on high-volume tables; GIST on `geo`; GIN on `ocr_text` and JSONB attrs used in filters.
- **Partitioning:** range-partition `payments`, `rent_invoices`, `audit_events`, `messages`, `documents` by month (or hash by tenant for the largest tenants) to hit the A-09 ceiling.
- **Views (examples):** `v_property_financials` (income/expense/net roll-up), `v_occupancy` (unit status counts), `v_arrears` (overdue balances by tenant/property), `v_collection_rate`.
- **Stored procedures / functions:** `fn_apply_payment(invoice_id, payment)` (idempotent balance update in one transaction), `fn_accrue_late_fees(as_of_date)` (nightly), `fn_generate_rent_invoices(period)` (scheduled), `fn_close_lease(lease_id)` (deposit reconciliation). Business logic prefers the application layer; DB functions used only where transactional atomicity/throughput demands it.

### 11.5 Normalisation
Core relational entities are in **3NF**. Deliberate denormalisation is limited to (a) derived roll-up tables refreshed by triggers/jobs for dashboard performance, and (b) JSONB attribute bags for type-specific, sparsely-queried fields — never for anything used in joins, money, or access control.

---

# 12. API Specification

### 12.1 Standards (govern all endpoints)
- **Base:** `https://api.konkereplus.com/v1`. Versioned in path.
- **Auth:** `Authorization: Bearer <access_token>` (OIDC JWT). Tenant derived from token claim `tenant_id`; never from a client-supplied header for data scoping.
- **Format:** JSON; `Content-Type: application/json`. Dates ISO-8601 UTC. Money as `{ "amount_minor": 150000, "currency": "NGN" }`.
- **Pagination:** cursor-based `?limit=&cursor=`; responses include `next_cursor`.
- **Filtering/sorting:** `?filter[status]=active&sort=-created_at`.
- **Idempotency:** mutating POSTs accept `Idempotency-Key` header (required for payments).
- **Errors:** RFC-7807 problem+json:
```json
{ "type":"https://.../errors/validation","title":"Validation failed",
  "status":422,"detail":"rent_amount is required","errors":[{"field":"rent_amount","code":"required"}] }
```
- **Status codes:** 200/201/204 success; 400 malformed; 401 unauth; 403 forbidden (authz); 404 not found/out-of-scope; 409 conflict; 422 validation; 429 rate-limited; 5xx server.
- **Rate limits:** per-user + per-tenant token buckets; `429` with `Retry-After`. Payment/webhook endpoints separately limited.
- **Webhooks (inbound):** signature-verified (HMAC), idempotent by event id, respond 2xx fast then process async.

### 12.2 Endpoint inventory (grouped — CRUD implied where noted)
```
Auth:      POST /auth/login  /auth/refresh  /auth/logout  /auth/mfa/verify
           POST /auth/password/reset  /auth/invite/accept  GET /auth/me
IAM:       CRUD /users  /roles  /permissions  POST /tenants (super admin)
Property:  CRUD /properties  /properties/{id}/units  /buildings /blocks /floors
Units:     CRUD /units  POST /units/bulk
Tenants:   CRUD /tenant-parties  POST /tenant-parties/{id}/move-in|move-out
Leases:    CRUD /leases  POST /leases/{id}/approve|sign|renew|terminate
Rent:      GET/POST /invoices  POST /invoices/{id}/pay  GET /receipts/{id}
Maint:     CRUD /maintenance-requests  POST /{id}/assign|complete|rate
Construct: CRUD /projects /projects/{id}/reports /rfis /change-orders /milestones
CRM:       CRUD /leads /opportunities /appointments  POST /campaigns
Legal:     CRUD /legal-cases /{id}/documents /{id}/hearings  POST /{id}/notice
Docs:      CRUD /documents  POST /documents/{id}/versions  GET /search/documents
Comms:     POST /messages  GET /threads/{id}  POST /announcements
Finance:   CRUD /invoices /expenses /purchase-orders /vendor-payments
           GET /statements/owner/{ownerId}  GET /reports/{type}
Search:    GET /search?q=&types=
Notify:    GET /notifications  PATCH /notifications/{id}/read
Uploads:   POST /uploads (presigned S3)  ; media via presigned URLs
Webhooks:  POST /webhooks/{stripe|paypal|paystack|flutterwave|docusign|twilio}
```

### 12.3 Fully-worked examples (the template for all endpoints)

**Create a lease**
```
POST /v1/leases        Auth: Bearer <jwt>   Idempotency-Key: <uuid>
{
  "unit_id":"u_123","tenant_party_id":"tp_9",
  "start_date":"2026-08-01","end_date":"2027-07-31",
  "rent":{"amount_minor":150000000,"currency":"NGN"},
  "cadence":"annual","deposit":{"amount_minor":150000000,"currency":"NGN"},
  "terms":{"escalation_pct":7,"grace_days":5}
}
→ 201 Created
{ "id":"lease_777","status":"draft","unit_id":"u_123", ... , "created_at":"..." }
Errors: 422 if unit has an active lease (BR-01) → {"errors":[{"field":"unit_id","code":"unit_occupied"}]}
        403 if caller not manager of that property
```

**Pay an invoice (idempotent)**
```
POST /v1/invoices/inv_55/pay   Idempotency-Key: pay_abc
{ "gateway":"paystack","method_token":"tok_xyz",
  "amount":{"amount_minor":150000000,"currency":"NGN"} }
→ 202 Accepted { "payment_id":"pmt_1","status":"pending" }
Webhook paystack → POST /v1/webhooks/paystack (signed)
   → server verifies, applies fn_apply_payment once (BR-04), marks invoice paid,
     generates receipt, emits notification.
Retry with same Idempotency-Key → returns original 202/result, no double charge.
```

**List properties (scoped, paginated)**
```
GET /v1/properties?filter[status]=active&sort=-created_at&limit=20&cursor=...
→ 200 { "data":[ {property...} ], "next_cursor":"..." }
Scope: server returns only properties the caller may see (tenant + ownership).
```

**Global search**
```
GET /v1/search?q=Adeyemi&types=tenant,property,invoice
→ 200 { "results":[ {"type":"tenant","id":"tp_9","label":"Bola Adeyemi",...}, ... ] }
Results permission-filtered per caller (FR-SRCH-1).
```

**Standard for the remaining endpoints:** each is documented with method, path, auth/scope, request schema, ≥1 success + ≥1 error response, and idempotency/pagination where applicable — following the four examples above. A machine-readable **OpenAPI 3.1** spec is the authoritative artefact generated from these; this section is its human companion.

---

# 13. Security Model & Permission Matrix

### 13.1 Layers
1. **Network/edge:** Cloudflare WAF + DDoS, TLS termination, rate limiting.
2. **AuthN:** OIDC, 2FA (TOTP/SMS), SSO (SAML/OIDC) for enterprise, secure password policy, breach-check.
3. **AuthZ:** deny-by-default. Every request evaluated against **tenant scope → role permission → ownership scope**. Enforced centrally in the API layer (guard/interceptor), never only in UI.
4. **Data:** AES-256 at rest, TLS in transit, field-level encryption for the most sensitive PII (IDs/passports), tenant isolation via `tenant_id` on every query (enforced by a repository-level filter + row-level checks; Postgres RLS as defence-in-depth).
5. **Secrets:** central manager (AWS Secrets Manager/Vault), rotation, no secrets in code/logs.
6. **Audit:** immutable `audit_events` for all state changes; 7-yr retention for financial/legal.
7. **App security:** OWASP ASVS baseline, input validation, output encoding, CSRF protection for cookie flows, signed webhooks, upload scanning (AV + type/size limits), rate-limited auth.
8. **Fraud:** velocity checks on payments, anomaly flags, cash-recording controls, duplicate-payment prevention (BR-04).

### 13.2 Permission matrix (excerpt — full matrix generated per permission catalogue)
`C=create R=read U=update D=delete A=approve —=none` · scope in parentheses (T=whole tenant, O=owned/assigned, S=self, P=platform).

| Capability | SuperAdmin | CoAdmin | PropMgr | ConPM | Owner | Tenant | Legal | Lawyer | Contractor | Accountant | Vendor | Recept |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tenants (platform) | CRUD(P) | — | — | — | — | — | — | — | — | — | — | — |
| Users/Roles | CRUD(P) | CRUD(T) | — | — | — | — | — | — | — | — | — | — |
| Properties | R(P) | CRUD(T) | RU(O) | R(O) | R(O) | — | R(O) | R(case) | — | R(T) | — | — |
| Units | R(P) | CRUD(T) | CRUD(O) | — | R(O) | R(S) | — | — | — | R(T) | — | — |
| Tenant profiles | R(P) | CRUD(T) | CRUD(O) | — | R(O) | RU(S) | R(T) | R(case) | — | R(T) | — | C(inquiry) |
| Leases | R(P) | CRUD/A(T) | CRU(O) | — | R(O) | R(S) | R(T) | R(case) | — | R(T) | — | — |
| Rent/Invoices | R(P) | R(T) | RU(O) | — | R(O) | R/Pay(S) | — | — | — | CRUD(T) | — | — |
| Payments | R(P) | R(T) | R(O) | — | R(O) | C(S) | — | — | — | CRUD(T) | R(self) | — |
| Maintenance | R(P) | R(T) | CRUD(O) | — | R(O) | CRU(S) | — | — | RU(assigned) | R(T) | RU(assigned) | C |
| Construction | R(P) | R(T) | — | CRUD(O) | R(O) | — | — | — | RU(assigned) | R(T) | — | — |
| Legal cases | R(P) | R(T) | R(O) | — | R(O) | R(own) | CRUD/A(T) | RU(assigned) | — | — | — | — |
| Documents | R(P) | CRUD(T) | CRU(O) | CRU(O) | R(O) | RU(S) | CRUD(T) | RU(case) | RU(assigned) | R(T) | RU(self) | — |
| Finance/Statements | R(P) | R(T) | R(O) | R(O) | R(O) | — | — | — | — | CRUD(T) | R(self) | — |
| Comms | R(P) | CRUD(T) | CRUD(O) | CRUD(O) | RU(O) | RU(S) | CRUD(T) | RU(case) | RU(assigned) | RU(T) | RU(self) | CRU |
| Audit logs | R(P) | R(T) | — | — | — | — | R(legal) | — | — | R(fin) | — | — |
| Admin/Settings | CRUD(P) | CRUD(T) | — | — | — | — | — | — | — | — | — | — |

> The authoritative permission set is a **catalogue of granular permissions** (e.g. `lease.approve`, `payment.refund`); roles are compositions, and custom roles pick from the catalogue (FR-IAM-3). The matrix above is the human-readable summary of that catalogue.

---

# 14. UX, Wireframe Specifications & Design System

### 14.1 Design system foundations
- **Tokens:** color (brand primary, semantic success/warn/error/info, neutrals), spacing scale (4px base), radius, elevation, typography scale.
- **Theming:** light + **dark mode**; per-tenant brand primary/logo.
- **Components:** buttons, inputs, selects, date pickers, tables (sortable/filterable/paginated), cards, modals/drawers, tabs, toasts, empty states, skeleton loaders, file upload, image/PDF viewer, map, chart wrappers, stepper/wizard, comment/thread, notification bell.
- **States (every component/screen):** default, loading (skeleton), empty (with guidance + primary action), error (retry), success, disabled, permission-denied.
- **Accessibility:** WCAG 2.1 AA — keyboard nav, focus rings, ARIA, contrast, form labels/errors announced, reduced-motion.
- **Validation:** inline field errors on blur + summary on submit; server errors mapped to fields.

### 14.2 Responsive strategy
Breakpoints: `sm 640 / md 768 / lg 1024 / xl 1280`. Sidebar collapses to bottom nav / hamburger on mobile. Tables become stacked cards under `md`. Tenant & contractor flows are designed mobile-first.

### 14.3 Wireframe descriptions (representative screens — the pattern for all ~40)

**Property list (internal)**
- Header: title, "New property", global search, filter chips (type/status/manager).
- Body: paginated table — code, name, type, status, occupancy %, net (MTD), manager. Row → detail.
- Map toggle: cluster pins by GPS.
- Empty state: illustration + "Add your first property".

**Property detail**
- Header with status badge, key stats (occupancy, income MTD, open maintenance).
- Tabs: Overview · Units · Financials · Maintenance · Documents · Inspections · Legal · Media(gallery/tour/map).
- Right rail: owner(s), manager, quick actions (scoped by permission).

**Tenant portal — dashboard (mobile-first)**
- Cards: "Rent due" with amount + Pay button, next payment date, open maintenance status, unread messages, lease end countdown.
- Primary CTA: Pay rent → payment sheet (method select → confirm → receipt).

**Maintenance request (tenant)**
- Stepper: Category → Describe → Photos → Availability → Submit.
- After submit: tracking screen with status timeline and messaging.

**Construction daily report (mobile, offline-capable)**
- Fields: date, weather, crew count, work done, issues; photo capture (multi, geo/time-stamped); "Save offline" indicator + sync status chip.

**Lease wizard (internal)**
- Steps: Parties → Unit → Term & rent → Deposit & clauses → Review → Send for signature. Progress saved as draft at each step.

**Dashboard widgets** — see §14.4.

**Wireframe standard for remaining screens:** each screen documents purpose, primary role(s), layout regions, key components, actions (with permission gate), all applicable states from §14.1, and mobile behaviour.

### 14.4 Dashboards (per role)
Each dashboard = grid of widgets, role-filtered. Widget catalogue: revenue (line/bar), occupancy (gauge/donut), rent-collection rate & arrears, maintenance status funnel, legal-case load & upcoming hearings, construction progress (per project % + Gantt snapshot), cash flow, upcoming lease renewals, tasks, KPI tiles, notifications feed.
- **Executive:** revenue, occupancy, collection rate, construction progress, cash flow, legal exposure (read-only).
- **Owner:** per-property income/expense/net, occupancy, maintenance, statements.
- **Tenant:** rent due, receipts, maintenance, messages, lease countdown.
- **Property Manager:** occupancy, arrears, maintenance SLA, renewals, inspections due.
- **Construction PM:** milestones, budget vs actual, open RFIs/change orders, daily-report compliance, safety incidents.
- **Accountant:** invoices due/overdue, vendor payments, reconciliation status, statement generation.

---

# 15. Workflows & State Diagrams

### 15.1 Lease lifecycle (state)
```
draft → pending_approval → pending_signature → active
active → (renewal_window) → renewed(new lease) | expired
active → terminated (early, with reason)
active → notice → move_out → closed (deposit reconciled)
```

### 15.2 Maintenance request (state)
```
open → assigned → in_progress → completed → rated → closed
open/assigned → on_hold → (resume) in_progress
open → cancelled
[emergency & unassigned before sla_due_at] → escalated
```

### 15.3 Payment/rent (workflow)
```
invoice(open) → tenant pays → payment(pending)
  → gateway webhook(success) → fn_apply_payment (idempotent)
     → invoice(paid|part_paid) → receipt generated → notify
  → webhook(fail) → payment(failed) → invoice stays open → notify retry
nightly: fn_accrue_late_fees → overdue invoices get penalty (BR-03)
```

### 15.4 Construction change order (workflow)
```
draft → submitted → review → approved → baseline updated (budget/schedule)
                              ↳ rejected → draft
```

### 15.5 Legal case (state)
```
open → active → hearing_scheduled → in_hearing → judgement → settlement|closed
any → on_hold → active
notices/documents pass through: draft → pending_approval → approved → issued (immutable)
```

### 15.6 Document approval (state)
```
uploaded → in_review → approved (locked, versioned) | rejected → revise → in_review
```

### 15.7 Lead → sale (CRM workflow)
```
lead(new) → contacted → qualified → viewing_booked → offer → won | lost
won → creates tenant-party/lease (rental) or sale record
```

---

# 16. Artificial Intelligence Features

Each AI feature is specified as: purpose, inputs, output/action, and a **build note** (buy vs build, and a safe-fallback so the product never depends on the model being right).

| Feature | Purpose | Inputs | Output | Build note |
|---|---|---|---|---|
| Lease-risk / tenant-churn prediction | Flag tenants likely to default or not renew | payment history, complaints, lease age, arrears | risk score + top factors | Start rules/heuristics → gradient-boosted model later; human decides action |
| Maintenance prediction | Forecast asset failures / preventive timing | asset age, request history, inspection results | suggested PM schedule | Advisory only; PM confirms |
| Rent-collection prediction | Forecast month's collection & arrears | invoices, historical pay timing | expected collection %, at-risk list | Feeds dashboard; not for penalties |
| Document summary & OCR | Summarise contracts/notices; extract text | uploaded PDFs/images | summary + searchable text | OCR (Textract/Tesseract) + LLM summary; always show source |
| Chatbot / voice assistant | Tenant self-serve (balance, receipts, log maintenance) | user query + scoped data | answer/action | Retrieval-grounded; restricted to caller's scope; hands off to human |
| Fraud detection | Flag anomalous payments/refunds | payment velocity, amounts, patterns | flag for review | Rules first; ML later; never auto-block money without review |
| Construction progress recognition | Estimate % complete from site photos | daily-report images | progress estimate | Assistive; PM confirms baseline |
| Smart/semantic search | Better global search relevance | query + indexed entities | ranked results | Layer on top of OpenSearch |

**Governance:** AI outputs are advisory unless a human approves; every AI-driven suggestion is logged; models never see cross-tenant data; PII sent to third-party LLMs is minimised/redacted and gated by tenant setting (privacy).

---

# 17. Reporting & Analytics

- **Operational reports (per module):** rent roll, arrears aging, collection rate, occupancy, maintenance SLA compliance, lease expiry pipeline, construction budget-vs-actual, RFI/change-order log, legal case load, vendor spend.
- **Financial reports:** owner statements, P&L, balance sheet, cash flow, expense breakdown, invoice aging (ties to §5.14 and QuickBooks/Xero sync).
- **Delivery:** on-screen (filter + drill-down), scheduled email exports, CSV/PDF/XLSX download.
- **Analytics platform:** operational reads from read-replicas/`v_*` views; heavier analytics via an async ETL into a reporting store (start with materialised views, graduate to a warehouse if volume warrants). All analytics respect tenant + permission scope.
- **KPIs surfaced:** collection rate, occupancy %, NOI per property, average maintenance resolution time, lease renewal rate, construction schedule variance, DSO.

---

# 18. Audit Logging Requirements

- **Coverage:** every create/update/delete/approve/sign/pay/login/permission-change writes an `audit_events` row (§11.3) with actor, impersonator (if any), before/after diff, IP, user-agent, timestamp.
- **Immutability:** append-only; tampering prevented (no UPDATE/DELETE grants; optional hash-chaining for financial/legal).
- **Retention:** 7 years for financial/legal; configurable (≥1 yr) elsewhere; export for DSAR/legal hold.
- **Access:** scoped views (finance sees finance audit; legal sees legal). Super Admin platform audit is separate.
- **Alerting:** suspicious patterns (mass export, permission escalation, off-hours admin) raise security alerts.

---

# 19. Notification Matrix

`Channels: In-app(I) Email(E) SMS(S) Push(P) WhatsApp(W)`. Preferences & quiet hours per user (FR-COMM-5).

| Event | Recipients | Default channels |
|---|---|---|
| Rent due (T-7, T-1, due day) | Tenant | I, E, P, (S/W opt) |
| Payment received / receipt ready | Tenant, Manager | I, E |
| Payment overdue / late fee applied | Tenant, Manager | I, E, S |
| Maintenance received / assigned / completed | Tenant, Manager, Vendor | I, P, E |
| Maintenance SLA breach | Manager, Supervisor | I, P, S |
| Lease renewal window / expiry | Tenant, Owner, Manager | I, E |
| Lease sent for signature / signed | Tenant, Manager | I, E |
| New lead captured | Sales/CRM owner | I, E |
| RFI / change order needs approval | Approver | I, E |
| Legal hearing reminder / notice issued | Legal, Lawyer, party | I, E, S |
| Document expiring (ID, cert, warranty) | Owner of record | I, E |
| Owner statement ready | Owner | I, E |
| New message | Thread participants | I, P |
| Announcement / broadcast | Targeted audience | I, E, (P/W) |
| Security: new device / password change / role change | Affected user + admin | I, E |

Delivery is via the async Notifications service (retry, dedupe, per-channel provider fallback).

---

# 20. Mobile Requirements

| ID | Requirement |
|---|---|
| MOB-1 | Responsive web usable 320px+; native apps (Android/iOS) for tenant, contractor, inspector, PM field use. |
| MOB-2 | Push notifications (FCM) with deep links to the relevant record. |
| MOB-3 | Camera upload for maintenance/inspection/construction photos with geotag + timestamp. |
| MOB-4 | Offline mode for field capture (forms, photos, meter/inspection readings) with conflict-free sync queue (A-11 scope). |
| MOB-5 | Biometric login (Face/Touch ID) after first secure login. |
| MOB-6 | QR codes: unit/asset tagging → scan opens record; visitor passes. |
| MOB-7 | GPS for property navigation and geofenced site check-in. |
| MOB-8 | Graceful degradation: payments/legal signing require connectivity and are disabled offline. |

---

# 21. Infrastructure, Deployment, Scalability & Disaster Recovery

### 21.1 Environments
`dev → staging → production`, plus ephemeral **preview environments** per pull request. IaC (Terraform) defines all environments; no manual console changes in prod.

### 21.2 Deployment architecture
- Containers on **EKS or ECS Fargate**; ≥2 AZs; managed **PostgreSQL (RDS/Aurora)** with read replicas; **Redis (ElastiCache)**; **S3** + **Cloudflare** CDN/WAF; **OpenSearch**; managed queue.
- Blue/green or rolling deploys with health checks and automatic rollback.
- Autoscaling on CPU/latency/queue-depth for stateless services and the carved-out workers.

### 21.3 Scalability strategy
- Stateless app tier scales horizontally behind a load balancer.
- DB: read replicas for read-heavy dashboards; table partitioning (§11.4); connection pooling (PgBouncer); the largest tenants can be sharded by tenant later.
- Caching: Redis for sessions/hot reads; CDN for media & public site; HTTP caching for listings.
- Async offload: notifications, OCR/media, webhooks, search indexing run off the request path.
- Targets per A-09 / §6; capacity tests validate before each scale milestone.

### 21.4 High availability
Multi-AZ for compute + DB; stateless services with no local state; health-checked instances; graceful degradation (e.g. search down ≠ payments down).

### 21.5 Backup & Disaster Recovery
- **Backups:** automated DB snapshots + PITR; S3 versioning + cross-region replication; config/secrets backed up; documents immutable-versioned.
- **RPO ≤ 15 min, RTO ≤ 1 h** (NFR-AVAIL-2).
- **DR strategy:** warm standby in a second region; runbooks for region failover; **quarterly DR drills**; restore tests validated (a backup is only real if a restore has been tested).
- **Data residency:** region pinned per tenant where required (Q-04).

---

# 22. DevOps

- **Source control:** Git, **trunk-based** with short-lived branches; protected `main`; required reviews + CI green.
- **CI/CD:** GitHub Actions — lint, type-check, unit + integration tests, security scan (SAST/deps), build image, deploy to preview → staging → prod (prod behind manual approval).
- **Containers/orchestration:** Docker images; Kubernetes (EKS) or ECS; Helm/manifests in repo.
- **IaC:** Terraform for all cloud resources; state in remote backend with locking.
- **Secrets:** Secrets Manager/Vault; injected at runtime; rotation; never in images.
- **Observability:** OpenTelemetry traces, Prometheus metrics, centralised logs; dashboards + on-call alerting (SLO-based).
- **Environments/config:** 12-factor; config via env; feature flags for progressive rollout.
- **Release/rollback:** automated, health-gated, one-click rollback; DB migrations forward-only + backward-compatible (expand/contract pattern).

---

# 23. Quality Assurance & Testing Strategy

| Layer | What | Target |
|---|---|---|
| Unit | Domain logic (money, leases, permissions, state machines) | ≥80% coverage on domain code (NFR-MNT-1) |
| Integration | API + DB + external adapters (mocked gateways) | All endpoints; happy + error + authz paths |
| Contract | Webhook/gateway & OpenAPI contract tests | Prevent breaking changes |
| E2E | Critical journeys (pay rent, create lease, dispatch maintenance, daily report offline, provision tenant) | Automated (Playwright/Detox) in CI |
| Performance | Load & soak at scale milestones | Meet §6 P95/throughput |
| Security | SAST, DAST, dependency scanning, **annual pen test** | No criticals unresolved |
| Accessibility | Automated (axe) + manual audits | WCAG 2.1 AA |
| UAT | Business sign-off per module against acceptance criteria (§7) | Signed off before release |

**Automation strategy:** test pyramid (many unit, fewer integration, few E2E); CI gates on unit+integration+contract; nightly full E2E + performance smoke; flaky-test quarantine; test data via factories with tenant isolation. **Definition of Done** per story includes tests, docs, audit event, i18n keys, and passing pipeline.

---

# 24. Integrations

| Integration | Use | Notes |
|---|---|---|
| Google Maps / PostGIS | Property GPS, listing maps, geofencing | Maps for display; PostGIS for queries |
| Stripe / PayPal | International card & wallet payments | Multi-gateway router |
| Paystack / Flutterwave | West-Africa payments (A-01) | Local methods, transfers |
| Twilio | SMS, voice | Notifications & OTP |
| WhatsApp Business | Messaging channel | Templates, opt-in |
| DocuSign | E-signature (leases, legal) | Native fallback (A-07) |
| Google Calendar / Outlook | Appointments, hearings, inspections | 2-way sync |
| Microsoft 365 / Google Workspace | SSO, docs | Enterprise SSO |
| QuickBooks / Xero | Statutory accounting sync (A-08) | Ledger export/reconcile |
| AWS S3 / Cloudflare | Storage + CDN/WAF | Media, documents |
| Firebase (FCM) | Mobile push | Deep links |

**Integration principles:** each external service behind an **adapter interface** (swap providers without touching domain); inbound webhooks signed + idempotent; outbound calls retried with backoff + circuit breaker; per-tenant credentials stored in secret manager; failures degrade gracefully and alert.

---

# 25. Delivery Roadmap, Sprint Plan & Timeline

*(Indicative; assumes ~2 squads. Timeline is planning guidance, not a commitment — see Risk Register.)*

### 25.1 Phases

| Phase | Theme | Key scope | Approx. |
|---|---|---|---|
| **0 — Foundation** | Platform skeleton | Multi-tenancy, IAM/RBAC, audit, CI/CD, IaC, base design system | ~6–8 wks |
| **1 — Core Property & Leasing (MVP)** | Rent flowing | Properties/Units, Tenants, Leases, Rent + one payment gateway, Tenant portal, basic dashboards | ~10–12 wks |
| **2 — Maintenance & Comms** | Operations | Maintenance, Communication Center, Documents/DMS, notifications, Owner portal | ~8–10 wks |
| **3 — Construction & CRM** | Build + sell | Construction module (reports, RFIs, change orders, Gantt), CRM, public website + listings | ~10–12 wks |
| **4 — Legal & Finance depth** | Compliance & money | Legal module, full Financial mgmt, accounting sync, statements, more gateways | ~10–12 wks |
| **5 — Mobile & AI & Scale** | Field + intelligence | Native apps, offline, AI features, search depth, performance/scale hardening | ~10–12 wks |

### 25.2 Sample sprint breakdown — Phase 1 (2-week sprints)
- **S1:** Property/Unit CRUD + hierarchy; property list/detail screens; seed data & permissions.
- **S2:** Tenant profiles + move-in; Tenant party model; document attach.
- **S3:** Lease wizard + templates + approval workflow (no e-sign yet).
- **S4:** E-signature integration; lease → active; deposit tracking.
- **S5:** Rent invoice generation + one gateway (Paystack) + idempotent webhooks + receipts.
- **S6:** Tenant portal (pay rent, receipts, lease view) + manager collection dashboard; UAT + hardening.

### 25.3 Release strategy
- Internal alpha at end of Phase 1 (anchor tenant, limited properties).
- Private beta after Phase 2.
- GA after Phase 4; mobile GA in Phase 5.
- Continuous delivery to staging; gated prod releases; feature flags for progressive exposure.

---

# 26. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Scope is very large; "everything at once" stalls delivery | High | High | Strict phased MVP (§25); MoSCoW; defer W/C items |
| R-02 | Payment reconciliation errors / double charges | Med | High | Idempotency (BR-04), daily reconciliation, gateway sandbox tests, alerting |
| R-03 | Multi-tenant data leakage | Low | Critical | Central authz, RLS defence-in-depth, tenant-isolation tests in CI |
| R-04 | Unresolved open questions (§3.2) block features | Med | Med | Time-boxed decisions; build behind flags; assumptions documented |
| R-05 | Offline sync conflicts corrupt field data | Med | Med | Conflict-free queue, server-authoritative timestamps, no offline money/legal |
| R-06 | Third-party gateway/region availability (esp. local) | Med | Med | Multi-gateway router, circuit breakers, graceful degradation |
| R-07 | Compliance (NDPR/GDPR) gaps | Med | High | Privacy-by-design, DSAR tooling, DPO review, data map |
| R-08 | Scale assumptions (A-09) wrong → cost/perf surprises | Med | Med | Load test per milestone; partitioning ready; cost monitoring |
| R-09 | AI features over-trusted for money/legal decisions | Med | High | Advisory-only, human approval, full logging |
| R-10 | Key-person/tech-choice risk (mono stack decision) | Med | Med | Decide backend stack org-wide early; document ADRs |

---

# 27. Future Enhancement Roadmap

- Channel management for short-stay (Airbnb/Booking sync) — pending Q-02.
- Dedicated-DB isolation tier for enterprise tenants.
- Automated KYC/identity verification provider.
- IoT/smart-building integrations (meters, access control).
- Tenant credit-scoring integrations.
- Advanced BI/warehouse + self-serve report builder.
- Marketplace for vendors/contractors.
- Additional languages (French, local languages) via existing i18n.
- Native e-sign maturity to reduce DocuSign cost at volume.
- Investor portal with fractional-ownership & distribution tracking.

---

# 28. Appendix — Traceability & Conventions

- **Traceability:** every FR maps to ≥1 user story (§7) and ≥1 test (§23); every screen (§14) maps to the FRs it satisfies; every endpoint (§12) maps to an FR and permission (§13). The OpenAPI file + a requirements-traceability matrix (RTM) are maintained as living artefacts generated from these IDs.
- **ID conventions:** `FR-<MOD>-n`, `NFR-<CAT>-n`, `US-<MOD>-nn`, `BR-nn`, `A-nn` (assumption), `Q-nn` (open question), `R-nn` (risk), `MOB-n`.
- **Definition of Done (global):** code + unit/integration tests + docs + audit event + i18n keys + accessibility pass + permission check + pipeline green + product acceptance against §7 criteria.

---

## What is fully specified vs. what extends from a pattern

**Written out in full:** vision, personas, functional & non-functional requirements, business rules, IA/navigation/sitemap, architecture & tech stack, core data model + conventions, API standards + worked examples, security model + permission matrix, workflows/state machines, notification matrix, AI/reporting/audit/mobile/DevOps/DR/QA/integrations, roadmap, risks.

**Provided as inventory + governing pattern + worked examples (extend mechanically):** the remaining ~40 individual screen wireframes (pattern in §14.3), the full ~300-endpoint catalogue (standard + 4 worked examples in §12, authoritative OpenAPI to be generated), every table beyond the representative set (conventions in §11.1/§11.3), and the full user-story backlog (template in §7).

*End of Foundation Draft v0.9.*
