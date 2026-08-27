# RESTORE — Reinstate this site anywhere with nothing missing

This repository is a **complete, self-contained snapshot** of the Parfora / Parfumitry
storefront. Everything needed to stand the site back up — on Vercel, Lovable, or any
other host — lives in this repo. Follow this guide top to bottom on a fresh machine or a
fresh Supabase project and you get the exact same site.

Last full snapshot: see the date in `supabase/seed/seed.sql`.

---

## 1. What's already in this repo (no external fetch needed)

| Content | Where | Notes |
| --- | --- | --- |
| Full product catalog (163 products) | `src/data/products.ts` | names, prices, sizes, descriptions, attributes |
| Product attribute data | `supabase/seed/seed.sql` (`product_attributes`) | also mirrored in catalog |
| All product images (322 in `public/`, 45 in `src/assets/`) | `public/`, `src/assets/products/` | committed as static files + `*.asset.json` |
| Seed reviews (home + per-product) | `src/data/homeReviews.ts`, `src/data/productReviews.ts` | the baseline reviews the site renders |
| All translations | `src/data/extraTranslations.ts` | multi-language copy |
| Database schema (78 migrations) | `supabase/migrations/` | 20 tables, functions, triggers, RLS, storage buckets + policies |
| Edge functions (30) | `supabase/functions/` | checkout, order emails, bancontact, sumup, admin, tracking, etc. |
| Live DB row data | `supabase/seed/seed.sql` | current dynamic rows (attributes, profiles, config singletons, etc.) |
| Frontend app | `src/`, `index.html`, `vite.config.ts` | Vite + React + React Router SPA |

Because the catalog, images, seed reviews, and translations are **code/static assets**,
the site renders fully even against an empty database. The database only layers on
*dynamic* state: admin overrides (price/name/stock/description/padding), user-submitted
reviews, orders, and the live counters/config.

> **Important honesty note:** the reviews/overrides/orders in `seed.sql` reflect the
> **current** backend project (`whoijmulomzwvsjomret`), which is a clean rebuild. The
> historical admin-entered data from the *original* deleted project
> (`kolnekutwubdwqpgzaob`) is **not** in this snapshot — that project was offline when
> this snapshot was taken. If that project is ever restored, re-run the export in §6 to
> capture its data.

---

## 2. Tech stack

- **Frontend:** Vite + React + TypeScript + Tailwind + React Router (BrowserRouter, SPA).
- **Backend:** Supabase — Postgres, Auth, Storage, Edge Functions (Deno).
- **Email:** Resend. **Payments:** SumUp / Bancontact (active); PayPal intentionally disabled.
- **Hosting:** static SPA build (`dist/`) — deploy anywhere. SPA deep-links need a
  catch-all rewrite to `/index.html` (see `vercel.json`).

---

## 3. Prerequisites

- Node 18+ and a package manager (repo has both `package-lock.json` and `bun.lockb`).
- A Supabase project (new or existing).
- [Supabase CLI](https://github.com/supabase/cli) for migrations + function deploys.
- API keys: Resend, SumUp (PayPal only if you re-enable it).

---

## 4. Reinstate the backend (Supabase)

### 4a. Create / pick a project
Create a Supabase project. Note its **project ref**, **URL**, **anon (publishable) key**,
and **service_role key** (Project Settings → API).

### 4b. Apply the schema (creates tables, functions, triggers, RLS, and storage buckets)
```bash
supabase link --project-ref <YOUR_REF>
supabase db push        # applies everything in supabase/migrations/
```
The migrations create the three storage buckets automatically:
`product-images` (public), `review-images` (public), `payment-proofs` (private),
plus their RLS policies.

### 4c. Load the data seed
```bash
# via CLI (psql):
supabase db execute --file supabase/seed/seed.sql
# or with any psql client:
psql "<POSTGRES_CONNECTION_STRING>" -f supabase/seed/seed.sql
```
The seed is idempotent (`ON CONFLICT DO NOTHING`) so it's safe to re-run.

### 4d. Deploy the edge functions
```bash
export SUPABASE_ACCESS_TOKEN=<your personal access token>   # sbp_...
supabase functions deploy --use-api --project-ref <YOUR_REF>
```
`--use-api` bundles server-side (no Docker needed). All functions ship with
`verify_jwt = false` per `supabase/config.toml`.

### 4e. Set edge-function secrets
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by
Supabase. Set the rest:
```bash
supabase secrets set \
  RESEND_API_KEY="<resend key>" \
  SUMUP_API_KEY="<sumup key>" \
  PAYPAL_CLIENT_ID="Dont need it" \
  PAYPAL_SECRET="Dont need it" \
  --project-ref <YOUR_REF>
# LOVABLE_API_KEY is only used by the optional translate-text function (non-critical).
```

### 4f. Recreate the admin accounts
Admin access is **email-based only** (hardcoded allowlist in code — no role table).
The allowed admins are `ewhz3384@gmail.com` and `elkhabirmalik@gmail.com`.
Create them (email pre-confirmed) with the service_role key:
```bash
curl -X POST "https://<YOUR_REF>.supabase.co/auth/v1/admin/users" \
  -H "apikey: <SERVICE_ROLE_KEY>" -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"ewhz3384@gmail.com","password":"<choose>","email_confirm":true}'
# repeat for elkhabirmalik@gmail.com
```
To change who is an admin, edit the email allowlist in `src/hooks/useReviews.ts`
(`ADMIN_EMAIL`) and the admin gate in `src/pages/AdminOrders.tsx`.

---

## 5. Reinstate the frontend

### 5a. Environment variables
The browser app reads three build-time vars (Vite bakes them into the bundle). Set them
in a local `.env` for dev and in your host's env for production:
```
VITE_SUPABASE_PROJECT_ID=<YOUR_REF>
VITE_SUPABASE_URL=https://<YOUR_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key>
```
> Vite only reads `.env` at **startup** and bakes these into the build. After changing
> them you must restart `dev` or rebuild. A stale value here is the classic "checkout
> silently does nothing" bug — the app talks to the wrong project.

### 5b. Install, run, build
```bash
npm install          # or: bun install
npm run dev          # local dev
npm run build        # production build -> dist/
```

### 5c. Deploy
- **Vercel:** import the repo, set the three `VITE_` env vars, deploy. `vercel.json`
  already rewrites all routes to `/index.html` for SPA deep-links.
- **Lovable / other static host:** upload `dist/` and add a catch-all rewrite to
  `/index.html`.

---

## 6. Re-export the data (to refresh this snapshot later)

To capture the current DB state again into `supabase/seed/seed.sql`, run a dump that
emits `jsonb_populate_recordset` inserts for every public table. Provide Postgres
connection env vars (`POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DATABASE`) and regenerate. Storage objects, if any exist, should be downloaded
from the buckets and committed under `public/` (this site keeps images as repo assets, so
the buckets are normally empty).

---

## 7. Post-restore smoke test

1. Home page renders with hero, catalog, and reviews.
2. Add a product to cart → Checkout → fill address → place a **Cash on Delivery** order
   (COD is geo-restricted to Portlaoise, Ireland) → confirm a row lands in `orders` and a
   Resend confirmation email fires.
3. Log in at `/login` as an admin → `/admin/orders` loads with Orders / Live Visitors /
   Reviews tabs.

If checkout "succeeds" but no `orders` row appears, the frontend `VITE_SUPABASE_*` values
are pointing at the wrong project — fix §5a and rebuild.
