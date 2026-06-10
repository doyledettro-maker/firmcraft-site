# Firmcraft Product Roadmap

**Last updated:** June 10, 2026
**Vision:** The AI-powered operating system for trade contractors — one platform that replaces the 5-6 disconnected SaaS tools every contractor pays for today.

**The stack at a glance:** Every module except one is *reactive* — it handles work as it comes in (calls, jobs, invoices, bookings). **Digital Ops is the only *proactive* module: it generates demand.** That makes it the front of the funnel for everything else in the platform.

**The dependency chain (why the phases are ordered this way):** Phone creates jobs → Scheduling manages them → Booking lets customers self-create them → Invoicing closes them out → Digital Ops drives more of them. Each module is unblocked by the one before it. The **office dashboard is not a phase** — it's assembled incrementally, a tab at a time, as each module ships. The **review flywheel** ships early, at the tail of Phase 2, because it only needs to know when a job is done.

📄 **Cross-cutting docs:** [Weekend Buildout Plan](docs/firmcraft-weekend-buildout-plan.md) · [Site Copy Audit](docs/site-copy-vs-hermes-audit.md) · [Brand Strategy Actions](docs/brand-strategy-actions.md) · [Alternative Funding Research](alternative-funding-research.md) · [Houston HVAC Prospects](docs/houston-hvac-prospect-research.md)

📄 **Infrastructure docs:** [Cloudflare Access Setup](cloudflare-access-setup.md) · [Google Workspace Setup](docs/firmcraft-google-workspace-setup.md) · [Resend Mail Setup](docs/resend-firmcraft-mail-setup.md) · [Credentials Template](docs/firmcraft-credentials-template.md)

📄 **Full docs index:** [docs/README.md](docs/README.md)

---

## Current State (Shipped)

### Managed AI Operator — "Flex" (Live, 1 client)
- Hermes Agent deployed on Hetzner VPS per client
- Conversational AI via Telegram, Slack, or SMS
- Contract generation + e-signatures via DocuSeal
- Print bridge — remote printing to client's local printer
- Gmail integration — send COIs, follow-ups, contract emails
- Customer follow-up automation
- Memory + learning — agent improves with every interaction
- LiteLLM gateway for model routing (GPT-5.5, Claude Sonnet 4.6)
- Langfuse observability

### Admin Panel — admin.firmcraft.ai (Live)
- Client/tenant management with status, plan, MRR tracking
- Token usage tracking with progress bars and monthly allowances
- Daily spend view with month navigation
- Outreach CRM — 4,400+ companies across 3 segments (small, midmarket, PE)
- Lead capture — inbound form on firmcraft.ai with email notifications
- Site analytics — page views, referrers, top pages
- Segment filtering (small / midmarket / PE)

### Hermes Desktop App (Configured, testing)
- Remote backend connection to dogfood via agent.firmcraft.ai
- Basic auth via Caddy reverse proxy

---

## Phase 1: AI Phone Answering (Target: July 2026)

📄 **Docs:** [Technical Spec](docs/PHASE1-AI-PHONE-ANSWERING-SPEC.md) · [Decision Log](docs/PHASE1-DECISIONS.md)

**Priority: HIGHEST — single biggest competitive differentiator**

**What it does:** AI answers the contractor's business phone, handles customer requests, books appointments, sends confirmations, creates job records.

**Displaces:** Ruby ($375/mo for 200 min), Smith.ai ($195/mo for 75 calls)

**Technical approach:**
- Integrate Retell.ai or Vapi as a Hermes skill
- Customer calls business number → forwarded to Retell
- Retell handles voice conversation using Hermes as the brain
- AI checks calendar availability, books appointment
- Sends SMS confirmation to customer
- Creates job record in scheduling system (Phase 2)
- Handles common questions (pricing, hours, service area)
- Transfers to owner for complex/emergency calls

**Cost to serve:** ~$0.10-0.25/minute (Retell) = $20-50/mo for typical contractor volume

**MVP scope:**
- Answer calls with professional greeting
- Book appointments against Google Calendar
- Text confirmation to customer
- Transfer to owner on request
- After-hours handling with next-day callback promise

**Success metric:** 3 contractors using voice answering in production

---

## Phase 2: Scheduling + Dispatch (Target: Aug-Sep 2026)

📄 **Docs:** [System Architecture](docs/scheduling-dispatch-architecture.md) · [Build Plan](docs/scheduling-dispatch-build-plan.md) · [Market Research](docs/scheduling-dispatch-market-research.md) · [AI/ML Research](docs/ai-scheduling-dispatch-research.md)

**What it does:** Job board, technician assignment, availability management, customer reminders, real-time status updates.

**Displaces:** Core value of Jobber ($119-599/mo), Housecall Pro ($49-299/mo), ServiceTitan ($1,500-3,500/mo)

**Technical approach:**
- Supabase-backed job/appointment data model
- Hermes skill for job CRUD — create, assign, reschedule, complete
- Technician mobile app (React Native + Expo, offline-first via PowerSync) — build plan Phase 2.4, ships with Phase 2 *(supersedes the earlier text/Telegram tech interface idea)*
- Google Calendar sync for each technician *(post-launch — not required for production-ready; see build plan §7.2)*
- Customer reminders: "Your tech arrives between 2-4pm"
- Dispatcher commands via Hermes: "Assign the 3pm to Dave" or AI auto-assigns based on location + skills
- Drive-time awareness using Google Maps API
- **White-labeled client dashboards on a wildcard subdomain** — each contractor's dispatch board lives at `{slug}.firmcraft.ai` (e.g. `rumblebee.firmcraft.ai`). One Cloudflare wildcard (`*.firmcraft.ai → Vercel`), one Next.js deployment, one database; middleware maps the subdomain to a `tenant_id` and RLS enforces isolation. `admin.firmcraft.ai` stays Firmcraft's *internal* panel; `app.firmcraft.ai` is the generic login that redirects users to their own subdomain. (Architecture: [scheduling-dispatch-architecture.md §1.6](docs/scheduling-dispatch-architecture.md))

**MVP scope:**
- Job creation from phone calls (Phase 1) or manual entry
- Single-day job board view
- Tech assignment (manual via Hermes command)
- Customer appointment reminders (SMS)
- Job completion logging
- White-labeled `{slug}.firmcraft.ai` dashboard per tenant (wildcard DNS + subdomain-routing middleware)

**Growth scope:**
- Multi-day scheduling with drag-and-drop web UI
- Auto-dispatch based on proximity + skill match
- Drive-time optimization
- Recurring maintenance scheduling
- Customer "where's my tech" real-time tracking

**Review flywheel (late-Phase-2 add-on):** Because scheduling is the first module that knows when a job is *done*, the review flywheel ships at the tail end of Phase 2 — job complete → SMS review request → Google review link → AI-drafted response. This was originally scoped under Digital Ops, but it only depends on job-completion events, so it lands here first and feeds the full Digital Ops module (Phase 5) once that's built.

**Success metric:** 5 contractors with active daily job boards

---

## Phase 3: Online Booking Widget (Target: Oct 2026)

**Priority: pulled forward — it's a customer-acquisition tool, and it's unblocked the moment scheduling ships.**

**What it does:** A white-labeled, embeddable booking widget. Customers self-book appointments from the contractor's own website (or a QR code on a yard sign / truck wrap), checking real availability and landing straight in the job board.

**Why before invoicing:** Online booking depends on Phase 2's availability engine, **not** on invoicing. Contractors already have ways to invoice (QuickBooks, paper, manual) — what they *don't* have is a way for customers to book themselves at 11pm without a phone call. Booking grows the top of the funnel; invoicing closes the bottom. We ship demand capture first.

**Displaces:** Jobber's online booking, ServiceTitan's customer-facing scheduling

**Technical approach:**
- Next.js booking app, white-labeled per contractor (subdomain or embed)
- Service selection → availability check (Phase 2 scheduler's availability API) → booking
- Embeddable widget for the contractor's existing website
- QR code for yard signs / truck wraps → booking page
- Booking creates a job record directly in the Phase 2 scheduling system
- SMS confirmation reusing the Phase 1/2 messaging stack

**MVP scope:**
- Service selection + booking page
- Real-time availability check against the scheduler
- SMS confirmation
- Embed code for contractor's website
- QR code generation

**Growth scope (customer self-service portal):**
- Customer login + job history + upcoming appointments
- "Where's my tech" real-time tracking on job day
- Referral program mechanics
- Online payment portal (unlocks once Invoicing ships in Phase 4)

**Success metric:** 5 contractors embedding the booking widget, with at least one self-booked job per contractor per week.

---

## Phase 4: Invoicing + Payments (Target: Nov 2026)

**What it does:** Generate invoices from completed jobs, send payment links, auto-follow-up on unpaid invoices, sync to accounting.

**Why here:** Invoicing still comes after scheduling — it needs completed jobs to invoice against. It moved one slot back so online booking (a growth lever) could ship first; contractors already have stopgap invoicing today, so this closes the loop rather than gating it.

**Displaces:** QuickBooks invoicing ($30-90/mo), manual invoicing

**Technical approach:**
- Stripe invoicing + payment links (already in our stack)
- Hermes generates invoice from job record (service, parts, labor, total)
- Sends to customer via email/SMS with Stripe payment link
- Auto-follow-up sequence: Day 3, Day 7, Day 14 for unpaid
- QuickBooks Online API sync for bookkeeper/accountant
- PDF invoice generation for printing

**MVP scope:**
- Invoice generation from completed job
- Email/SMS delivery with payment link
- Payment confirmation notification to contractor
- Basic AR aging report

**Growth scope:**
- QuickBooks sync
- Recurring invoicing for maintenance contracts
- Estimate → invoice conversion
- Parts and materials markup
- Multi-payment (deposit + final)
- Late payment fees
- Customer-facing payment portal (lights up the Phase 3 self-service portal)

**Success metric:** $50K+ in customer payments processed through the platform

---

## The Office Dashboard (cross-cutting — built incrementally, no longer a standalone phase)

The single pane of glass for the office manager / owner is **no longer a numbered phase**. Instead of waiting for a big-bang "Dashboard" build at the end, each module ships its own dashboard tab into the admin panel as it lands. By the time scheduling, booking, and invoicing are all running, the dashboard already exists — assembled incrementally rather than deferred.

**Tabs accrue alongside the phases that feed them:**
- **Job Board** — today's schedule, unassigned jobs, tech status *(ships with Phase 2)*
- **Call Log** — missed calls, AI-handled calls, transfer requests *(ships with Phase 1)*
- **Booking Activity** — self-booked jobs, widget conversion *(ships with Phase 3)*
- **AR Aging** — unpaid invoices, follow-up queue, total outstanding *(ships with Phase 4)*
- **Unsigned Contracts** — pending signatures, days outstanding *(already live via admin panel)*
- **Tech Utilization** — jobs per tech, completion rates, average ticket *(ships with Phase 2 growth scope)*
- **Customer Pipeline** — estimates sent, close rates, revenue forecast *(ships with Phase 4)*
- **Weekly/Monthly P&L** — revenue, expenses, margin by service type *(ships with Phase 4 / Phase 5)*

**Could be:** Hermes Desktop app with custom views, or the existing admin web app, or both. Either way, it's stitched together tab-by-tab, not built as a separate milestone.

---

## Phase 5: Digital Ops (API application: NOW — Build target: Q1 2027)

📄 **Docs:** [Digital Ops Research](docs/digital-ops-research.md) · [GBP Setup Plan](docs/gbp-setup-plan.md) · [GBP API Checklist](docs/gbp-api-application-checklist.md)

**The only proactive module in the stack — it generates demand instead of reacting to it.**

A fully autonomous AI marketing agent that manages a contractor's entire digital presence on a recurring, "set-and-forget" basis. The contractor answers ~5 questions at setup, connects their accounts, and the agent runs their reviews, social, listings, and campaigns — sending a weekly report and asking for approval only when it matters.

> ⚠️ **CRITICAL PATH BLOCKER — act immediately:** The Google Business Profile API has a **60+ day approval waitlist**. The application must go in *now* (June 2026), well ahead of the build, or it becomes the gating dependency for the whole module. This is the single most time-sensitive item on the roadmap.
>
> 📋 **Full setup plan:** [docs/gbp-setup-plan.md](docs/gbp-setup-plan.md) — phased plan to create & verify the GBP listing (starts the 60-day clock), submit the API application (~Aug 2026), and build the integration (see also [docs/gbp-api-application-checklist.md](docs/gbp-api-application-checklist.md)).

**What it does:**
- **Google Business Profile management** — monitor and respond to reviews, post updates, keep the profile optimized
- **Reputation monitoring** — track reviews across Google, Yelp, BBB, and Angi; alert on sentiment drops; prompt review requests after completed jobs
- **Social media** — generate and queue posts (job photos, seasonal tips, before/after) to keep feeds alive
- **Campaign engine** — proactively propose seasonal campaigns (AC tune-up season, maintenance reminders, holiday promos, referral pushes); contractor approves, agent executes
- **Website health** — monitor uptime, flag broken links, verify contact-info accuracy
- **Competitor awareness** — periodic checks on nearby competitors (new reviews, services, pricing)
- **Email marketing** — past-customer re-engagement, newsletter, seasonal blasts

**Displaces:** NiceJob ($75-125/mo, reviews only), Podium ($399+/mo, annual contract), Birdeye ($299+/mo, annual contract, per-location), Broadly ($249+/mo), Scorpion ($10K-25K/mo agency), plus the marketing add-ons gated behind Jobber (+$79/mo), Housecall Pro, and ServiceTitan ($400-800/mo).

**Key differentiators:**
- **Capacity-aware marketing** — auto-throttle campaigns based on live scheduling data (don't advertise when booked solid). Scorpion charges $10K+/mo for this concept; we deliver it for $149.
- **AI content optimized for Google AI Overviews (GEO/AEO)** — 45% of homeowners now use AI tools to find contractors; 68% of local queries surface an AI Overview.
- **Fully autonomous "set and forget"** with weekly reports — built for non-marketers in the second-least-digitized industry.
- **Closed-loop integration with the rest of the Firmcraft stack** — scheduling (Phase 2), booking (Phase 3), invoicing (Phase 4), and phone (Phase 1) feed marketing decisions and attribution.

**Technical approach (open source first):**
- **Postiz** (31.5k stars) — self-hosted social scheduling, 14+ platforms
- **Lighthouse** (30.2k stars) — programmatic website health scoring
- **GBP MCP server** (`jmdurant/gbp-mcp-server`, 28 tools) — Google Business Profile management
- **Listmonk** (21.3k stars) — self-hosted email engine
- **n8n** (191k stars) — workflow orchestration backbone
- Existing Resend + Twilio stack reused for the review flywheel and campaign delivery
- Content generation via existing LiteLLM gateway

**Pricing:** $149/mo, a la carte. No contracts, transparent pricing — available as an add-on to any Operator Plan or as a standalone product for contractors not yet on Hermes.

**MVP scope:**
- Review flywheel — **already live from Phase 2** (job complete → SMS review request → Google review link → AI-drafted responses); Digital Ops folds it into the unified reputation dashboard and cross-channel reporting
- GBP posting + profile optimization
- Social post generation + scheduling queue
- One seasonal campaign template, contractor-approved
- Capacity-aware marketing throttle (reads Phase 2 scheduling load)
- Weekly report email

**Success metric:** 5 contractors with Digital Ops running autonomously and at least one review-driven booking attributed.

---

## Future Considerations (2027+)

### Platform expansion
- **Fleet/GPS tracking** — vehicle location, mileage, maintenance alerts
- **Inventory/parts management** — track van stock, auto-reorder, parts markup
- **HR/payroll integration** — timesheet tracking, certified payroll for commercial
- **Permit/licensing tracking** — expiration alerts, renewal reminders

### Market expansion
- **Adjacent verticals** — landscaping, pest control, cleaning, auto repair
- **Geographic expansion** — beyond Houston/Vegas to Frontier routes (Tampa, Phoenix, DFW, Orlando)
- **Upmarket** — 40-200 tech commercial contractors (ServiceTitan displacement at scale)

### Technology
- **White-labeled Hermes Desktop** — Firmcraft-branded desktop app for clients
- **Custom domains for client dashboards (Pro-tier upsell)** — a contractor points their own domain (e.g. `app.rumblebeeac.com`) at their dashboard instead of the default `{slug}.firmcraft.ai`. Requires per-client SSL cert provisioning + DNS verification; Vercel supports it but each one is manual setup. Deliberately **out of Phase 2 scope** — the wildcard `{slug}.firmcraft.ai` covers every tenant on day one. A natural Pro-tier differentiator once there's demand. (See [architecture §1.6](docs/scheduling-dispatch-architecture.md).)
- **Multi-language** — Spanish-first (large portion of trade workforce)

---

## Pricing Tiers (Current)

📄 **Docs:** [Billing Spec](docs/billing-spec.md) (Stripe product/price IDs, metering, overage model)

| Tier | Price | Target | What's Included |
|------|-------|--------|-----------------|
| Solo | $399/mo + $1K setup | 1-2 person shops | 1 workflow, 3 integrations, $100 token allowance |
| Team | $799/mo + $2K setup | 3-5 person teams | 8 workflows, unlimited integrations, $200 tokens |
| Pro | $1,499/mo + $3K setup | 6-10 person operations | Unlimited, dedicated lead, priority SLA, custom dashboard domain *(roadmap — see Future Considerations)* |

**Token overages:** Billed 1 month in arrears at 1.2x cost (20% markup)

### A La Carte Modules

Modules can be added to any Operator Plan, or sold standalone for contractors not yet on Hermes. No contracts, transparent pricing.

| Module | Price | Phase | Reactive / Proactive |
|--------|-------|-------|----------------------|
| AI Phone Answering | (bundled in plan) | Phase 1 | Reactive |
| Scheduling + Dispatch | (bundled in plan) | Phase 2 | Reactive |
| Online Booking Widget | (bundled in plan) | Phase 3 | Reactive |
| Invoicing + Payments | (bundled in plan) | Phase 4 | Reactive |
| **Digital Ops** | **$149/mo** | Phase 5 | **Proactive (demand gen)** |

**Full-stack pricing:** A contractor on the **Team plan ($799/mo) + Digital Ops ($149/mo) = $948/mo** for the complete reactive-plus-proactive operating system — still well below a single ServiceTitan seat ($1,500-3,500/mo) before its $400-800/mo marketing add-on. The **Solo plan + Digital Ops = $548/mo**; **Pro plan + Digital Ops = $1,648/mo**.

---

## Competitive Positioning

**The gap we fill:** Between Jobber ($119-599/mo, too basic for real operations) and ServiceTitan ($1,500-3,500/mo, too expensive and complex for sub-40 tech shops). 

**Our edge:** AI-first architecture means the interface IS the intelligence. No complex software to learn — contractors talk to their AI operator like they'd talk to an office manager. Every interaction makes the system smarter.

**Total addressable market:** ~990,000 trade contractor establishments in the U.S. 97%+ have fewer than 50 employees. Average SaaS spend is $500-2,500/mo across fragmented tools.

### Digital marketing competitors (Digital Ops)

The marketing-tool market is even more fragmented and predatory than field-service software — opaque pricing, annual contracts, per-location fees, and renewal "innovation fees" are the norm.

| Competitor | Price | Contract | Weakness we beat |
|------------|-------|----------|------------------|
| NiceJob | $75-125/mo | None | Reviews only — no social, email, or listings |
| Broadly | $249-999/mo | None | Thin feature set, steep pricing |
| Podium | $399-999+/mo | **Annual** | Opaque pricing, contract traps, 1.5★ on Trustpilot |
| Birdeye | $299-449/mo **per location** | **Annual** | Per-location pricing + 8% renewal "innovation fee" |
| ServiceTitan Marketing Pro | +$400-800/mo add-on | With platform | Add-on to a $1,500+/mo platform; slow support |
| Scorpion | $10K-25K/mo | 12-24 month | Clients don't own their websites — total lock-in |

**Our edge in marketing:** AI-native, no contracts, transparent $149/mo flat (no per-location), and — uniquely — **it reads the rest of the operating system.** Because Digital Ops sits on the same stack as scheduling, invoicing, and phone, it can throttle campaigns to capacity, attribute revenue to channels, and trigger review requests off real completed jobs. No standalone marketing vendor can do that; no field-service platform ships it without a costly add-on.

---

## Key Milestones

- [x] First paying client (Rumble Bee, May 2026)
- [x] Admin panel with client/usage tracking
- [x] Outreach CRM with 4,400+ prospects
- [x] Lead capture + site analytics
- [x] Hermes Desktop remote connection
- [ ] **Google Business Profile API application submitted (June 2026 — 60+ day waitlist, critical path for Digital Ops)**
- [ ] First outreach emails sent (June 9, 2026)
- [ ] 5 paying clients
- [ ] AI phone answering in production (July 2026)
- [ ] Scheduling + dispatch in production (Sep 2026)
- [ ] 25 paying clients
- [ ] $10K MRR
- [ ] Online booking widget in production (Oct 2026)
- [ ] Invoicing + payments in production (Nov 2026)
- [ ] $50K MRR
- [ ] Digital Ops in production (Q1 2027)
- [ ] 100 paying clients
