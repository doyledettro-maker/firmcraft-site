# Firmcraft Weekend Buildout Plan

**Related docs:** [ROADMAP.md](../ROADMAP.md) · [Billing Spec](billing-spec.md) · [Site Copy Audit](site-copy-vs-hermes-audit.md) · [Credentials Template](firmcraft-credentials-template.md)

**Goal:** Get Mary @ WorldMax live on Firmcraft by end of next week (May 15, 2026)
**Updated:** May 10, 2026 (v7) — infrastructure build nearly complete

---

## The Big Shift: Hermes Is a Platform, Not Something We Build

The earlier versions of this plan treated Hermes as a custom product we'd need to code from scratch. That was wrong. Hermes Agent (by Nous Research) is a **full-featured, open-source agent platform** with 21 messaging channels, 40+ built-in tools, full MCP support, and 45+ LLM provider integrations. Our job isn't building an agent — it's **configuring and deploying Hermes instances per client**, then layering on our business infrastructure (billing, admin, monitoring, context seeding).

This dramatically simplifies the weekend. Most of what the Infra Build doc specced as custom work is already built into the platform.

---

## What Hermes Agent Ships With (Official Docs)

### 21+ Messaging Channels (Single Gateway)

All channels run through one gateway process. Enable/disable per client via config.

| Channel | Type | Notes |
|---|---|---|
| **Slack** | Team chat | Full Block Kit, threads, reactions, slash commands |
| **Microsoft Teams** | Team chat | Enterprise-ready |
| **Google Chat** | Team chat | Workspace integration |
| **Discord** | Team chat | Server/channel support |
| **Telegram** | Messaging | Bot API with inline keyboards |
| **WhatsApp** | Messaging | Via WhatsApp Business API |
| **Signal** | Messaging | Privacy-focused option |
| **SMS** | Messaging | Inbound + outbound |
| **Email** | Async | Full email as a conversation channel |
| **Matrix** | Federated | Self-hosted chat option |
| **Mattermost** | Self-hosted | On-prem team chat |
| **BlueBubbles** | iMessage | Apple ecosystem bridge |
| **Home Assistant** | IoT | Smart home / office control |
| **DingTalk** | Enterprise | Chinese enterprise market |
| **Feishu / Lark** | Enterprise | ByteDance ecosystem |
| **WeCom** | Enterprise | WeChat Work |
| **Weixin** | Consumer | WeChat |
| **QQ** | Consumer | Tencent messaging |
| **Yuanbao** | Consumer | Tencent AI assistant |
| **Webhooks** | API | Generic HTTP webhook interface |
| **OpenAI-compatible API** | API | Can serve as a drop-in API endpoint |

**For Firmcraft clients:** Default channel varies by client. Teams for Microsoft-heavy orgs (e.g., WorldMax), Slack for startups/tech firms, WhatsApp for trades/field workers, Email for async-heavy workflows. All configurable per client without code changes.

### 40+ Built-in Tools (20+ Toolsets)

| Toolset | Tools | What It Does |
|---|---|---|
| Terminal | 7 backends (Docker, SSH, Modal, Daytona, Vercel, Singularity, local) | Execute commands, scripts, code |
| Browser | 12 tools | Web automation, scraping, form filling |
| File operations | Read, write, edit, search | Full filesystem access |
| Web search/extract | Search + page extraction | Research, data gathering |
| Vision | Screenshot, image analysis | Visual understanding |
| Image generation | Text-to-image | Marketing content creation |
| TTS | Text-to-speech | Audio content |
| Memory | MEMORY.md + USER.md | Persistent context across sessions |
| Skills | Bundled catalog + agent-learned | Reusable capability modules |
| Delegation | Sub-agent spawning | Complex multi-step workflows |
| Cron | Scheduled tasks | Autonomous recurring work |
| Home Assistant | Device control | IoT / smart office |
| RL Training | Reinforcement learning | Self-improvement |

### Full MCP Support (Bidirectional)

- **As MCP client:** Hermes connects TO any MCP server (stdio + HTTP transport). Add servers via config with optional tool filtering. This is how we add QuickBooks, DocuSign, CRM connectors, etc. — write or find an MCP server, point Hermes at it.
- **As MCP server:** Hermes can BE an MCP server, exposing 10 messaging-bridge tools. Other systems can send messages through the operator.

**This is huge for Firmcraft.** Instead of building custom integration code per client, we:
1. Find or build MCP servers for common tools (QuickBooks, Google Workspace, DocuSign, etc.)
2. Add them to the client's Hermes config
3. The operator instantly gains those capabilities

### 45+ LLM Providers

Anthropic (Claude), OpenAI, Google Gemini, AWS Bedrock, OpenRouter, Nous Portal, GitHub Copilot, DeepSeek, xAI, plus any OpenAI-compatible endpoint. Route through LiteLLM for cost tracking and budget control per client. Built-in fallback + credential pools handle provider outages and rate-limit distribution automatically.

### Memory System

- **MEMORY.md** — Bounded, curated long-term memory (business context, client preferences, learned processes)
- **USER.md** — Per-user context and preferences
- **FTS5 session search** — Full-text search across conversation history
- **8 external memory provider plugins** — Extensible storage
- **No built-in vector RAG** — but memory files + 100k+ context window + MCP means you can wire external RAG if needed

### Skills System

Pre-built capability modules the operator can invoke (Hermes ships a bundled catalog plus skills the agent learns from experience; no public count). Custom skills can be created. This maps directly to Firmcraft "playbooks" — each playbook = a skill or skill chain. Skills are portable across the agentskills.io open standard, so clients aren't locked in.

### Cron / Scheduling

The operator can run tasks autonomously on a schedule. Perfect for:
- Daily inbox triage
- Weekly report generation
- Monthly invoice follow-ups
- Scheduled social media posts
- Recurring data pulls from client tools

---

## What We Actually Need to Build

Given Hermes's capabilities, our build list shrinks dramatically:

| Component | Status | What We Do |
|---|---|---|
| **Hermes Agent** | ✅ Exists as platform | Configure per client, not build |
| **Messaging channels** | ✅ 21+ built-in | Enable the right ones per client |
| **Tool integrations** | ✅ 40+ built-in + MCP | Add MCP servers for client-specific tools |
| **LLM routing** | ✅ 45+ providers | Configure via LiteLLM for cost control |
| **Memory/context** | ✅ Built-in MEMORY.md | Seed with discovery call content |
| **Playbooks** | ✅ Skills system | Create custom skills per industry/client |
| **LiteLLM gateway** | ✅ Deployed | Docker Compose on dogfood VPS, routed via Cloudflare tunnel at llm.firmcraft.ai |
| **Langfuse observability** | ✅ Deployed | Docker Compose on dogfood VPS, routed via Cloudflare tunnel at langfuse.firmcraft.ai |
| **Marketing site** | ✅ Live | firmcraft.ai on Vercel, terracotta/cream brand, /get-started onboarding survey |
| **Admin dashboard** | ✅ Built | admin.firmcraft.ai on Vercel, dark mode theme, client/partner management, commission tracking |
| **Partner portal** | ✅ Built | partners.firmcraft.ai on Vercel, green/money theme, Clerk auth (production instance live) |
| **Stripe billing** | ✅ Wired | Predictium LLC Stripe, 3 tiers + setup fees, metered token overages at 1.2x markup |
| **Support fallback** | ✅ Built | /support page on firmcraft.ai |
| **Health monitoring** | ✅ Running | Cron every 5 min on dogfood VPS, transition-based email alerts via Resend |
| **Onboarding survey** | ✅ Built | Conversational chat form + markdown upload path, autosave with server-side persistence, clickable progress bar |
| **Survey email notifications** | ✅ Wired | Both marketing + partner survey submissions email doyle.dettro@emergenext.com via Resend |
| **Auth — Admin** | ✅ Configured | Cloudflare Access at network edge, 24h sessions, email whitelist |
| **Auth — Partner portal** | ✅ Configured | Clerk production instance, DNS verified, SSL issuing, role-based access via publicMetadata.partnerSlug |
| **Context seeding pipeline** | 🔨 Build | Discovery call → config files (manual for WorldMax v1, automate for clients 2+) |
| **WorldMax tenant deployment** | ⏳ Waiting | On hold until Mary returns from conference |
| **Dashboard white-label** | 🔨 Build | Theme YAML + slot plugin for Hermes dashboard (do after WorldMax instance is running) |
| **MCP servers for niche tools** | 🔨 Build as needed | QuickBooks, DocuSign, industry-specific |
| **Resend domain verification** | ⏳ Pending | Emails come from notifications@skillcalibrate.com; adding firmcraft.ai requires paid Resend plan |
| **Clerk Google SSO (production)** | ⏳ Pending | Needs custom Google OAuth credentials for production (Clerk's shared dev creds don't carry over) |

---

## Context Seeding: How New Clients Get a Smart Operator on Day One

### A. Discovery Call Recording → Context Extraction

1. Doyle conducts 20-30 min discovery call with new client
2. Recording uploaded or auto-synced from Zoom
3. Automated pipeline: transcribe (Whisper/Deepgram) → extract via Claude → structured output:
   - Business type, size, industry, locations
   - Team members (names, roles, responsibilities, communication preferences)
   - Current tools (CRM, accounting, scheduling, etc.)
   - Pain points and target workflows
   - Client vocabulary and jargon
   - Processes the operator should NOT change
   - Approval requirements (what needs human sign-off)
4. Output generates:
   - `MEMORY.md` — seeded with business context, processes, client relationships
   - `USER.md` per team member — role, preferences, permissions
   - Channel config — which messaging platform(s) to enable
   - MCP server list — which integrations to wire up
   - Custom skills — initial playbooks for their specific workflows

### B. Digital Onboarding Survey

Pre-call or post-call questionnaire (custom-built into admin dashboard at `admin.firmcraft.ai`):

1. **Your Business** — Company, industry, team size, locations
2. **Your Team** — Who uses the operator? Names, roles, handles
3. **Your Tools** — Checklist: Google Workspace, QuickBooks, Xero, Salesforce, HubSpot, DocuSign, Calendly, Slack, Teams, etc.
4. **Your Workflows** — Top 5 tasks to automate, ranked
5. **Your Preferences** — Communication style, response time, working hours, approval rules
6. **Your Docs** — Upload org chart, process docs, pricing sheets, brand guidelines
7. **Sensitive Areas** — What the operator should never do without explicit approval

### C. Context Loading

```
Discovery call + Survey + Uploaded docs
        ↓ (Claude extraction)
├── MEMORY.md (business context, processes, relationships)
├── USER.md per team member (role, prefs, permissions)  
├── hermes.yaml (channels, LLM routing, integrations)
├── Custom skills (industry-specific playbooks)
└── /data/knowledge/ (reference docs)
```

For WorldMax (v1): do this manually from the discovery call. For clients 2+: automate the pipeline.

---

## Infrastructure (Current State as of May 10, 2026)

| Asset | Status | Details |
|---|---|---|
| **Hetzner account** | ✅ Active | Flex Pattern project, dogfood VPS (5.78.117.234) + worldmax VPS provisioned |
| **Hetzner dogfood VPS** | ✅ Running | 5.78.117.234 — Hermes (:9119), LiteLLM, Langfuse, health monitor cron, autosave receiver, all via Cloudflare tunnel |
| **Cloudflare** | ✅ Active | firmcraft.ai zone: marketing site, admin, partners, clerk (5 records), llm, langfuse, autosave subdomains. Cloudflare Access on admin.firmcraft.ai |
| **GitHub** | ✅ Authenticated | `doyledettro-maker` org, `gh` CLI on Mac mini, firmcraft-site repo |
| **Vercel** | ✅ 3 projects | `firmcraft-site` (marketing), `firmcraft-admin` (admin dashboard), `firmcraft-partner` (partner portal) |
| **firmcraft.ai** | ✅ Live | Marketing site with /get-started onboarding, /support page |
| **admin.firmcraft.ai** | ✅ Live | Dark mode admin dashboard, Cloudflare Access protected |
| **partners.firmcraft.ai** | ✅ Live | Green-themed partner portal, Clerk production auth |
| **Stripe** | ✅ Configured | Predictium LLC, 3 product tiers, metered billing for token overages |
| **Clerk** | ✅ Production | App: Firmcraft (app_3DY9Fl1NXuQXjoREc8RbOp8INgE), prod instance live, DNS verified, SSL issuing |
| **Resend** | ✅ Active | Survey notifications + health alerts, from notifications@skillcalibrate.com (free plan) |
| **Design specs** | ✅ 4 .docx files | Architecture, ops, sprint template, marketing plan |

### Multi-App Architecture

One git repo (`firmcraft-site`) with three Next.js apps deployed as separate Vercel projects:

| App | Directory | Domain | Theme | Auth | Port (dev) |
|---|---|---|---|---|---|
| Marketing | `/` (root) | firmcraft.ai | Terracotta/cream | None (public) | 3000 |
| Admin | `admin/` | admin.firmcraft.ai | Dark mode, terracotta accent | Cloudflare Access (email whitelist) | 3001 |
| Partner | `partner/` | partners.firmcraft.ai | Light, sage green (#6B8E5A) accent, money green (#2F4A22) for financial | Clerk (publicMetadata.partnerSlug) | 3002 |

**Internal vs. client-facing — the key distinction (Phase 2 onward):** `admin.firmcraft.ai` is **Firmcraft's own internal back office** (our staff: tenant/client management, MRR, usage, outreach CRM). It is never a customer surface. The **contractor-facing** product — the dispatch board, job management, scheduling — is white-labeled per tenant at **`{slug}.firmcraft.ai`** (e.g. `rumblebee.firmcraft.ai`), served by the *same* admin deployment via a Cloudflare wildcard (`*.firmcraft.ai → Vercel`) and Next.js subdomain middleware that resolves `{slug}` → `tenant_id` (RLS enforces isolation). `app.firmcraft.ai` is a generic login that redirects each user to their own subdomain. Custom client domains (e.g. `app.rumblebeeac.com`) are a future Pro-tier upsell, out of Phase 2 scope. Full design: [scheduling-dispatch-architecture.md §1.6](scheduling-dispatch-architecture.md).

### Partner/Reseller Model

Not all clients have partners — some are direct sales. Partners get 30% commission as long as they remain the assigned partner (no sunset):

- **Non-token revenue:** (subscription_price - token_inclusion_amount) × 0.30
- **Token inclusion margin:** (inclusion_amount - actual_cost) × 0.30
- **Overage margin:** overage_charge × (0.2/1.2) × 0.30
- Example Spark ($399/mo, $100 token inclusion): $299 × 0.3 = $89.70 non-token + margin-based token commission

Partner access: read-only client view (no box access), commission breakdown, submit onboarding surveys (flows to admin for review/provisioning). Partners CANNOT modify client boxes, access client technical settings, or see other partners' data.

Commission utility: `admin/src/lib/commissions.ts` — `calculateCommission({planTier, tokenCost, tokenOverageCharge, rate?})`

### Credentials

All credentials stored in [`firmcraft-credentials.md`](../firmcraft-credentials.md) (gitignored, repo root). Includes: Stripe keys + product/price IDs, LiteLLM master key, Langfuse keys, Clerk dev + production keys, Cloudflare API token, Vercel project IDs, Resend API key.

---

## Workstream Status (as of May 10, 2026)

### Workstream 1: LiteLLM + Langfuse Central Services ✅ COMPLETE

Deployed on dogfood VPS (5.78.117.234) via Docker Compose, routed through Cloudflare tunnel:
- LiteLLM at llm.firmcraft.ai — master API key created, model tiers configured:
  - `firmcraft-fast` → Claude Haiku 4.5
  - `firmcraft-standard` → Claude Sonnet 4.6
  - `firmcraft-deep` → Claude Opus 4.7
- Langfuse at langfuse.firmcraft.ai — observability and cost tracking
- Hermes instance at firmcraft.firmcraft.ai (:9119) — Doyle's dogfood instance

### Workstream 2: WorldMax Hermes Instance ⏳ WAITING

WorldMax VPS provisioned on Hetzner but Hermes deployment deferred until Mary returns from conference. Remaining steps:
1. Deploy Hermes Agent on WorldMax VPS
2. Configure Microsoft Teams channel (primary — Mary's team is heavy Microsoft)
3. Configure LLM routing through LiteLLM with WorldMax virtual key + budget cap
4. Wire Langfuse for observability
5. Enable built-in tools: file ops, web search, browser, cron
6. Add MCP servers for WorldMax tools (Office 365, Outlook, SharePoint, OneDrive baseline; specifics from discovery call)
7. Seed MEMORY.md with WorldMax business context from onboarding survey
8. Configure USER.md for Mary
9. Create initial custom skills (playbooks) for WorldMax workflows

### Workstream 3: Admin Dashboard + Onboarding Survey ✅ COMPLETE

**Admin dashboard** (`admin/`) deployed at admin.firmcraft.ai:
- Dark mode theme (charcoal backgrounds, cream text, terracotta accent) to distinguish from public marketing pages
- Client list with status (active/onboarding/paused)
- Partner column on clients ("Direct" when no partner assigned)
- Per-client detail views
- Partners section: list + detail views with per-client commission breakdown
- Submissions queue: shows partner-submitted surveys with `via {partner}` badge
- Protected by Cloudflare Access (edge-level auth, 24h sessions, email whitelist for doyle.dettro@emergenext.com + skillcalibrate emails)

**Onboarding survey** on marketing site (`/get-started`):
- Two intake paths: conversational chat form (30 questions over 10 sections) OR markdown template upload (download .md, fill in, drag-and-drop upload)
- Shared ReviewAndSubmit screen with editable answers
- **Autosave** (added May 10): every answer persists server-side immediately via debounced POST to autosave receiver on dogfood VPS. Session ID in sessionStorage for resume. `sendBeacon` on tab close catches final diff. Defense in depth: localStorage mirror preserved as fallback.
- **Clickable progress bar**: 10 section segments (marketing) / 4 segments (partner portal), users can jump between sections freely
- Subtle save indicator: `· Saving…` → `✓ Saved` (fades after 2.4s) → `↻ Retrying save…` on error
- Final submission sends formatted HTML email to doyle.dettro@emergenext.com via Resend (notification layer — data already safely persisted)

**Autosave infrastructure:**
- Receiver: `infra/autosave-receiver/server.mjs` — stdlib-only Node, atomic writes, per-session serialization, bearer token auth, `sendBeacon`-tolerant
- Storage: `/var/lib/firmcraft-autosave/sessions/{marketing,partner}/<sessionId>.json` on dogfood VPS
- Systemd service: `firmcraft-autosave.service` on dogfood VPS, listening on localhost:9091
- Route: autosave.firmcraft.ai via Cloudflare tunnel (⏳ tunnel hostname mapping pending — receiver running and tested locally)
- Vercel env vars: `FIRMCRAFT_AUTOSAVE_URL` + `FIRMCRAFT_AUTOSAVE_TOKEN` set on both `firmcraft-site` and `firmcraft-partner` projects (all scopes)

### Workstream 4: Stripe Billing ✅ COMPLETE

Stripe configured under Predictium LLC (live mode):
- Three Products + monthly Prices: Spark $399, Flow $799, Forge $1,499
- Three one-time setup Prices: $1,000 / $2,000 / $3,500
- Token bundles included per tier: Spark $100, Flow $200, Forge $300/mo
- Metered billing for overages: event name `firmcraft_ai_overage_cents`, 1.2x markup on actual cost
- Product/price IDs and keys stored in [`firmcraft-credentials.md`](../firmcraft-credentials.md)
- Integrations wired in 40pfrom3 + SkillCalibrate repos

### Workstream 5: Support Fallback + Health Monitoring ✅ COMPLETE

**A. Support page** — `/support` on firmcraft.ai, live.

**B. Health monitor** — deployed on dogfood VPS:
- Script: `infra/health-monitor/check-and-alert.mjs`
- Cron: `*/5 * * * *` via crontab, logging to `cron.log`
- State-based alerting via `state.json` (only emails on status transitions, not every check)
- Email alerts via Resend to doyle.dettro@emergenext.com
- Verified: `overall=up up=5` on live run

**C. Survey email notifications** — both marketing and partner survey endpoints send formatted-by-section HTML emails via Resend on final submission. From-address: `notifications@skillcalibrate.com` (only verified domain on free Resend plan; override via `RESEND_FROM` env var when firmcraft.ai domain is verified).

### Workstream 6: Partner/Reseller System ✅ COMPLETE (NEW — not in original plan)

Built as a full workstream beyond the original plan scope:

**Partner data model** (in admin dashboard):
- Clients optionally have `partner_id`
- Commission calculation: `admin/src/lib/commissions.ts` — three-stream math (non-token rev, inclusion margin, overage margin)
- Admin views: partner list, partner detail with per-client commission breakdown, monthly totals

**Partner portal** (`partner/`) at partners.firmcraft.ai:
- Separate Next.js app with green/money theme
- Tailwind config: `--accent: #6B8E5A`, `--accent-2: #3D5A2C`, `--money: #2F4A22`, `--money-soft: #E5EFDC`
- Pages: overview, clients (read-only), commissions breakdown, submit-client survey (with autosave + progress bar)
- Auth: Clerk production instance
  - App ID: `app_3DY9Fl1NXuQXjoREc8RbOp8INgE`
  - Production instance: `ins_3DYKUTugFKREDNDzrL3wwszilrA`
  - Frontend API: clerk.firmcraft.ai
  - Domain: partners.firmcraft.ai
  - Session → partner mapping via `publicMetadata.partnerSlug` with email match fallback
  - DNS: 5 CNAME records verified in Cloudflare (clerk, accounts, clkmail, 2x DKIM)
  - SSL: issuing (auto-completes within minutes to hours)
  - Production keys in Vercel env vars (pk_live_*, sk_live_*)
- Vercel project: `firmcraft-partner` (prj_Mv6XGJI8bjf6eLMMwkeCmcLU1j9a), root directory `partner/`

### Workstream 7: Context Seeding for WorldMax ⏳ WAITING

Discovery call not yet scheduled — Mary at conference. Infrastructure ready to receive her:
1. Onboarding survey at firmcraft.ai/get-started is live with autosave
2. Partner can also submit on her behalf via partner portal
3. Once survey data is in, extract context via Claude → generate MEMORY.md, USER.md, initial skills
4. Load into WorldMax Hermes instance

### Workstream 8: Firmcraft Playbook Library 🔨 ONGOING

No playbooks built yet. Priority order:
- **B2B/Resellers (WorldMax):** Lead intake, partner communications, order tracking, commission tracking
- **Trades:** Job scheduling, estimate follow-up, invoice generation, permit tracking
- **Dental/Healthcare:** Appointment reminders, insurance verification, patient follow-up
- **Legal:** Document intake, deadline tracking, client communication
- **Accounting:** Receipt processing, expense categorization, quarterly prep

Each playbook = a Hermes skill file. Build WorldMax-specific ones first, generalize later.

### Workstream 9: Firmcraft Dashboard White-Label 🔨 NOT STARTED

Do this AFTER the WorldMax instance is running — reskin a working dashboard, not a hypothetical one.

**Architecture:** Theme YAML + slot-only plugin. No Hermes fork — stays on upstream updates.

1. Create `theme/firmcraft.yaml` — warm palette (cream #FBF4EA, terracotta #D97757, sage #6B8E5A, slate #3F7A8C), Source Serif 4 display font, Geist body/mono
2. Create slot plugin — header-left brand swap, footer-right credit, favicon replacement, hide "Update" button
3. Use MutationObserver (not CSS class selectors) for hiding hardcoded brand strings — more resilient to upstream updates
4. Force light mode initially (dark variant is Phase 2)
5. Deploy to `~/.hermes/themes/` and `~/.hermes/plugins/` on WorldMax instance
6. Verify: favicon, page title, header logo, sidebar accent colors, login screen, footer text

---

## SkillCalibrate Pivot: General-Purpose LMS SaaS

**Decision (May 13, 2026):** SkillCalibrate is no longer just the Firmcraft training platform. It becomes a general-purpose LMS SaaS product targeting the 50–500 employee market segment, with Firmcraft as a subtenant (same architecture as WorldMax).

### Strategic Context
- Multi-tenancy is already built: `tenantId` on all tables, host-based routing, white-label per tenant
- Firmcraft subtenant = DB row + DNS CNAME (identical to WorldMax setup)
- Primary displacement target: LearnWorlds ($99–$299/mo pricing cliff, complex UI, missing bulk management + HRIS integrations)
- Market gap: companies between creator platforms (Teachable/Thinkific) and enterprise LMS (Cornerstone/Docebo) are underserved
- See full research: `docs/SkillCalibrate_LMS_Market_Research_Report.docx`

### Pricing Strategy (from research)
- **Starter:** $49/mo (50 users, 10GB) — undercut LearnWorlds $99 entry
- **Professional:** $149/mo (250 users, 50GB, SCORM, API) — match LearnWorlds mid-tier value at half price
- **Business:** $349/mo (unlimited users, SSO, HRIS, white-label) — displace LearnWorlds $299 with more features
- **Enterprise:** Custom — compliance, dedicated infra, SLA

### Key Differentiators vs. LearnWorlds
1. Transparent pricing (no per-learner surprises)
2. Built-in HRIS integrations (BambooHR, Gusto, Rippling)
3. Bulk user management from day one
4. AI-powered content assistance (Firmcraft's AI layer)
5. Modern, clean UI (not the LearnWorlds complexity maze)

### Next Steps
1. Rethink SkillCalibrate marketing site for general-purpose LMS positioning
2. Add Firmcraft subtenant (DB row + CNAME)
3. Build LearnWorlds migration toolkit (SCORM import, user CSV mapping)
4. Content overhaul: landing pages, feature comparison, use cases

---

## Remaining Work (Priority Order)

### Immediate (before WorldMax can go live)
1. **Cloudflare tunnel hostname for autosave** — add `autosave.firmcraft.ai → localhost:9091` to tunnel config (requires Cloudflare API token with tunnel edit permission, or manual dashboard add)
2. **Clerk SSL completion** — auto-completing, no action needed, just verify
3. **WorldMax Hermes deployment** — blocked on Mary's return from conference
4. **Context seeding** — discovery call with Mary → generate MEMORY.md, USER.md, skills
5. **Dashboard white-label** — after Hermes is running on WorldMax VPS

### Nice-to-have (not blocking launch)
6. **Resend domain verification** — add firmcraft.ai as verified sender (requires paid Resend plan) so emails come from @firmcraft.ai instead of @skillcalibrate.com
7. **Clerk Google SSO for production** — custom Google OAuth credentials needed (Clerk's shared dev creds don't carry over). Partners can use email auth in the meantime
8. **Playbook library** — build WorldMax-specific playbooks, then generalize

### Technical debt noted
- Root `tsconfig.json` needs both `admin` and `partner` in `exclude` array for `next build` at repo root to work
- Partner portal prerender requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` at build time (Vercel handles this, but local builds need `.env.local`)
- Vercel deploy from `partner/` directory doubles the path due to Root Directory setting — must deploy from repo root with `VERCEL_PROJECT_ID` injected (same for `admin/`)
- Resend on free plan — only `skillcalibrate.com` verified as sender domain

---

## Decisions (All Resolved)

1. ~~Pricing:~~ ✅ DONE — $399/$799/$1,499 with tiered setup fees ($1,000/$2,000/$3,500)
2. ~~Flat rate:~~ ✅ DONE — Each tier includes $100/$200/$300 of tokens respectively. Overages billed at 1.2x actual cost, metered via `firmcraft_ai_overage_cents` Stripe event
3. ~~VPS layout:~~ ✅ DONE — Dogfood VPS runs central services (LiteLLM, Langfuse, health monitor, autosave) + Doyle's Hermes instance. Separate VPS per client.
4. ~~Domain convention:~~ ✅ DONE — Subdomains under firmcraft.ai: llm, langfuse, admin, partners, clerk, autosave, firmcraft (Hermes)
5. ~~Stripe entity:~~ ✅ DONE — Predictium LLC live Stripe account
6. ~~WorldMax channel:~~ ✅ DECIDED — Microsoft Teams (not Slack). Mary's team is heavy Microsoft.
7. ~~WorldMax tools:~~ ✅ DECIDED — Heavy Microsoft stack assumed. Specifics TBD from discovery call + onboarding survey.
8. ~~Discovery call:~~ ⏳ WAITING — Mary at conference. Build infrastructure first.
9. ~~Admin dashboard URL:~~ ✅ DONE — admin.firmcraft.ai, live with dark mode theme, Cloudflare Access
10. ~~Survey tool:~~ ✅ DONE — Custom onboarding survey at firmcraft.ai/get-started with autosave + progress bar. Partner portal can also submit surveys.
11. ~~Admin auth:~~ ✅ DONE — Cloudflare Access at network edge (defense in depth, separate from app auth)
12. ~~Partner auth:~~ ✅ DONE — Clerk (separate app from SkillCalibrate LMS), production instance deployed
13. ~~Partner commission:~~ ✅ DONE — 30% of non-token revenue + 30% of token margin. No sunset.
14. ~~Survey persistence:~~ ✅ DONE — Server-side autosave to JSON files on VPS, email as notification layer only
15. ~~Partner visual identity:~~ ✅ DONE — Green theme for money/partner context, distinct from terracotta marketing and dark admin

---

## Source Documents

### Architecture & Ops (in `/source/SkillCalibrate/docs/`)
- `Firmcraft_Infrastructure_Build.docx` — 3-layer architecture, Docker Compose configs, cost model (83-92% margins)
- `Firmcraft_Operations_Manual.docx` — Ops runbook for 30+ instances, monitoring, incident response
- `US_Transactions_Implementation_Plan.docx` — 14-day sprint template, 18 test cases
- `Firmcraft_Regional_Marketing_Plan.docx` — Expansion playbook, rev-share model

### LMS & WorldMax
- `PILOT-LAUNCH-WORLDMAX.md` — WorldMax as first external tenant
- `ROADMAP.md` — LMS roadmap (Phases 1-3A done, Phase 4 = Stripe)
- `MULTI_CURRENCY_PRICING.md` — Stripe price objects per locale
- `SkillCalibrate_LMS_Market_Research_Report.docx` — LMS competitive landscape, LearnWorlds displacement strategy, pricing/positioning for general-purpose LMS pivot (May 2026)

### Marketing & Positioning
- `marketing/FIRMCRAFT-US-TRANSACTIONS-ONE-PAGER.md` — Flow tier pitch
- `marketing/03-PARTNER-PROGRAM.md` — Regional partner rev-share model
- `HERMES-MARKETING-HANDOFF.md` — Go-to-market context

### Hermes Agent Platform
- Official docs: https://hermes-agent.nousresearch.com/docs
- GitHub: Open-source, MIT licensed, 110k+ stars
