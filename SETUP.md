# KonkerePlus — Setup (real app foundation)

The `feat/foundation` branch turns the repo into a **Next.js + Supabase** app with real auth
and a multi-tenant, row-level-security database core. The live marketing prototype at
konkereplus.com is untouched (it stays on `main`) until we cut over.

## What you do (Supabase — ~5 min, only you can)

1. **Create the project** → https://supabase.com → New project (name `konkereplus`, region closest to you, e.g. `eu-west` or `us-east`). Save the database password.
2. **Run the schema** → Supabase → **SQL Editor** → New query → paste the entire contents of
   [`supabase/migrations/0001_foundation.sql`](supabase/migrations/0001_foundation.sql) → **Run**.
   You should see it succeed (creates `tenants`, `profiles`, `memberships`, RLS, helper functions).
3. **Get the keys** → Project Settings → **API** → copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **(Recommended) Turn off email confirmation for now** → Authentication → Providers → Email →
   disable "Confirm email" so you can sign up and log in instantly during development.

Then paste those two keys here and I'll wire them into local dev + Netlify.

## What I do (already scaffolded on this branch)

- Next.js 14 (App Router, TypeScript, Tailwind) app.
- Supabase auth: `/login` (log in + create account), session middleware, `/dashboard` gated to signed-in users.
- The `0001_foundation.sql` migration (multi-tenant schema + RLS + `create_tenant()` onboarding RPC).

## Run locally

```bash
cp .env.example .env.local     # then fill in the two Supabase values
npm install
npm run dev                    # http://localhost:3000
```

- `/` landing → `/login` → create an account → you land on `/dashboard`.
- New accounts have **no tenant yet** — the next push adds the "create your company" onboarding
  step (calls the `create_tenant` RPC) and then the first real module (Properties).

## Deploying the real app

When the foundation is solid we point the Netlify site's build at Next.js (config already in
`netlify.toml`) and cut `main` over — at which point konkereplus.com becomes the real app and the
static prototype is retired (kept in `prototype/` for reference).
