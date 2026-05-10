# Firmcraft Admin

Internal admin dashboard + client onboarding survey. Deployed at `admin.firmcraft.ai`.

## What's here

- `/onboarding` — 10-step client onboarding wizard (Company Profile → Custom Requirements)
- `/` — admin dashboard (client list)
- `/clients/[id]` — client detail (survey responses, subscription, usage)
- `/clients/[id]/settings` — client settings

UI only. Backend wiring (auth, Stripe, LiteLLM, database) is not yet implemented — all data is mocked in `src/lib/mock-clients.ts`.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with the firmcraft warm design tokens (paper / ink / accent)
- `lucide-react` for icons
- Hand-rolled UI primitives in `src/components/ui` (kept simple for now; can be swapped for shadcn/ui later)

## Develop

```bash
cd admin
npm install
npm run dev   # http://localhost:3001
```

## Deploy

Vercel project, separate from the marketing site. Set `Root Directory` to `admin` in Vercel project settings.
