# Scheduling & Dispatch — Edge Functions (Phase 2.1, Sprint 2)

Supabase Edge Functions for the job lifecycle API. They run as trusted server code
(service-role DB client) and enforce tenant isolation + roles in application code;
Postgres RLS (migration `006`) is the defense-in-depth hard boundary for the
direct PostgREST access used by the client app.

## Functions

| Function | Purpose | Auth accepted | Role/scope |
|---|---|---|---|
| `create-job` | Create a job; auto-populates duration/revenue from job_type, address/location from customer; `scheduled` if a tech is given else `created`. | JWT · service · **widget** | widget needs `create_job` |
| `update-job` | Partial edit; assigning a tech to a `created` job auto-promotes to `scheduled`. | JWT · service | `admin` / `dispatcher` |
| `transition-job` | Status change; trigger validates legality. Side effects: `in_progress`→stamp `actual_start`, `completed`→`actual_end`, `en_route`→ETA, `cancelled`→reason in audit. | JWT · service | tech: own jobs only |
| `complete-job` | Finish an in-progress job, assemble the §6.3 `invoice_data` package (persisted on `jobs.invoice_data`). | JWT · service | tech: own jobs only |
| `check-availability` | Per-tech open slots for a date (tenant TZ work hours − jobs − time-off), skill/zone filtered. | JWT · service · **widget** | widget needs `check_availability` |
| `tech-location` | Ingest a GPS ping; upsert current location + append history. Rate-limited 2/sec/tech. | JWT · service | tech identity required |

## Authentication (`_shared/auth.ts`)

Three paths, declared per endpoint:

1. **`jwt`** — Clerk session JWT in `Authorization: Bearer …`, verified against the
   issuer's JWKS. Claims: `tenant_id`, `role`, `tech_id`, `sub`.
2. **`service`** — trusted backend (the AI phone agent / Hermes, tests). Presents the
   Supabase **service-role key** as the bearer plus `x-tenant-id` / `x-role` /
   `x-tech-id` / `x-actor` headers.
3. **`widget`** — public embeddable booking widget (Phase 3). Tenant-scoped key in
   `x-firmcraft-widget-key`, looked up in `public.widget_keys` (SHA-256 hashed),
   scoped + rate-limited. No user/role.

`verify_jwt = false` in `config.toml` for all six — the gateway's Supabase-JWT check
would reject Clerk/widget callers, so auth is done in-function.

## Required environment

Auto-injected by the Supabase runtime: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
Set as function secrets for the Clerk JWT path:

- `CLERK_ISSUER` (**required** for the JWT path) — pins the accepted token
  issuer, e.g. `https://clerk.your-domain.com`. If unset, ALL Clerk JWTs are
  rejected (fail closed): tokens are verified against the issuer's own JWKS,
  so trusting any issuer we don't operate would let an arbitrary Clerk account
  mint tokens with any tenant_id/role claims. Service-key and widget-key auth
  paths are unaffected.

```bash
supabase secrets set CLERK_ISSUER="https://clerk.firmcraft.ai" --project-ref qvocmbqgcdambvslmula
```

## Deploy

Requires `SUPABASE_ACCESS_TOKEN` (personal access token) or `supabase login`.

```bash
cd admin
export SUPABASE_ACCESS_TOKEN=sbp_xxx
for fn in create-job update-job transition-job complete-job check-availability tech-location; do
  npx supabase functions deploy "$fn" --project-ref qvocmbqgcdambvslmula
done
```

`config.toml` already sets `verify_jwt = false`, so no per-deploy flag is needed.

## Test

In-process integration tests against the live DB (uses the service-credential path
and a direct Postgres connection for the RLS assertion):

```bash
cd admin
deno test -A --env-file=.env.local --config supabase/functions/deno.json \
  supabase/tests/scheduling-api.test.ts
```

Type-check only:

```bash
deno check --config admin/supabase/functions/deno.json admin/supabase/functions/*/index.ts
```
