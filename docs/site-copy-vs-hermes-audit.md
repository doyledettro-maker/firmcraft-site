# Site Copy vs. Hermes Capabilities — Audit

**Related docs:** [Weekend Buildout Plan](firmcraft-weekend-buildout-plan.md) · [ROADMAP.md](../ROADMAP.md) · [Brand Strategy Actions](brand-strategy-actions.md)

**Generated:** 2026-05-09
**Sources reviewed:**
- Site: `src/app/page.tsx`, `src/app/capabilities/page.tsx`, `src/app/integrations/page.tsx`, `src/app/playbooks/page.tsx`, `src/app/security/page.tsx`
- Internal: [`firmcraft-weekend-buildout-plan.md`](firmcraft-weekend-buildout-plan.md) (v6, 2026-05-08)
- Hermes (live as of 2026-05-09):
  - `hermes-agent.nousresearch.com/docs/user-guide/messaging/` (21 platforms)
  - `hermes-agent.nousresearch.com/docs/user-guide/features/overview` (full feature inventory)
  - `hermes-agent.nousresearch.com/docs/user-guide/features/mcp` (client + server)
  - `hermes-agent.nousresearch.com/docs/integrations/providers` (45+ providers)
  - `github.com/NousResearch/hermes-agent` (README; MIT; 140k★; 40+ tools)

**Scope:** Verify whether site copy claims hold up against the Hermes Agent platform we'll actually be configuring per client. Flag oversells, undersells, missing differentiators, and number accuracy.

---

## TL;DR

- **The site is mostly directionally accurate.** Firmcraft is positioned as "managed operator" and Hermes does provide all the underlying primitives (multi-channel, cron, events, memory, approvals, audit-able logging, MCP-based integrations).
- **One real oversell risk:** the `/integrations` page presents "**Native: 112** — Live, supported, documented integrations." Hermes ships first-class direct integrations for ~21 messaging platforms plus a handful of toolset-level tools. Most of the 112 are reachable via MCP servers (open ecosystem, third-party-maintained), browser automation, or custom-built connectors. The "browser-driven" badge is in the right direction but applied too narrowly. Reframe **Native → Catalog**.
- **Two unverified bullets on `/capabilities` CAP 02:** "Pause / skip per holiday" and "Auto-reschedule on conflict" are not documented Hermes features. Pause/resume/edit on jobs IS — swap to that.
- **Several Hermes capabilities are missing from the site that would meaningfully sharpen the pitch:** voice mode (in/out), vision, image generation, TTS, **checkpoints + /rollback** (the literal mechanism behind "reversible by default"), **multi-provider failover** (reliability story), **MCP server mode** (B2B integration story), and the **MIT-licensed / no-lock-in** story (the biggest unused trust card).
- **The buildout doc has number errors that the site mostly avoids:** "55 built-in tools / 21 toolsets / ~150 built-in skills / 30+ providers" should be "**40+ tools** / **20+ toolsets** / **(no published count)** / **40+ providers**." The site itself only echoes "40+ tools" — that one's accurate.

---

## 1. Claim-by-claim verification

Legend: ✅ Supported · ⚠️ Partially / needs nuance · ❌ Not supported · ➕ True but undersold · 🔍 Implementation-level (Firmcraft's responsibility, not a Hermes feature)

### 1.1 Home page (`src/app/page.tsx`)

| # | Claim (verbatim or paraphrased) | Verdict | Notes |
|---|---|---|---|
| H1 | "An AI operator for small business" / "Lives in your team chat" | ✅ | Hermes runs as a single gateway across **21 messaging platforms** (Slack, Teams, Discord, WhatsApp, Signal, SMS, Email, Telegram, BlueBubbles/iMessage, WeCom, Matrix, Mattermost, Yuanbao, QQ, Feishu/Lark, Weixin, DingTalk, Google Chat, Home Assistant, Open WebUI, WeCom Callback). |
| H2 | "Plugs into the tools you already pay for — QuickBooks, Microsoft 365, Google Workspace, Zoho, DocuSign, your practice management" | ⚠️ | None of these are first-class Hermes integrations. They're reachable via (a) MCP servers (M365 / Workspace exist publicly; QuickBooks / Zoho / Eaglesoft / DocuSign do not at production quality), (b) browser automation, or (c) custom-built per client. Honest, but the framing implies turnkey. |
| H3 | "Up and running in five business days" | 🔍 | Firmcraft delivery promise. Achievable based on Hermes's config-only deployment model. |
| H4 | Hero proof strip: dental practice / tree-removal / solo ERP / payments firm / "+ YOU?" | 🔍 | Marketing claim — out of scope. Code comment calls these "real or representative customers." |
| H5 | "Up to 3 tool integrations" (Spark) / "Unlimited integrations" (Flow & Forge) | 🔍 | Firmcraft tier limit, not enforced by Hermes. |
| H6 | "$100 / $200 / $300 / mo AI token allowance" | 🔍 | Firmcraft billing layer (LiteLLM gateway). Hermes routes through any provider; budget caps are LiteLLM's job. |
| H7 | "Custom playbooks per role" (Flow) | ✅ | Hermes "skills" are scopable; combined with USER.md per team member, this maps cleanly. |
| H8 | "SOC 2 controls + audit log access" (Flow) | ⚠️ | Hermes provides session search + event hooks + MCP approval primitives. "SOC 2 controls" is a Firmcraft program. The /security page is honest about SOC 2 being "in progress." |
| HOW 01 "Mention it like a teammate" | ✅ | Standard Hermes interaction model. |
| HOW 02 "QuickBooks, Microsoft 365, Google Workspace, Zoho, DocuSign — read, write, audit-log" | ⚠️ | Same as H2. Audit-log capability is real (session search + event hooks). |
| HOW 03 "Flat monthly rate. All seats. All integrations." | 🔍 | Pricing. No technical claim. |
| HOW 04 "Intake Monday. Connectors live Wednesday. Production by Friday." | 🔍 | Delivery model. |
| Comparison: "Inside your team chat" vs. separate app / side panel | ✅ | Accurate — Hermes lives in the messaging platform's native UI. |
| Comparison: "Built and maintained for you" | ⚠️ | Defensible if "built" includes "wired up via MCP / browser-driver template." |

### 1.2 Capabilities page (`src/app/capabilities/page.tsx`)

The "six capabilities" frame is solid — every capability maps to a real Hermes feature.

#### CAP 01 — Multi-channel
| Sub-claim | Verdict | Notes |
|---|---|---|
| "Slack · Teams · Discord" | ✅ | Slack & Discord have full features (voice, files, threads, reactions, streaming). Teams has images + threads + typing (no voice yet). |
| "SMS · Email · WhatsApp · Signal" | ✅ | All four supported. SMS = Twilio. WhatsApp = Business API. Signal = full features incl. streaming. |
| "Telegram · iMessage · WeCom" | ✅ | iMessage via BlueBubbles bridge. WeCom (Enterprise WeChat) supported. |
| "Same operator. Same memory. Same playbooks." | ✅ | Single gateway, shared MEMORY.md / USER.md / skills. |
| ➕ *Undersell:* | ➕ | Hermes also supports **Matrix, Mattermost, Feishu/Lark, Yuanbao, Weixin, QQ, DingTalk, Google Chat, Home Assistant, Open WebUI**, plus generic webhooks and an OpenAI-compatible API endpoint. Could expand chips to 12–15 named, or add "+10 more." |
| ➕ *Missing:* | ➕ | **Voice mode (in + out).** Hermes supports voice messages on Telegram, Discord, Slack, WhatsApp, Signal, Mattermost, Matrix, Feishu, WeCom, Weixin, Yuanbao, QQ. Big "feels like an employee" moment for field crews and front desks. |

#### CAP 02 — Scheduled work
| Sub-claim | Verdict | Notes |
|---|---|---|
| "Cron-like scheduling" | ✅ | Hermes ships natural-language *or* cron-expression scheduling, with skill attachment. |
| "Pause / skip per holiday" | ❌ | **Not a documented Hermes feature.** Pause/resume/edit on jobs IS documented. "Skip per holiday" specifically would be a custom skill. Risks misleading if a prospect asks "do you do this natively?" |
| "Auto-reschedule on conflict" | ❌ | **Not a documented Hermes feature.** Could be built as a skill, but framing as a standalone bullet next to two real features is an oversell. |

**Recommendation:** Replace those two bullets with verifiable Hermes features:
- ✓ "Pause, resume, edit any job"
- ✓ "Delivery to any of your messaging channels" (cron output goes to any of the 21 channels)

#### CAP 03 — Event-driven
| Sub-claim | Verdict | Notes |
|---|---|---|
| "Webhooks from any tool" | ✅ | Webhooks is a first-class trigger surface. |
| "Inbox + form + calendar listeners" | ⚠️ | Email channel ✅. Forms = webhook ✅. Calendar = depends on MCP/browser. "Calendar listeners" implies native; reality is via integration. |
| "Reacts in seconds, not days" | ✅ | Hermes session loop is event-driven; latency gated by LLM provider response. |

#### CAP 04 — Any tool, any API
| Sub-claim | Verdict | Notes |
|---|---|---|
| "40+ tools out of the box" | ✅ | Matches Hermes README exactly. (Buildout doc's "55 built-in tools" is wrong; the site number is right.) |
| "Custom connectors in week 1" | 🔍 | Firmcraft delivery promise. |
| "Browser-driven where no API exists" | ✅ | Hermes ships **4 browser backends**: Browserbase cloud, Browser Use cloud, local Chrome via CDP, local Chromium. Strong claim. |
| ➕ *Undersell:* | ➕ | "Terminal" toolset has **7 backends**: local, Docker, SSH, Singularity, Modal, Daytona, Vercel Sandbox. Worth a footnote for technical buyers — "we run code where you tell us to." |

#### CAP 05 — Memory + learning
| Sub-claim | Verdict | Notes |
|---|---|---|
| "Per-firm persistent memory" | ✅ | MEMORY.md + USER.md per deployment. Per-firm isolation matches Firmcraft's one-instance-per-client architecture. |
| "Learns from every correction" | ✅ | Hermes's headline differentiator: "creates skills from experience, improves them during use." Nous itself markets this as the defining feature. |
| "Voice + style stays consistent" | ✅ | SOUL.md / personality is a primary system-prompt element — direct match. |
| ➕ *Missing:* | ➕ | Hermes integrates **8 external memory providers** (Honcho, OpenViking, Mem0, Hindsight, Holographic, RetainDB, ByteRover, Supermemory). Useful in a security/architecture brief: "extensible memory backends, your choice of vendor." |
| ➕ *Missing:* | ➕ | **FTS5 session search with LLM summarization** for cross-session recall. The "doesn't ask the same question twice" claim is grounded in this — could be named on the page. |

#### CAP 06 — Approvals + audit
| Sub-claim | Verdict | Notes |
|---|---|---|
| "Per-action approval rules" | ✅ | Hermes's MCP-server tool surface includes `permissions_list_open`, `permissions_respond` — the primitive is there. |
| "Full audit log, exportable" | ⚠️ | Session search (FTS5) gives queryable history. CSV/JSON export is a Firmcraft skin on top — fine to claim, but it's our build, not a Hermes export button. |
| "SOC 2 in progress · HIPAA-ready posture" | 🔍 | Firmcraft program. |
| ➕ *Missing — single most important:* | ➕ | **Checkpoints + `/rollback`.** Hermes auto-snapshots working directories before file changes and offers a `/rollback` command. **This is *the* feature that backs up "reversible by default" on /security.** Should be named explicitly. |

#### "In Practice" — One workflow uses all six
The dental-claim scenario walkthrough (#01–#06) is operationally accurate to how Hermes actually works. The "Eaglesoft + Delta portal" example correctly distinguishes "modern API" from "browser-driven clunky vendor portal" — matches Hermes's actual capability split.

#### VS Compare table
Holds up. Each "yes" row maps to a real Hermes feature.

### 1.3 Integrations page (`src/app/integrations/page.tsx`)

This is the page most at risk of overclaim.

**The headline numbers:**
- "**Native: 112** — Live, supported, documented integrations."
- "Categories: 14"
- "Custom: Wk 1 — Don't see yours? We build it during onboarding."

**Reality:**
- Hermes ships first-class platform plugins / dedicated tools for ~21 messaging platforms plus a handful of toolset-level tools (Spotify, Discord admin, web search, browser, file ops, terminal). That's ~25 first-party direct integrations, almost all on the messaging side.
- Everything else on the catalog (QuickBooks, Xero, Sage, NetSuite, Eaglesoft, Dentrix, Clio, HubSpot, Salesforce, Pipedrive, Stripe, Plaid, Mercury, Mailchimp, DocuSign, Linear, Asana, Zendesk, ServiceTitan, etc.) is reached via:
  - **An MCP server** (some exist as public open-source; many don't), or
  - **Browser automation** (Hermes has 4 browser backends), or
  - **A custom connector Firmcraft writes** during onboarding.

**The pivot:**
Most of these "integrations" are not integrations Firmcraft has *built* — they are connectors Firmcraft *can build* on demand using the MCP / browser primitives Hermes provides. That's a real, defensible value proposition. But the current page treats them as static, supported inventory.

**The page's own honest framing — extend it:**
- The "browser-driven" badge applied to Eaglesoft, Dentrix, Smokeball, LinkedIn, ADP/Paychex is in the right direction.
- The "BUILD" section ("If it has an API, a portal, or a webpage — we can drive it") is exactly the right framing — but it appears *after* the catalog, undermining the "112 native" claim above.
- The custom-connector examples ("Eaglesoft + Delta portal," "FileMaker app," "8 state revenue portals") are honest and strong.

**Specific copy suggestions:**

> **Current:** "Native: 112 — Live, supported, documented integrations."
> **Suggested:** "Catalog: 112 — Tools we connect to, across API, MCP, and browser."

> **Current:** "Don't see yours? We wire it in during onboarding."
> **Suggested:** *(no change — this framing is right for the entire catalog, not just gaps)*

> **Suggested addition under stat strip — a third subline:**
> "How: API where it exists. Browser where it doesn't. MCP servers where the community already built one."

**Additional flags:**
- "Microsoft 365 — OneDrive · SharePoint · Graph" is reachable, but typically requires per-tenant app registration + admin consent. Worth noting in onboarding scope, not a problem on the marketing page.
- The badge system is doing real work; consider applying "driven" more broadly — most non-public-API tools (carrier portals, state filing systems, niche industry tools) should carry it.

### 1.4 Playbooks page (`src/app/playbooks/page.tsx`)

| Claim | Verdict | Notes |
|---|---|---|
| "40 playbooks" | 🔍 | Firmcraft catalog. Maps cleanly to Hermes "skills" — every playbook = one or more skill files. |
| "A playbook is a named, versioned piece of work the operator can run on its own" | ✅ | Matches Hermes skills system definition. |
| "Triggered by a mention, a schedule, or an event in your tools" | ✅ | All three trigger types map to real Hermes features (messaging, cron, webhooks). |
| "Improves with use ∞ — Each playbook gets sharper every time the operator runs it" | ✅ | Direct match to Hermes's headline differentiator: "creates skills from experience, improves them during use." |
| "Live playbooks: 40" | 🔍 | The implication that all 40 are running in production today is a marketing claim (the proof strip on home only names 4 customer types). |
| "Custom builds: Wk 1" | 🔍 | Firmcraft delivery commitment. |
| ➕ *Missing differentiator:* | ➕ | Skills are **portable across the agentskills.io open standard.** Clients aren't locked in — if they ever leave Firmcraft, their skills travel with them. Quiet trust-building point for security-conscious buyers. |

The 40 individual playbook descriptions are operationally plausible — every one is composable from Hermes primitives.

### 1.5 Security page (`src/app/security/page.tsx`)

This page is the most carefully-hedged on the site, and rightly so. Most claims are Firmcraft-program-level rather than Hermes-feature-level.

| Claim | Verdict | Notes |
|---|---|---|
| "The operator runs in a deployment dedicated to your firm" / "single-tenant" | ✅ | Firmcraft's per-client Hetzner CX22 architecture matches this. Hermes is a self-hosted OSS platform — single-tenancy is the *default*, not a special mode. |
| "No multi-tenant brain. No training on your data. No shared embeddings." | ✅ | Hermes does not pool data across deployments. Provider-level training opt-out depends on which provider you route to (Anthropic + OpenAI both honor enterprise / API no-train terms). |
| "Every action is visible and reversible" | ✅ | Backed by Hermes's session search + event hooks + **checkpoints + /rollback**. Site doesn't currently name the checkpoints + rollback mechanism — it should, because that's the most concrete proof of the "reversible" claim. |
| "Risky stuff asks first" — partner approval required by default | ✅ | Hermes has a documented approval primitive. |
| Deployment posture table: AES-256 at rest, TLS 1.3 in transit | 🔍 | Firmcraft hosting concern. Not Hermes-specific. |
| "Customer data in training: Never" | ✅ | Hermes-default + provider-contractual. |
| "Sub-processors: 3 · listed" | 🔍 | Firmcraft commercial fact. |
| RBAC table — Front desk / Hygienist / Doctor | ⚠️ | Approval gate is real. Hierarchical RBAC by role across a firm is more of a Firmcraft configuration pattern (channel scoping + approval rules + USER.md per role) than a Hermes feature — achievable, just not a switch you flip. |
| "N-of-M approval — two partners for any wire over $25k" | ⚠️ | **N-of-M specifically is not a documented Hermes primitive.** Would be a custom skill. Either hedge or implement before the page goes live in front of CISOs. |
| "Per-channel scope — `#partners-only` never reads from `#general`" | ✅ | Hermes channel-level configuration supports this. |
| Audit log mock-up | ✅ | Achievable from session search; format is a Firmcraft skin. |
| "Compliant retention — 7 years tax / 10 legal / indefinite" | 🔍 | Firmcraft retention policy. Hermes does not enforce or expire logs. |
| "Logs stored in your environment, not ours" | ✅ | Each Firmcraft instance is the client's environment per the deployment model. |
| Compliance grid: SOC 2 in progress, HIPAA in progress, pen tests annual, DPA + sub-processor list live, ISO 27001 roadmap | 🔍 | Firmcraft program. Phrasing is appropriately careful. |
| "I'd rather miss a deal than fake a certification" | 🔍 | Marketing tone — accurate to the page's posture. |
| FAQ: "Will my client data be used to train models?" → No | ✅ | Correct under provider enterprise/API terms. |
| FAQ: "Where is my data physically stored?" → US-East-1, options for US-West, EU, BYO cloud, on-prem | ✅ | All achievable on Hermes (MIT-licensed, self-hostable anywhere). |
| FAQ: "What happens if we churn?" → 5-day export, 30-day backup, then destroyed | 🔍 | Firmcraft commitment; achievable. |
| FAQ: "Three engineers named in DPA" | 🔍 | Firmcraft staffing. |
| FAQ: "What if a model provider has an outage?" → "The operator routes across multiple providers" | ✅ | **Hermes has built-in fallback providers + provider routing with sorting/whitelists/blacklists/priority + credential pools** for rate-limit distribution. Real, and worth promoting more explicitly. |
| FAQ: BAA / SOC 2 Type I under NDA | 🔍 | Commercial. |

**Recommendation:** Add a short addition (or extend Section 03 / Audit) that names the actual Hermes mechanisms backing the claims — checkpoints + `/rollback` for reversibility, FTS5 session search for the audit log, multi-provider failover for the outage story. CISOs grade higher when the mechanism is named.

---

## 2. Hermes capabilities NOT mentioned on the site (potential differentiators)

Roughly priority-ordered for Firmcraft's audience.

### 2.1 High-value to add

1. **Voice mode (in + out).**
   - Operator receives voice notes (Telegram, Discord, Slack, WhatsApp, Signal, Mattermost, Matrix, Feishu, WeCom, Weixin, Yuanbao, QQ) and replies with voice. Full Discord voice-channel integration.
   - Why it matters: Field crews, dental front desks, owner-operators in trucks. Big "feels like an employee" moment.
   - Where to add: `/capabilities` CAP 01 — could be a third bullet line, or its own sub-card.

2. **Vision (image understanding) + image paste.**
   - Operator reads screenshots, photos, charts, scanned documents.
   - Why it matters: Tree-removal client photographs damage and asks for a quote. Dental front-desk pastes an EOB screenshot and asks for an appeal. CPA pastes a 1099 to OCR the EIN.
   - Where to add: `/capabilities` bullet, or a `/playbooks` example.

3. **Checkpoints + `/rollback`.**
   - Auto-snapshot of working directories before file changes. Undo via `/rollback`.
   - Why it matters: This is the literal mechanism behind "reversible by default" on `/security`. Naming it makes the security promise concrete instead of aspirational.
   - Where to add: `/security` Section 03 (Audit log).

4. **Multi-provider LLM failover + credential pools.**
   - Automatic fallback if one provider has an outage; rate-limit distribution across multiple keys.
   - Why it matters: The Security FAQ already references "the operator routes across multiple providers," but it's buried. Could go in the deployment-posture table on `/security` as a row ("Provider redundancy: ≥2 per workflow") and named on `/capabilities`.

5. **Image generation + TTS for marketing playbooks.**
   - Hermes integrates **9 image-generation models** (FLUX 2 Klein/Pro, GPT-Image 1.5/2, Nano Banana Pro, Ideogram V3, Recraft V4 Pro, Qwen, Z-Image Turbo) via FAL.ai, and **10 TTS providers** (Edge TTS free, ElevenLabs, OpenAI, MiniMax, Mistral Voxtral, Google Gemini, xAI, NeuTTS, KittenTTS, Piper).
   - Why it matters: Playbook #031 ("weekly content engine") and #003 ("Google reviews flywheel") get more interesting if the operator can also produce visuals or audio — e.g. a podcast-style audio summary for a busy partner.
   - Where to add: `/playbooks` extension, or a "Operator can speak and see" sub-section on `/capabilities`.

### 2.2 Medium-value to add

6. **Subagent delegation — 3 concurrent by default, configurable.**
   - Operator spawns child agents for complex multi-step work; each child has a restricted toolset.
   - Why it matters: Legal "court filing prep brief" or accounting "monthly close package" benefit from parallelism. Footnote on `/capabilities` CAP 02 or CAP 04.

7. **Code execution (sandboxed Python via RPC).**
   - Operator writes and runs Python on the fly.
   - Why it matters: Ad-hoc data analysis playbooks. CPA pivot: "draft a spreadsheet showing every vendor whose 1099 totals jumped >25% YoY."

8. **Event hooks at lifecycle points.**
   - Custom code runs on events (logging, alerts, guardrails, metrics).
   - Why it matters: A buyer with a security/audit team will want to know guardrails are extensible. Belongs on `/security` as a small architecture detail.

9. **OpenAI-compatible API endpoint (Hermes can serve as an API).**
   - Why it matters: Technical clients (B2B/SaaS prospects) can integrate the Firmcraft operator directly into their own software. "Your operator is also an API" is a nice positioning line.
   - Where to add: A sentence on `/capabilities` CAP 01, or a `/integrations` footnote.

10. **MCP server mode (operator can be exposed AS an MCP server to other agents).**
    - Hermes exposes 10 messaging-bridge tools when run as MCP server: `conversations_list`, `conversation_get`, `messages_read`, `messages_send`, `attachments_fetch`, `events_poll`, `events_wait`, `channels_list`, `permissions_list_open`, `permissions_respond`. (Stdio transport only at present; no HTTP MCP server yet.)
    - Why it matters: A prospect's internal Claude Desktop / Cursor / OpenAI Code can talk to the Firmcraft operator. Genuinely powerful for clients with their own AI investments — they don't replace, they integrate. A real B2B differentiator.
    - Where to add: A line on `/integrations` or a sentence on `/capabilities`.

### 2.3 Worth mentioning on a deeper page (or in conversations)

11. **MIT-licensed open-source platform underneath.**
    - "We don't own the runtime. If you ever leave us, your skills, your memory files, your config, and your audit logs travel with you to any other Hermes deployment."
    - **The single most underused trust-building card on the site.** It directly answers the "what if you go out of business?" question and "how is this different from another vendor lock-in?"
    - Where to add: `/security` FAQ as a new question, or a small "no lock-in" callout on the home page.

12. **agentskills.io open standard.**
    - Same theme as #11 — skills are portable.

13. **8 external memory provider plugins** (Honcho, OpenViking, Mem0, Hindsight, Holographic, RetainDB, ByteRover, Supermemory).
    - Niche, but matters to a buyer who wants to bring their existing knowledge graph.

14. **IDE integration (ACP) — VS Code, Zed, JetBrains.**
    - Niche for our audience but matters for technical clients on Forge tier.

15. **Plugin ecosystem.**
    - Custom tools, hooks, integrations. "Anything we don't have, we can plug in."

---

## 3. Numbers used in copy — accuracy check

| Number | Where | Source / Reality | Verdict |
|---|---|---|---|
| "21+ messaging channels" | Buildout doc § "What Hermes Agent Ships With" | Hermes docs/user-guide/messaging lists exactly **21**. ✅ | Accurate. |
| **"55 built-in tools"** | Buildout doc § "55 Built-in Tools (21 Toolsets)" | Hermes README says **"40+ tools."** Tools page lists ~25 named toolsets but no exact tool count. | ❌ **Inaccurate; use "40+ tools."** Site does not echo this — only the buildout doc does. Internal cleanup. |
| "21 toolsets" | Buildout doc | Tools page lists ~25 named toolsets. | ⚠️ Slight undercount. Drop the number or say "20+ toolsets." |
| **"30+ LLM providers"** | Buildout doc | Provider page lists **45+** with first-class IDs, plus any OpenAI-compatible endpoint. | ➕ **Undersell.** Could say "40+ providers." |
| **"~150 built-in skills"** | Buildout doc § "Skills System" | Hermes docs do not publish a built-in-skill count. Bundled-skills catalog exists but isn't enumerated. | ❌ **Unverified; remove or hedge.** Not on public site. |
| "40+ tools out of the box" | `/capabilities` CAP 04 | Matches Hermes README. ✅ | Accurate. |
| Named-channel count on capabilities chip row | `/capabilities` CAP 01 | Site lists 9 named (Slack/Teams/Discord/SMS/Email/WhatsApp/Signal/Telegram/iMessage/WeCom). Hermes has 21. | ➕ Accurate as written but undersells by ~12. |
| "112 integrations" / "14 categories" | `/integrations` hero | Firmcraft's catalog count, not Hermes. The accuracy concern is the qualifier "**Native** — Live, supported, documented" — most are not Hermes-native. | ⚠️ **Reframe** the qualifier (Native → Catalog). |
| "40 playbooks" | `/playbooks` hero | Firmcraft's catalog. | 🔍 Marketing inventory; not a Hermes claim. |
| "20-min discovery call" / "5 business days" / Mon–Fri arc | Multiple | Firmcraft delivery commitment. | 🔍 Operations promise. |
| "Sub-processors: 3" | `/security` deployment table | Firmcraft commercial fact. | 🔍 Should match the actual DPA. |
| "Three engineers, named in our DPA" | `/security` FAQ | Firmcraft commercial fact. | 🔍 Should match the actual DPA. |
| "SOC 2 Type II — In progress · Q3 '26" | `/security` compliance grid | Firmcraft program. Auditor engaged. | 🔍 Track to actual milestone. |

---

## 4. Specific copy suggestions

Concrete, paste-ready edits — not full rewrites.

### 4.1 Home page

**Current (HOW 02):**
> QuickBooks, Microsoft 365, Google Workspace, Zoho, DocuSign, your practice management — read, write, audit-log.

**Suggested:**
> QuickBooks, Microsoft 365, Google Workspace, Zoho, DocuSign, your practice management. Through documented APIs where they exist, browser-driven where they don't, audit-logged either way.

*(Frames the "speaks to your weird tool" claim up front, instead of buried on `/capabilities`.)*

**Current (Hero meta):**
> ✓ Live in 5 business days · ✓ Flat monthly rate · ✓ SOC 2 in progress

**Suggested addition (4th item):**
> ✓ Your data, your environment

*(Quick reinforcement of the per-firm deployment story without a click.)*

### 4.2 Capabilities page

**Current (CAP 01 bullets):**
> Slack · Teams · Discord
> SMS · Email · WhatsApp · Signal
> Telegram · iMessage · WeCom

**Suggested:**
> Slack · Teams · Discord · Mattermost · Matrix
> SMS · Email · WhatsApp · Signal · Telegram · iMessage
> Voice notes in, voice replies out — on every channel that carries audio

*(Adds two named channels in the most-likely-asked tier (Mattermost / Matrix for compliance-heavy IT), and surfaces voice as a capability without needing a new card.)*

**Current (CAP 02 bullets):**
> Cron-like scheduling
> Pause / skip per holiday
> Auto-reschedule on conflict

**Suggested:**
> Cron + natural-language scheduling
> Pause, resume, edit any job
> Delivery to any of your messaging channels

*(Replaces two unverified-as-built-in features with three real Hermes features. **This is the highest-priority change** — the current bullets describe features Hermes doesn't have.)*

**Current (CAP 06 bullets):**
> Per-action approval rules
> Full audit log, exportable
> SOC 2 in progress · HIPAA-ready posture

**Suggested:**
> Per-action approval rules
> Every file change snapshotted — `/rollback` undoes anything
> Searchable audit log, exportable as CSV / JSON
> SOC 2 in progress · HIPAA-ready posture

*(Names the Hermes mechanism — checkpoints / rollback — that backs up "reversible.")*

### 4.3 Integrations page

**Current (stat strip):**
> Native — 112 — Live, supported, documented integrations.
> Categories — 14 — From accounting to field service to legal.
> Custom — Wk 1 — Don't see yours? We build it during onboarding.

**Suggested:**
> Catalog — 112 — Tools we connect to, across API, MCP, and browser.
> Categories — 14 — From accounting to field service to legal.
> Custom — Wk 1 — Don't see yours? We build it during onboarding.

*(One word — Native → Catalog — and a one-line subtitle change. Removes the "live, supported, documented" implication that all 112 are Hermes-native.)*

**Suggested addition (subtitle row under stats):**
> Three ways the operator reaches a tool: documented API (preferred) · MCP server (open standard, growing fast) · headless browser session (when there's no API at all). Most of the catalog uses #1; the badges below mark when we use #2 or #3.

### 4.4 Security page

**Current (Section 03 / Audit log, lead paragraph):**
> Read, write, send, fail, retry, approve, reject. Each entry carries who triggered it, what it touched, why it ran, and the resulting artifacts. Searchable in the dashboard. Exportable as CSV or JSON for your auditor.

**Suggested addition (after that paragraph, before "Reversible by default"):**
> **The mechanism.** Hermes auto-snapshots every working directory before a file change. The operator can `/rollback` any individual action, and the session-search index (FTS5) is the searchable layer underneath the dashboard. None of this is bolted on; it's how the runtime works by default, and it's the same audit primitive Nous Research itself uses.

*(Names the Hermes mechanism. Increases CISO trust.)*

**Current (FAQ — "What if a model provider has an outage?"):**
> The operator routes across multiple providers. Outage on one provider degrades but doesn't take you down.

**Suggested:**
> The operator routes across multiple providers, with built-in automatic failover and credential pools that distribute load across keys. If Anthropic has an outage, we route to OpenAI or Bedrock without you noticing. In the case of a security incident at a provider, we have contractual notification obligations and our own 24-hour incident SLA — we'd notify you, isolate any affected workflows, and switch routing.

*(Promotes the failover from anecdote to architecture.)*

**Suggested new FAQ — add at end:**
> **What happens if Firmcraft goes out of business?**
> The operator runs on the open-source Hermes Agent platform (MIT-licensed, maintained by Nous Research). Your skills, memory files, integrations, and audit logs are all stored in standard formats. You — or another vendor — can take them and run a Hermes deployment elsewhere. We don't own the runtime; we operate it for you.

*(Single biggest unused trust card. Costs nothing to claim because it's literally true.)*

**Current (Section 02 / Access & roles):**
> Sensitive actions can require N-of-M approval — e.g. partner OR senior associate for engagement letters, two partners for any wire over $25k.

**Suggested (until N-of-M is verified or built):**
> Sensitive actions require explicit approval — partner OR senior associate for engagement letters, partner-only for any wire over $25k. Multi-approver chains are configurable per action.

*(Hedges "N-of-M" until we've either confirmed Hermes supports it natively or shipped a custom skill that does.)*

### 4.5 Buildout doc internal cleanup

Not part of the site, but flagged for your benefit:
- "55 built-in tools (21 Toolsets)" → "40+ tools across 20+ toolsets"
- "30+ LLM providers" → "40+ LLM providers" (actual is 45+)
- "~150 built-in skills" → drop the number; say "bundled skill catalog plus agent-learned skills"
- Reference to "21 messaging channels" is **correct** as-is

---

## 5. Open questions for follow-up

1. **MCP server inventory for client-specific tools.** Buildout doc Workstream 2 step 7 mentions "MCP servers for WorldMax's tools (Office 365, Outlook, SharePoint, OneDrive)." Confirm which have public/community MCP servers vs. need building. If many need building, the `/integrations` "Wk 1 custom" promise is accurate but operationally heavy. Likely needs an inventory:
   - **Office 365 / Outlook / Graph** — community MCP servers exist; Microsoft Graph is documented and widely covered.
   - **SharePoint / OneDrive** — covered by Graph-based MCP servers in most cases.
   - **QuickBooks Online** — public MCP servers exist but quality is uneven; may need a Firmcraft fork or build.
   - **DocuSign** — partial community coverage; envelope-creation flow likely needs custom code.
   - **Eaglesoft / Dentrix / industry PMs** — no MCP coverage; browser automation is the only path.

2. **Approval-chain N-of-M.** Hermes's documented approval primitive is per-action approve/deny. Whether N-of-M is supported natively or needs a custom skill is **the** open question for the `/security` claim. Either:
   - (a) confirm Hermes supports N-of-M and document where, or
   - (b) build it as a Firmcraft skill before the page is shown to a CISO, or
   - (c) hedge the copy until one of those is true.

3. **"Pause / skip per holiday" + "Auto-reschedule on conflict"** on `/capabilities` CAP 02 — these are not documented Hermes features. Confirm whether they're roadmap or whether to swap the bullets to verifiable Hermes features (recommended).

4. **The "112 integrations" inclusion rule.** What's the bar?
   - Public API in the SaaS we list?
   - Anyone we've ever shipped a connector for?
   - Anyone we'd ship a connector for in onboarding?
   - This determines whether "Catalog" or "Live deployments" is the more honest label.

5. **Audit-log export format.** `/security` promises CSV/JSON export. Confirm whether this is a Firmcraft-built admin-dashboard feature (most likely — it's not on the Hermes feature list) and that it's actually in the build queue for WorldMax delivery.

6. **HIPAA BAA chain.** "BAA-able sub-processors" requires every sub-processor in the data path to sign one. Confirm Anthropic, OpenAI, Hetzner, and any LiteLLM/Langfuse hosting are all BAA-signing for the healthcare deployments we'll take on.

---

## Sources

- Hermes Agent docs — Messaging: https://hermes-agent.nousresearch.com/docs/user-guide/messaging/ (21 platforms; full feature matrix incl. voice, files, threads, reactions, streaming per channel)
- Hermes Agent docs — Features Overview: https://hermes-agent.nousresearch.com/docs/user-guide/features/overview (skills, memory, cron, subagents, hooks, browser backends, image gen, TTS, voice, IDE/ACP, RL training, checkpoints + /rollback)
- Hermes Agent docs — MCP: https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp (bidirectional client + server; 10 messaging-bridge tools when serving; stdio + HTTP for client, stdio-only for server)
- Hermes Agent docs — AI Providers: https://hermes-agent.nousresearch.com/docs/integrations/providers (45+ providers; fallback + credential pools + provider routing)
- GitHub — NousResearch/hermes-agent: https://github.com/NousResearch/hermes-agent (README; MIT license; 140k★; 40+ tools; 7 terminal backends)
- Internal — [`firmcraft-weekend-buildout-plan.md`](firmcraft-weekend-buildout-plan.md) (v6, 2026-05-08)
