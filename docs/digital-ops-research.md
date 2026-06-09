# Digital Ops Module — Research Report

**Date:** June 8, 2026
**Author:** Firmcraft AI Research
**Purpose:** Comprehensive research to inform the build of Firmcraft's Digital Ops module — a proactive AI marketing agent for contractors managing Google Business Profile, reviews, social media, campaigns, website health, and competitor monitoring.

---

**Related docs:** [ROADMAP.md](../ROADMAP.md) (Phase 5) · [GBP Setup Plan](gbp-setup-plan.md) · [GBP API Checklist](gbp-api-application-checklist.md) · [Houston HVAC Prospects](houston-hvac-prospect-research.md)

---

## Table of Contents

1. [Existing Firmcraft Assets](#1-existing-firmcraft-assets)
2. [Open Source Tools & GitHub Repos](#2-open-source-tools--github-repos)
3. [MCP Connectors & Integrations](#3-mcp-connectors--integrations)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Market Gaps & Opportunities](#5-market-gaps--opportunities)
6. [Recommended Architecture](#6-recommended-architecture)

---

## 1. Existing Firmcraft Assets

### What We Have That's Reusable

| Asset | Location | Reusability |
|-------|----------|-------------|
| Marketing integration catalog (UI) | `src/app/integrations/page.tsx` | Lists Mailchimp, Klaviyo, Google Business, ActiveCampaign, etc. — good reference for platform targets |
| Google Reviews flywheel playbook | `src/app/playbooks/page.tsx` #003 | Product spec/inspiration: job complete → text review link → handle by rating → weekly recap |
| Weekly content engine playbook | `src/app/playbooks/page.tsx` #031 | Product spec: pull wins/case studies → draft email + LinkedIn variants |
| Outreach email system (Resend + tracking) | `admin/src/app/api/outreach/` | **Directly reusable** — Resend integration, open/click tracking pixels, contact management |
| Twilio SMS integration | `voice-agent/app/notifications.py` | **Directly reusable** — SMS transport for review requests and campaign messages |
| Supabase database + migration patterns | `admin/supabase/migrations/` | Data model patterns for new marketing tables |
| LiteLLM gateway | `infra/central-services/` | AI backbone for content generation, review responses, campaign copy |
| Prospect data with review/website signals | `admin/scripts/houston-1k/`, etc. | Demonstrates data model for local business profiles with Google review counts/ratings |
| Hermes agent framework | `hermes-theme/`, `infra/` | Plugin architecture, multi-LLM routing, persistent memory — the runtime for Digital Ops skills |
| Voice agent (Pipecat + Deepgram + Retell) | `voice-agent/` | Could power AI phone answering for marketing context |

### What Does NOT Exist (Must Build)

- No Google Business Profile API integration code
- No review management or review response automation
- No social media posting code (no Facebook/Instagram/LinkedIn posting APIs)
- No SEO monitoring or local SEO tools
- No content calendar system
- No marketing campaign management
- No reputation monitoring
- No Hermes skills for any marketing task
- No database tables for marketing campaigns, reviews, social posts, or content calendars
- No Digital Ops module in the pricing calculator (`admin/src/components/playbook/data.ts` lists 5 modules, none marketing)

### Roadmap Context

[ROADMAP.md](../ROADMAP.md) lists "Marketing automation — seasonal campaigns, review generation, referral programs" under **Future Considerations (2027+)**. The Digital Ops module would accelerate this roadmap item significantly.

---

## 2. Open Source Tools & GitHub Repos

### 2.1 Google Business Profile API

| Repo | Stars | Language | Active? | Description |
|------|-------|----------|---------|-------------|
| [googleapis/google-api-python-client](https://github.com/googleapis/google-api-python-client) | 7,000+ | Python | YES | Official Python client for all Google APIs including GBP. **The canonical path.** |
| [google/google-my-business-samples](https://github.com/google/google-my-business-samples) | ~120 | Python/Java | No | Official code samples for GBP API — good reference implementation |
| [google/alligator2](https://github.com/google/alligator2) | ~43 | Python | Archived | GBP API + Cloud NLP for review sentiment analysis → BigQuery. Pattern is reusable. |

**Assessment:** No dominant open-source GBP management library exists. Build on `google-api-python-client` directly. **CRITICAL NOTE:** GBP API access requires Google approval with a 60+ day waitlist. Start the application process immediately.

### 2.2 Review Monitoring & Response

| Repo | Stars | Language | Active? | Description |
|------|-------|----------|---------|-------------|
| [omkarcloud/google-maps-scraper](https://github.com/omkarcloud/google-maps-scraper) | 2,400+ | Python | YES | Extracts 50+ data points from Google Maps including reviews. Most popular in category. |
| [omkarcloud/google-maps-reviews-scraper](https://github.com/omkarcloud/google-maps-reviews-scraper) | ~200 | Python | YES | Focused review extraction with sentiment/trend analysis |
| [georgekhananaev/google-reviews-scraper-pro](https://github.com/georgekhananaev/google-reviews-scraper-pro) | 211 | Python | YES | Multi-language scraper, MongoDB integration, handles Google's 2026 restrictions |
| [lanl/yelpapi](https://github.com/lanl/yelpapi) | 128 | Python | YES | Pure Python Yelp Fusion API client. pip-installable. v2.6.0 March 2026. **Maintained by Los Alamos National Lab.** |

**Assessment:** Use `lanl/yelpapi` for Yelp (clean, maintained). For Google reviews, the official GBP API is preferred for responding; scrapers are useful for competitor monitoring.

### 2.3 Social Media Scheduling & Posting

| Repo | Stars | Language | Active? | Description |
|------|-------|----------|---------|-------------|
| [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) | **31,500** | TypeScript/Next.js | YES | **Dominant open-source social scheduler.** 14+ platforms, AI features, Docker self-hostable. Has Python CLI agent. |
| [inovector/mixpost](https://github.com/inovector/mixpost) | 3,300 | PHP/Laravel | YES | Buffer alternative. Self-hosted, no subscriptions or limits. Team workspaces. |
| [brightbeanxyz/brightbean-studio](https://github.com/brightbeanxyz/brightbean-studio) | 1,300 | TypeScript | YES | **Includes Google Business Profile support natively.** Docker, one-click deploy. |
| [socioboard/Socioboard-5.0](https://github.com/socioboard/Socioboard-5.0) | 1,300 | Node.js | Marginal | 9 social networks. 20k+ reported users but development slowing. |

**Assessment:** **Postiz** (31.5k stars) is the clear winner for social media. BrightBean is interesting specifically because it includes native GBP posting support.

### 2.4 Marketing Automation Frameworks

| Repo | Stars | Language | Active? | Description |
|------|-------|----------|---------|-------------|
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | **191,600** | TypeScript | YES | General-purpose workflow automation, 400+ integrations, native AI/LLM support. Docker self-hostable. **Could serve as orchestration backbone.** |
| [knadh/listmonk](https://github.com/knadh/listmonk) | 21,300 | Go | YES | High-performance newsletter/mailing list. Single binary, PostgreSQL. v6.1.0 Mar 2026. |
| [Billionmail/BillionMail](https://github.com/Billionmail/BillionMail) | 15,100 | Go/Docker | YES | Full email stack: mail server + newsletter + marketing. Self-hosted. |
| [mautic/mautic](https://github.com/mautic/mautic) | ~9,800 | PHP | YES | Largest open-source marketing automation. 200k+ organizations. Campaigns, lead nurturing, forms. |
| [parcelvoy/platform](https://github.com/parcelvoy/platform) | 500 | TypeScript | YES | Multi-channel automation (email, SMS, push). Journey builder, real-time segmentation. Docker. |

**Assessment:** n8n as the workflow orchestration engine + Listmonk for email delivery is a powerful combination. Mautic is heavy but feature-complete if we need full marketing automation.

### 2.5 AI Content Generators for Marketing

| Repo | Stars | Language | Active? | Description |
|------|-------|----------|---------|-------------|
| [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | 5,200+ | YAML | YES | 337 Claude Code skills including marketing, content, copywriting |
| [indranilbanerjee/digital-marketing-pro](https://github.com/indranilbanerjee/digital-marketing-pro) | ~300 | YAML | YES | 150 skills, 25 agents, 12-Part Strategy Flow. v3.0.0 April 2026. |
| [OpenAnalystInc/10x-MM-Skill](https://github.com/OpenAnalystInc/10x-MM-Skill) | ~200 | YAML/Python | YES | Full marketing team: 25+ skills, 7 AI agents, 6 slash commands, 37 MCP tools |
| [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) | ~200 | YAML | YES | Universal SEO skill. 25 sub-skills + 18 sub-agents for technical/local SEO, GEO/AEO. |
| [google-marketing-solutions/feedgen](https://github.com/google-marketing-solutions/feedgen) | 245 | Python | Marginal | Google's LLM tool for optimizing product titles/descriptions via Vertex AI |

**Assessment:** Best approach is building custom prompt chains using Claude/GPT-4o via LiteLLM, referencing these repos for prompt engineering patterns. The `claude-seo` repo is particularly relevant for local SEO skill design.

### 2.6 Local SEO & Website Health

| Repo | Stars | Language | Active? | Description |
|------|-------|----------|---------|-------------|
| [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse) | **30,200** | Node.js | YES | **Gold standard** for web auditing: performance, accessibility, SEO scores. Node API available. |
| [every-app/open-seo](https://github.com/every-app/open-seo) | 1,700 | TypeScript | YES | Open-source Semrush/Ahrefs alternative. Keyword research, domain insights, site audits. Pay-as-you-go via DataForSEO. |
| [sethblack/python-seo-analyzer](https://github.com/sethblack/python-seo-analyzer) | 1,300 | Python | Marginal | Lightweight site auditing. pip-installable. |
| [StJudeWasHere/seonaut](https://github.com/StJudeWasHere/seonaut) | ~624 | Go | YES | Web-based SEO audit, Docker, MySQL, ECharts dashboard |
| [PhialsBasement/LibreCrawl](https://github.com/PhialsBasement/LibreCrawl) | ~100 | Python | YES | Free SEO crawler (Screaming Frog alternative). Unlimited URLs, JS rendering. |
| [eliquid/awesome-local-seo](https://github.com/eliquid/awesome-local-seo) | ~100 | Markdown | Marginal | 200+ US citation sources, 1,000+ niche citation sites across 43 business categories |
| [healthchecks/healthchecks](https://github.com/healthchecks/healthchecks) | ~8,000 | Python/Django | YES | Cron/task monitoring with 25+ notification integrations. Good for monitoring scheduled marketing tasks. |

**Assessment:** Lighthouse via Node API is the must-have for website health scoring. `python-seo-analyzer` for lightweight crawling + citation data from `awesome-local-seo` builds a solid local SEO module without external API costs.

---

## 3. MCP Connectors & Integrations

### 3.0 MCP Registry Status

**The Anthropic MCP Registry returned zero results** for all marketing-related queries (social media, facebook, instagram, google business, reviews, marketing, twitter, linkedin, yelp, seo, content, email marketing, mailchimp, sendgrid). All marketing MCP servers must be self-hosted or connected via third-party hosting.

### 3.1 Social Media MCPs

| Server | Platforms | Type | URL |
|--------|-----------|------|-----|
| **Socialync** | TikTok, IG, YT, X, LinkedIn, FB, Threads, Bluesky | Commercial ($10/mo+) | https://www.socialync.io |
| **Ayrshare** | 13+ platforms including **Google Business Profile** | Commercial API | https://github.com/vanman2024/ayrshare-mcp |
| **BrandGhost** | Multi-platform | Commercial (beta, 1mo free) | https://mcp.brandghost.ai |
| **Metricool** | IG, FB, X, LinkedIn, TikTok, YT, Pinterest, Bluesky | Commercial (Advanced tier) | https://mcp.so/server/mcp-metricool |
| **Oktopost** | X, LinkedIn, FB | Commercial (B2B-focused) | https://developers.oktopost.com/docs/mcp |

**Single-Platform MCPs:**

| Server | Platform | URL |
|--------|----------|-----|
| Infatoshi/x-mcp | X/Twitter | https://github.com/Infatoshi/x-mcp |
| rafaljanicki/x-twitter-mcp-server | X/Twitter | https://github.com/rafaljanicki/x-twitter-mcp-server |
| southleft/linkedin-mcp | LinkedIn | https://github.com/southleft/linkedin-mcp |
| souravdasbiswas/linkedin-mcp-server | LinkedIn | https://github.com/souravdasbiswas/linkedin-mcp-server |

### 3.2 Google Business Profile MCPs

| Server | Features | URL |
|--------|----------|-----|
| **jmdurant/gbp-mcp-server** | **28 tools:** reviews (list, reply, AI replies, stats), local posts (Standard/Event/Offer/Alert), Q&A, media, insights, attributes. Most comprehensive. | https://github.com/jmdurant/gbp-mcp-server |
| satheeshds/gbp-review-agent | Reviews-only: fetch + AI response generation + automated posting | https://github.com/satheeshds/gbp-review-agent |
| Zapier GBP MCP | No-code via Zapier bridge | https://zapier.com/mcp/google-business-profile |
| Pipedream GBP MCP | Pre-built actions | https://mcp.pipedream.com/app/google_my_business |

**Assessment:** `jmdurant/gbp-mcp-server` is the most complete and directly integrable. It has mock mode for development. **Requires GBP API approval (60+ day waitlist).**

### 3.3 Review Management MCPs

| Server | Platforms | Type | URL |
|--------|-----------|------|-----|
| liemdo28/review-management-mcp | Yelp + GBP | Community | https://lobehub.com/mcp/liemdo28-review-management-mcp |
| Bright Data Yelp MCP | Yelp (read-only) | Commercial | https://brightdata.com/ai/mcp-server/yelp |
| Composio Yelp MCP | Yelp | Commercial | https://composio.dev/toolkits/yelp |

### 3.4 Email Marketing MCPs

| Server | Type | Status | URL |
|--------|------|--------|-----|
| **Klaviyo MCP** | Official | Production-ready. Works in Claude Cowork. | https://developers.klaviyo.com/en/docs/klaviyo_mcp_server |
| **ActiveCampaign MCP** | Official | Available all tiers. | https://www.activecampaign.com/platform/ai-mcp |
| Iterable MCP | Official (beta) | Enterprise cross-channel. | https://iterable.com/blog/introducing-open-source-model-context-protocol-mcp-server/ |
| SendGrid MCP | Community | 59 tools, full marketing API. | https://github.com/Garoth/sendgrid-mcp |
| Mailchimp MCP | Community | 56 tools. No official server yet despite Intuit-Anthropic partnership. | https://github.com/AgentX-ai/mailchimp-mcp |

### 3.5 Other Relevant MCPs

| Server | Type | URL |
|--------|------|-----|
| **Google Analytics MCP** | Official | https://github.com/googleanalytics/google-analytics-mcp |
| **Google Ads MCP** | Official (read-only) | https://github.com/googleads/google-ads-mcp |
| **HubSpot MCP** | Official | https://developers.hubspot.com/mcp |
| **Canva MCP** | Official | https://www.pulsemcp.com/servers/canva |
| **DataForSEO MCP** | Official | https://github.com/dataforseo/mcp-server-typescript |
| WordPress MCP | Community | https://mcpservers.org/servers/seomentor/wpmcp |
| Meta Ads MCP | Community | https://github.com/pipeboard-co/meta-ads-mcp |

### 3.6 Critical MCP Gaps

1. **No unified contractor marketing MCP** — No single server combines GBP + reviews + social + email
2. **No Yelp review RESPONSE capability** — Yelp API is read-only for reviews; responding requires browser automation
3. **No contractor lead platform integrations** — Angi, HomeAdvisor, Thumbtack have no APIs or MCPs
4. **No organic Facebook/Instagram standalone MCP** — Only available through multi-platform aggregators
5. **Google Ads official MCP is read-only** — Cannot create/modify campaigns; third-party needed for write access
6. **No BBB integration** — No API, no MCP, no scraper

---

## 4. Competitive Landscape

### 4.1 Field Service Platforms with Marketing Features

| Platform | Base Price | Marketing Price | Marketing Included? | Key Marketing Features |
|----------|-----------|----------------|---------------------|----------------------|
| **Jobber** | $29-599/mo | +$79/mo add-on | No (add-on) | Review requests, email/SMS campaigns, referral program |
| **Housecall Pro** | $59-329/mo | Tier-gated | Partial | Review requests, email campaigns, postcard neighbor marketing ($0.89-1.09/card), campaign attribution |
| **ServiceTitan** | $150-500+/mo | +$400-800/mo | No (add-on) | Call tracking with revenue attribution, email marketing, direct mail, reputation management |
| **GoHighLevel** | $97-497/mo | Included | **YES** | Full CRM, email/SMS marketing, funnel builder, call tracking, review management, social scheduling, workflow automation, AI Employee |

**Key insight:** GoHighLevel is the only platform where all marketing features are included. Everyone else gates marketing behind add-ons or premium tiers. But GHL is NOT a field service platform — it lacks scheduling, dispatching, and job management.

### 4.2 Standalone Contractor Marketing Tools

| Tool | Price | Contract | Best Feature | Biggest Weakness |
|------|-------|----------|-------------|-----------------|
| **NiceJob** | $75-125/mo | **None** | Best value: automated reviews at lowest price. 35+ FSM integrations | Reviews-only; no social, email, or listings |
| **Broadly** | $399-999/mo | None | AI receptionist (chat, SMS, phone) across tiers | Thin feature set at $399; steep pricing |
| **Podium** | $399-999+/mo | **Annual** | AI Employee "Jerry" — sub-minute lead response; ServiceTitan integration | Opaque pricing; G2: 4.6★ vs Trustpilot: 1.5★; contract traps |
| **Birdeye** | $299-449/mo/location | **Annual** | Review management across 200+ directories; competitor tracking | Per-location pricing kills multi-location businesses; 8% "Innovation Fee" at renewal |
| **Thryv** | $199-499/mo/location | 6-month | True all-in-one: CRM + marketing + payments + scheduling | **Severe reputation problems** — BBB complaints about deceptive billing, unauthorized charges, impossible cancellation |
| **Scorpion** | $10K-25K/mo | 12-24 month | RevenueMAX capacity-based ad adjustment; full-service agency | **Clients don't own their websites.** Complete vendor lock-in. $200K website builds. |
| **SOCi** | $23K-62K/year | Annual | Multi-location AI marketing automation (Genius suite) | Enterprise-only; system stability issues; too expensive for small contractors |

### 4.3 Pricing Benchmarks

**Review management only:** $75-200/mo for adequate coverage (NiceJob defines the floor)
**Social media management:** $15-100/mo DIY tools; $500-1,500/mo managed services
**Full marketing suites:** $97-499/mo (software); $1,200-2,300/mo (enterprise); $10K+/mo (agency)
**The gap:** No tool sits at $99-199/mo with reviews + social + email + local SEO + AI, no contracts, transparent pricing

### 4.4 What Contractors Actually Value (Ranked)

1. **Review/reputation management** — 86% of consumers read reviews before choosing a contractor; a single negative review costs 22% of potential business
2. **Automated lead follow-up** — 50% of construction leads are never followed up; speed-to-lead is critical
3. **Call tracking and revenue attribution** — most contractors have zero visibility into which marketing channels produce revenue
4. **FSM platform integration** — average contractor runs 11 discrete apps; only 1/3 exchange data automatically
5. **AI-powered lead response/booking** — 45% of homeowners now use AI tools to find contractors
6. **Email/SMS campaigns for repeat business** — reactivation of existing customers is highest-ROI marketing activity
7. **Local SEO and listing management** — Google AI Overviews now appear in 68% of local queries
8. **Ease of use** — construction is the second-least digitized industry globally

---

## 5. Market Gaps & Opportunities

### What Contractors Complain About

1. **Price opacity and hidden costs** — Podium, ServiceTitan, Birdeye, Scorpion all hide pricing. Actual costs often 50-100% above initial quotes after add-ons.
2. **Contract lock-in** — Annual contracts, 90-day cancellation windows, auto-renewal penalties are industry standard. Scorpion's website ownership is the extreme.
3. **Feature fragmentation** — 11 apps average, only 1/3 exchange data. Custom middleware costs $50K per connection.
4. **Tool underutilization** — Marketers use only 49% of martech stack capabilities. Contractors buy comprehensive suites but only use reviews and maybe email.
5. **AI content quality control** — AI-generated ads running with wrong images/info, no quick fix. Contractors want AI help but need quality gates.
6. **Basic features paywalled** — Jobber charges $79/mo extra for review requests. Features that should be standard are treated as premium.
7. **Poor support** — ServiceTitan Marketing Pro support takes weeks. Thryv doesn't update basic info. Billing/cancellation nightmares across the board.
8. **No ROI visibility** — Most contractors can't tell which marketing spend produces jobs.

### Where AI-Native Digital Ops Can Differentiate

1. **Capacity-aware marketing automation** — Use FSM data (Jobber, HCP, ServiceTitan) to auto-throttle campaigns based on schedule availability. Scorpion charges $10K+/mo for this concept; deliver it at $100-200/mo.

2. **Intelligent seasonal campaigns** — AI that understands seasonal patterns (fall tune-ups, spring AC prep, winter emergency) and auto-generates + deploys campaigns based on service history + geography + season. GHL requires manual setup.

3. **Revenue attribution for small contractors** — Lightweight call tracking + job source tagging + automated reporting. Price at $50-100/mo, not $400-800/mo.

4. **AI content for AI search (GEO/AEO)** — Optimize GBP posts, website content, and blogs for Google AI Overviews. 45% of homeowners already use AI to find contractors.

5. **"Set and forget" for non-marketers** — Ask 5 questions at setup, connect to FSM, handle everything autonomously with weekly reports. Construction is the 2nd-least digitized industry.

6. **Transparent, contract-free, sub-$200/mo pricing** — Every major competitor either hides pricing, requires annual contracts, or both. Monthly pricing with no hidden fees is a massive differentiator.

7. **Neighborhood intelligence** — Use completed job data to auto-target marketing to adjacent neighborhoods. Like HCP's postcard neighbor marketing but done digitally with AI optimization.

---

## 6. Recommended Architecture

### Tier 1: Must-Integrate (Core to Digital Ops)

| Component | Recommended Tool | Why |
|-----------|-----------------|-----|
| **GBP Management** | `google-api-python-client` + `jmdurant/gbp-mcp-server` | Official API + most complete MCP server. Start API approval NOW. |
| **Review Aggregation** | `lanl/yelpapi` + GBP API + scrapers for monitoring | Unified review layer across Google + Yelp |
| **Social Media Posting** | **Postiz** (31.5k stars) or **Ayrshare MCP** | Postiz for self-hosted control; Ayrshare for API simplicity |
| **Email/SMS Campaigns** | Existing Resend + Twilio stack | Already integrated in Hermes. Extend with campaign templates. |
| **Website Health** | **Lighthouse** Node API | Gold standard, programmatic, free |
| **Workflow Orchestration** | **n8n** (191k stars) or custom Hermes skills | n8n for complex multi-step flows; Hermes skills for AI-native logic |

### Tier 2: Build After Core

| Component | Recommended Tool | Why |
|-----------|-----------------|-----|
| **Content Generation** | Custom LiteLLM prompt chains | Already have the infra; build industry-specific templates |
| **Local SEO Auditing** | `python-seo-analyzer` + `awesome-local-seo` citations | Lightweight, no API costs |
| **Competitor Monitoring** | `omkarcloud/google-maps-scraper` | Track competitor reviews, ratings, GBP activity |
| **Email Marketing (advanced)** | Listmonk (21k stars) or Klaviyo MCP | Listmonk for self-hosted; Klaviyo for managed |
| **Social Media Graphics** | Canva MCP (official) | AI-generated social media visuals |

### Tier 3: Future Expansion

| Component | Recommended Tool | Why |
|-----------|-----------------|-----|
| **Paid Ads Management** | Google Ads MCP + Meta Ads MCP | Read-only analytics first; write access via third-party servers |
| **CRM Integration** | HubSpot MCP (official) | Most mature marketing MCP |
| **Advanced SEO** | DataForSEO MCP or OpenSEO | Keyword research, backlink analysis |
| **Call Tracking** | Build on Twilio voice infrastructure | Revenue attribution for small contractors |

### Proposed Pricing Position

Based on competitive analysis, Digital Ops should be priced at **$99-199/mo** with:
- No annual contracts
- No setup fees (or minimal $199 one-time)
- No per-location pricing at the small business tier
- Transparent pricing page on firmcraft.ai
- Possible fit as an add-on to the existing Operator Plans ($399-1,499/mo) or as a standalone product for contractors not yet on Hermes

This positions Firmcraft:
- **Below** Broadly ($399), Podium ($399), Birdeye ($299/location)
- **Above** NiceJob ($75-125) with significantly more features
- **Competitive with** GoHighLevel ($97-497) but AI-native and contractor-focused
- **Dramatically below** ServiceTitan Marketing Pro ($400-800 add-on) and Scorpion ($10K-25K)

### Immediate Next Steps

1. **Apply for Google Business Profile API access** — 60+ day waitlist. This is the critical path blocker.
2. **Prototype the review flywheel** — Use existing Resend + Twilio to build job-complete → SMS review request → Google review link flow
3. **Evaluate Postiz** — Docker deploy, test API and Python CLI agent for social posting integration
4. **Design the Hermes Digital Ops skill set** — Define skills for: review monitoring, review response, social posting, content generation, website audit, campaign management
5. **Build the data model** — Supabase tables for: businesses, reviews, social_posts, campaigns, content_calendar, website_audits, competitors

---

*This document should be updated as tools are evaluated and integration decisions are made.*
