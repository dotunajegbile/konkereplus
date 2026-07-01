# KonkerePlus

Multi-tenant real-estate SaaS — **build, sell, lease, and manage** every property, behind one permission-first login. Spans construction → sales/leasing → property & facilities management → tenant relations → legal → finance.

This repository currently contains two things:

| Folder | What it is |
|---|---|
| **`/prototype`** | A no-build, browser-openable **clickable prototype** of the product — public marketing site + a role-switchable application shell demonstrating the key portals, dashboards, and module flows. All data is mock. |
| **`/docs`** | **Delivery & planning artifacts** derived from the Requirements Workbook — a refined roadmap and a concrete, estimated Phase 1 backlog. |

The authoritative product/technical specification is the **Requirements Workbook v0.9** (SRS + PRD + architecture + delivery plan). These artifacts operationalise it.

---

## Running the prototype

It's plain static HTML/CSS/JS — **no build step, no dependencies.**

```bash
# Option A — open directly
#   open prototype/index.html in a browser

# Option B — tiny bundled static server (Node, zero deps)
node serve.cjs 8781
#   → http://localhost:8781/
```

- **`index.html`** — public marketing site: hero, services, filterable listings, investor CTA, role portals, lead-capture form.
- **`app.html`** — the application. A hash-routed SPA with a **role switcher** (bottom-left). Switch between Super Admin, Company Admin, Property Manager, Construction PM, Owner, Tenant, Legal, and Accountant to see:
  - **permission-filtered navigation** (menu items appear/disappear per role),
  - **role-specific dashboards**,
  - a **permission-denied** screen when a role deep-links to an area it can't access,
  - working flows: **lease wizard**, **maintenance request stepper**, **pay-rent** (with idempotency note), global search, dark/light theme toggle.

### What to click first
1. Open `app.html` → you land as **Company Admin**.
2. Use the **role switcher** to become a **Tenant** — the nav collapses to the tenant portal; try **Pay Rent**.
3. Switch to **Construction PM** — see projects, daily reports, RFIs.
4. Switch to **Super Admin** — see the platform tenants view.
5. Toggle the ☀/☾ theme button in the top bar.

---

## Prototype architecture

```
prototype/
├── index.html          Public marketing site (self-contained)
├── app.html            SPA host (loads the shell)
└── assets/
    ├── theme.css       Design tokens + component primitives (§14.1)
    ├── app.css         Application shell layout (sidebar, topbar, kanban, modals…)
    ├── data.js         All mock data + formatters + role/nav catalogue
    └── app.js          SPA: role state, permission-filtered nav, hash router,
                        role dashboards, module views, and modal flows
```

- **`data.js`** is the single source of mock content — roles, the navigation catalogue (each item lists which roles may see it), properties, units, tenants, leases, invoices, maintenance, projects, leads, cases, finance, documents, audit, and public listings.
- **`app.js`** renders everything from that data. Navigation is filtered by `roleCan()`; the router enforces a deny-by-default permission gate mirroring the workbook's security model (§13).

Verified: 8 roles × 22 views + flows render with **0 runtime errors** (headless DOM check).

---

## Fidelity note

This is a **design & interaction prototype**, not the product. There is no backend, no real auth, no real payments — the workbook's ~40 screens and ~300 endpoints are represented by their most important, demoable slices plus the governing patterns. See `docs/ROADMAP.md` for how this maps to a real build.
