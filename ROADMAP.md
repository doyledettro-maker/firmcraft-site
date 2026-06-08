# Firmcraft Product Roadmap

**Last updated:** June 8, 2026
**Vision:** The AI-powered operating system for trade contractors — one platform that replaces the 5-6 disconnected SaaS tools every contractor pays for today.

**The stack at a glance:** Every module except one is *reactive* — it handles work as it comes in (calls, jobs, invoices, bookings). **Digital Ops is the only *proactive* module: it generates demand.** That makes it the front of the funnel for everything else in the platform.

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

**What it does:** Job board, technician assignment, availability management, customer reminders, real-time status updates.

**Displaces:** Core value of Jobber ($119-599/mo), Housecall Pro ($49-299/mo), ServiceTitan ($1,500-3,500/mo)

**Technical approach:**
- Supabase-backed job/appointment data model
- Google Calendar sync for each technician
- Hermes skill for job CRUD — create, assign, reschedule, complete
- Technician interface via text/Telegram: "Here are your jobs today"
- Customer reminders: "Your tech arrives between 2-4pm"
- Dispatcher commands via Hermes: "Assign the 3pm to Dave" or AI auto-assigns based on location + skills
- Drive-time awareness using Google Maps API

**MVP scope:**
- Job creation from phone calls (Phase 1) or manual entry
- Single-day job board view
- Tech assignment (manual via Hermes command)
- Customer appointment reminders (SMS)
- Job completion logging

**Growth scope:**
- Multi-day scheduling with drag-and-drop web UI
- Auto-dispatch based on proximity + skill match
- Drive-time optimization
- Recurring maintenance scheduling
- Customer "where's my tech" real-time tracking

**Success metric:** 5 contractors with active daily job boards

---

## Phase 3: Invoicing + Payments (Target: Oct 2026)

**What it does:** Generate invoices from completed jobs, send payment links, auto-follow-up on unpaid invoices, sync to accounting.

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

**Success metric:** $50K+ in customer payments processed through the platform

---

## Phase 4: Customer Portal + Online Booking (Target: Nov 2026)

**What it does:** White-labeled booking page per contractor. Customer self-service for scheduling, payment, and job tracking.

**Displaces:** Jobber's online booking, ServiceTitan's customer-facing features

**Technical approach:**
- Next.js booking app, white-labeled per contractor (subdomain or embed)
- Service selection → availability check (Phase 2 scheduler) → booking
- Customer account with job history, invoices, upcoming appointments
- "Where's my tech" real-time tracking on job day
- Embeddable widget for contractor's existing website
- QR code for yard signs / truck wraps → booking page

**MVP scope:**
- Service selection + booking page
- SMS confirmation
- Embed code for contractor's website

**Growth scope:**
- Customer login + job history
- Online payment portal
- Real-time tech tracking
- Review request after job completion
- Referral program mechanics

---

## Phase 5: Office Dashboard (Target: Dec 2026 - Q1 2027)

**What it does:** The single pane of glass for the office manager / owner. Everything from Phases 1-4 in one view.

**Could be:** Hermes Desktop app with custom views, or dedicated web app, or both

**Views:**
- **Job Board** — today's schedule, unassigned jobs, tech status
- **AR Aging** — unpaid invoices, follow-up queue, total outstanding
- **Unsigned Contracts** — pending signatures, days outstanding
- **Call Log** — missed calls, AI-handled calls, transfer requests
- **Tech Utilization** — jobs per tech, completion rates, average ticket
- **Customer Pipeline** — estimates sent, close rates, revenue forecast
- **Weekly/Monthly P&L** — revenue, expenses, margin by service type

---

## Phase 6: Digital Ops (API application: NOW — Build target: Q1 2027)

**The only proactive module in the stack — it generates demand instead of reacting to it.**

A fully autonomous AI marketing agent that manages a contractor's entire digital presence on a recurring, "set-and-forget" basis. The contractor answers ~5 questions at setup, connects their accounts, and the agent runs their reviews, social, listings, and campaigns — sending a weekly report and asking for approval only when it matters.

> ⚠️ **CRITICAL PATH BLOCKER — act immediately:** The Google Business Profile API has a **60+ day approval waitlist**. The application must go in *now* (June 2026), well ahead of the build, or it becomes the gating dependency for the whole module. This is the single most time-sensitive item on the roadmap.

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
- **Closed-loop integration with the rest of the Firmcraft stack** — scheduling (Phase 2), invoicing (Phase 3), and phone (Phase 1) feed marketing decisions and attribution.

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
- Review flywheel: job complete → SMS review request → Google review link → AI-drafted responses
- GBP posting + profile optimization
- Social post generation + scheduling queue
- One seasonal campaign template, contractor-approved
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
- **Mobile app** — native iOS/Android for technicians
- **Offline mode** — job details cached for areas with poor connectivity
- **Multi-language** — Spanish-first (large portion of trade workforce)

---

## Pricing Tiers (Current)

| Tier | Price | Target | What's Included |
|------|-------|--------|-----------------|
| Solo | $399/mo + $1K setup | 1-2 person shops | 1 workflow, 3 integrations, $100 token allowance |
| Team | $799/mo + $2K setup | 3-5 person teams | 8 workflows, unlimited integrations, $200 tokens |
| Pro | $1,499/mo + $3K setup | 6-10 person operations | Unlimited, dedicated lead, priority SLA |

**Token overages:** Billed 1 month in arrears at 1.2x cost (20% markup)

### A La Carte Modules

Modules can be added to any Operator Plan, or sold standalone for contractors not yet on Hermes. No contracts, transparent pricing.

| Module | Price | Phase | Reactive / Proactive |
|--------|-------|-------|----------------------|
| AI Phone Answering | (bundled in plan) | Phase 1 | Reactive |
| Scheduling + Dispatch | (bundled in plan) | Phase 2 | Reactive |
| Invoicing + Payments | (bundled in plan) | Phase 3 | Reactive |
| Customer Portal + Online Booking | (bundled in plan) | Phase 4 | Reactive |
| **Digital Ops** | **$149/mo** | Phase 6 | **Proactive (demand gen)** |

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
- [ ] Invoicing + payments in production (Oct 2026)
- [ ] Customer portal in production (Nov 2026)
- [ ] $50K MRR
- [ ] Digital Ops in production (Q1 2027)
- [ ] 100 paying clients
