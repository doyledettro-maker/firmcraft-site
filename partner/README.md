# Firmcraft Partners

Partner / reseller portal. Deployed at `partners.firmcraft.ai`.

## What's here

- `/login` — partner sign-in (Clerk SignIn component, catch-all route)
- `/` — overview (clients, commission this month, plan mix)
- `/clients` — read-only list of the partner's referred clients
- `/commissions` — per-client commission breakdown for the current month
- `/submit` — onboarding survey for new client referrals (flows into admin Submissions queue)

UI is wired up; client / commission data is still mocked in `src/lib/mock-partners.ts` (shared shape with the admin app).

## Auth boundary

The portal lives on its own subdomain (`partners.firmcraft.ai`) and uses Clerk for authentication, with a Clerk application that is separate from the admin app's auth (the admin app is gated by Cloudflare Access instead). `src/middleware.ts` uses `clerkMiddleware` and protects every route except `/login` and `/sign-in`.

Each Clerk user is mapped to a Firmcraft partner record via `publicMetadata.partnerSlug` (set in the Clerk dashboard, or eventually from the admin app). `getSessionPartner()` in `src/lib/session.ts` resolves the current user → partner; in the demo it also falls back to matching by email, then to the first mock partner so the demo book of business still renders for unmapped users.

## Stack

- Next.js 14 (App Router) + TypeScript
- `@clerk/nextjs` v6 for auth
- Tailwind with the firmcraft warm design tokens (paper / ink / accent)
- `lucide-react` for icons

## Develop

```bash
cd partner
npm install
npm run dev   # http://localhost:3002
```

Pull Clerk keys into `.env.local` (the file is gitignored):

```bash
clerk env pull --file partner/.env.local
```

The required env vars are:

| Var                                  | Purpose                                  |
| ------------------------------------ | ---------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Client-side Clerk init                   |
| `CLERK_SECRET_KEY`                    | Server-side Clerk Backend API access     |

## Deploy

Vercel project, separate from the marketing site and the admin app. Set `Root Directory` to `partner` in Vercel project settings. Add the two Clerk env vars (dev keys for the dev instance, prod keys for production) under Project → Settings → Environment Variables.
