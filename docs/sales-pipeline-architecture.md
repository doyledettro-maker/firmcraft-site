# Sales Pipeline Architecture

**Module:** Admin — Leads / Outreach / Opportunities
**Date:** July 2, 2026
**Status:** Live in production
**Audience:** Anyone (human or agent) extending the Firmcraft sales funnel

---

## The funnel in one picture

```
  INBOUND                      OUTBOUND
  marketing-site forms         cold prospecting
  ┌──────────────┐             ┌──────────────────────────────┐
  │ inbound_leads│             │ companies ── contacts        │
  │  (/leads)    │             │      │                       │
  └──────┬───────┘             │ correspondence (event log)   │
         │ convert             │  (/outreach)                 │
         │ (promotes onto ─────►                              │
         │  the outreach graph)└──────────┬───────────────────┘
         │                                │ convert
         ▼                                ▼
              ┌─────────────────────────────────┐
              │ opportunities  (/opportunities) │
              │ qualified → discovery →         │
              │ pilot_scoped → proposal →       │
              │ closed_won / closed_lost        │
              │ (parked = on ice)               │
              └───────────────┬─────────────────┘
                              │ closed_won
                              ▼
                    clients (/clients, onboarding)
```

Two front doors, one pipeline:

- **Leads** (`inbound_leads`) — people who reached out through the marketing
  site (contact form, homepage CTA, support). Person-level, free-text company.
  This is a triage inbox, not the pipeline.
- **Outreach** (`companies` / `contacts` / `correspondence`) — the cold-outbound
  graph and the **system of record for relationship history**. Every email,
  open, click, reply, call, meeting, note, and SMS is a `correspondence` row.
- **Opportunities** (`opportunities`) — the sales pipeline. Always references a
  `companies` row (FK) and optionally a primary `contacts` row.

## Core invariants — do not break these

1. **Opportunities sit ON TOP of outreach.** Converting a lead or an outreach
   company never moves, mutates, or deletes the underlying company / contact /
   correspondence rows. An opportunity only references them.
2. **One open opportunity per company.** Enforced by the partial unique index
   `opportunities_company_open_uniq` (`stage not in ('closed_won','closed_lost')`
   — note `parked` counts as open). UIs must link to the existing opportunity
   instead of creating a duplicate; APIs return **409 + the existing
   opportunity** on conflict.
3. **Relationship history lives in `correspondence`.** If an interaction
   matters (including an inbound lead's original message), it becomes a
   correspondence row — that's what powers last-touch, the "stale" signal, and
   the timeline in every drawer.
4. **`closed_at` is managed server-side** (PATCH handler in
   `admin/src/app/api/opportunities/[id]/route.ts`): entering a closed stage
   stamps it, reopening clears it (and clears `lost_reason` when leaving
   `closed_lost`).
5. **Deploy-before-migrate is safe.** Opportunity read paths tolerate a
   missing table (Postgres `42P01` / PostgREST `PGRST205` → empty result), so
   the app can ship ahead of the migration. Keep this property when adding
   read paths.

## Stages

`qualified → discovery → pilot_scoped → proposal → closed_won / closed_lost`,
plus `parked` (deliberately on ice; still blocks duplicates). Labels and the
active/resolved split live in `admin/src/lib/opportunity-signals.ts`
(`STAGE_LABELS`, `ACTIVE_STAGES`, `RESOLVED_STAGES`).

## Derived signals (computed, never stored)

Defined in `admin/src/lib/opportunity-signals.ts`, used by the board, the
dashboard, and anything else that needs them:

- **needs_attention** — `special_attention` is true AND `next_action_due_at`
  is missing or in the past. (Setting a due date clears the flag until it's
  actually overdue — by design.)
- **stale** — no correspondence touch in `STALE_DAYS` (14); falls back to the
  opportunity's age when the company has no correspondence at all.
- **closing_soon** — close window starts within `CLOSING_SOON_DAYS` (45), or
  has already slipped past.

Last touch comes from `getLatestTouchByCompany()` in
`admin/src/lib/db/correspondence.ts` and is merged into opportunities as
`lastTouchAt` by callers (see `/opportunities` page).

## Conversion flows

### Outreach company → opportunity

Outreach company drawer → **Create opportunity** (or the "Opp" badge links to
the existing one). `POST /api/opportunities` with prefills: most-engaged
contact (by `ENGAGEMENT_RANK`) as primary, `owner` from `assigned_to`,
`use_case` from company notes.

### Inbound lead → opportunity

Leads row → expand → **Convert to opportunity**. The modal
(`ConvertLeadModal` in `admin/src/components/LeadsTable.tsx`) first fetches
`GET /api/leads/[id]/convert`, which suggests existing outreach companies by
fuzzy name match **and by contact email domain** (personal-mail domains
excluded), each flagged with its open opportunity. Then
`POST /api/leads/[id]/convert` performs, in order:

1. Resolve company — link the chosen existing company, or
   `upsertCompanyByName` (status `engaged`, segment from the lead, default
   name = lead's company text, else the person's name — common for
   small-business owners).
2. Create the contact from the lead (status `replied`, `replied_at` =
   lead's `created_at`) — or reuse an existing same-email contact at that
   company.
3. Log the lead's message as `correspondence` (`email_replied`, dated at the
   lead's `created_at`, `metadata.inbound_lead_id` for traceability).
4. Create the opportunity at stage `qualified` (use case = the message), or
   link the company's existing open one.
5. Stamp the lead: `status='converted'` + `company_id` / `contact_id` /
   `opportunity_id` FKs. These FKs are what render the "Opp" badge and block
   double-conversion (409 with the existing `opportunityId`).

Lead statuses: `new → contacted → qualified → converted / archived`.
`qualified` means "ready to convert" — a qualified-but-unconverted lead is a
to-do. `converted` is only ever set by the convert endpoint.

## File map

| Concern | Files |
| --- | --- |
| Migrations | `admin/supabase/migrations/20260702000000_opportunities.sql`, `…20260702100000_inbound_leads_conversion.sql` |
| DB layer | `admin/src/lib/db/opportunities.ts`, `leads.ts`, `companies.ts`, `contacts.ts`, `correspondence.ts` (re-exported via `db/index.ts`) |
| Domain helpers (client-safe, no Supabase import) | `admin/src/lib/opportunity-signals.ts` |
| API | `admin/src/app/api/opportunities/route.ts` (GET list, POST create w/ 409 dedupe), `…/[id]/route.ts` (GET w/ contacts+correspondence, PATCH, DELETE), `admin/src/app/api/leads/[id]/convert/route.ts` (GET suggestions, POST convert) |
| Pages | `admin/src/app/opportunities/page.tsx`, `leads/page.tsx`, `outreach/page.tsx`, dashboard `page.tsx` (pipeline card) |
| Components | `admin/src/components/opportunities/OpportunityBoard.tsx` (board, list, drawer, new-opp modal), `LeadsTable.tsx` (+ convert modal), `outreach/OutreachWorkspace.tsx` (badge + convert), `outreach/CorrespondenceTimeline.tsx` (shared timeline row) |

## Conventions to follow when extending

- **DB modules** own snake_case↔camelCase mapping and return typed objects;
  routes validate enums against the exported `*_STAGES` / `*_STATUSES` arrays.
  Client components import DB types with `import type` only.
- **Deep-linking:** `/opportunities?opp=<id>` opens the drawer — use it from
  anywhere that references an opportunity.
- **Plan tiers** on opportunities are the live Operator tiers
  (`solo/team/pro/pilot`); picking one auto-suggests year-1 value
  (12 × monthly + setup) from `PLAN_PRICING` in `admin/src/lib/pricing.ts`.
- **UI grammar:** KPI row → Card → toolbar (search + filters) → dense
  table/board → right-side drawer → centered modals. Reuse `components/ui.tsx`
  primitives and the existing badge/tone patterns.
- **New migrations** must be idempotent (`if not exists`, guarded DO blocks) —
  they're applied with plain `psql`/`supabase db push` and may run twice.

## Deploying changes to this module

1. Merge to `main` → hosting redeploys `admin.firmcraft.ai` automatically.
2. Apply any new migration to the production Supabase (SQL editor or
   `supabase db push` / `psql` from a machine with credentials — the Claude
   Code cloud environment does **not** have DB credentials).
3. Order doesn't matter for reads (see invariant 5), but conversion/creation
   writes fail loudly until the migration is applied.
