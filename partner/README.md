# Firmcraft Partners

Partner / reseller portal. Deployed at `partners.firmcraft.ai`.

## What's here

- `/login` — partner sign-in (slug + access token)
- `/` — overview (clients, commission this month, plan mix)
- `/clients` — read-only list of the partner's referred clients
- `/commissions` — per-client commission breakdown for the current month
- `/submit` — onboarding survey for new client referrals (flows into admin Submissions queue)

UI only. Auth is a mock cookie-based session keyed by partner slug; replace with the real provider before launch. All client / commission data is mocked in `src/lib/mock-partners.ts` (shared shape with the admin app).

## Auth boundary

The portal lives on its own subdomain (`partners.firmcraft.ai`) and uses a separate session cookie (`fc_partner_session`) from the admin app. Middleware in `src/middleware.ts` redirects every non-public route to `/login` when the cookie is missing. Partners cannot see other partners' data — every page resolves the session partner via `getSessionPartner()` and scopes queries to that partner id.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind with the firmcraft warm design tokens (paper / ink / accent)
- `lucide-react` for icons

## Develop

```bash
cd partner
npm install
npm run dev   # http://localhost:3002
```

Demo credentials (mock):

| Slug          | Token                 |
| ------------- | --------------------- |
| north-ridge   | `demo-northridge`     |
| lattice       | `demo-lattice`        |
| silvercreek   | `demo-silvercreek`    |

## Deploy

Vercel project, separate from the marketing site and the admin app. Set `Root Directory` to `partner` in Vercel project settings.
