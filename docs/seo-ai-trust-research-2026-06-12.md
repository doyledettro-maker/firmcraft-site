# firmcraft.ai — AI Agent Trust & SEO Research Report

**Date:** June 12, 2026
**Scope:** Marketing site (repo root, not /admin or /partner). Audited source code + live site probes + external research on GEO/AEO (Generative Engine Optimization) and SEO for the SMB AI-consulting market.

---

## TL;DR — The Ten Things That Matter, In Order

| # | Action | Why | Effort |
|---|--------|-----|--------|
| 1 | Fix the broken trust pages: `/terms`, `/privacy`, `/trust` footer links **404 on the live site** | Instant trust-killer for AI agents and humans; wasted crawler fetches | 2–4 hrs |
| 2 | Add `app/robots.ts` with explicit AI-crawler allows + sitemap reference | Origin has no robots.txt; Cloudflare injects boilerplate with **no sitemap line and no rules** | 30 min |
| 3 | Add JSON-LD structured data (Organization/ProfessionalService, Service, FAQPage, Person) — there is currently **none anywhere on the site** | Entity disambiguation for AI + Google; cheap, foundational | half day |
| 4 | Give `/playbooks` and `/integrations` real metadata — both serve the **duplicate root `<title>`** because `'use client'` pages can't export metadata (CORRECTION: their content IS server-rendered and visible to crawlers; an earlier grep used the wrong search string) | Duplicate titles/descriptions on the site's best long-tail pages | half day |
| 5 | Add OG image + favicon (both currently 404) | Every link share and AI-surfaced citation currently renders blank | 2 hrs |
| 6 | Publish the tree-service case study with real numbers | The single most citable, linkable, differentiating asset you can produce | 1–2 days |
| 7 | Google Business Profile (Springfield IL service-area business) + Bing Webmaster Tools + free directory listings (Clutch, UpCity, GoodFirms, DesignRush) | ~87% of ChatGPT-Search citations match Bing top results; Clutch pages dominate "AI consultants" SERPs | 1 day setup |
| 8 | Springfield IL location page (you have zero Springfield presence despite the 217 phone number) + strengthen Houston | Springfield is winnable in 60–90 days with near-zero competition | 1 day |
| 9 | Comparison/cost content: "AI receptionist vs. hiring," "AI employee for [trade]," honest listicle | Comparative listicles = 32.5% of all AI citations; tables cited ~2.5× more | ongoing |
| 10 | llms.txt + AI-traffic measurement (GA4 referrers + server-log bot audit) | llms.txt is cheap but near-zero measured payoff — do it last, expect nothing | 1 hr |

**Good news from the audit:** AI bot access is currently fine (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot all get HTTP 200), all the core marketing pages are server-rendered with real per-page metadata, the Houston page is genuinely well-targeted, and the copy already contains strong differentiated trust signals (CPA credential, fixed-fee pricing published, sovereignty posture, security FAQ). The foundation is better than most small-firm sites; the gaps are specific and fixable.

---

# Part 0 — Current State Audit

## What exists

- **Stack:** Next.js 14 App Router on Vercel, fronted by Cloudflare proxy (`server: cloudflare`, `x-vercel-id` present).
- **Pages:** Home, Services, Pricing, Managed-AI (Operator), Methodology, About, Contact, Security, Integrations, Houston, Playbooks, Support, Get-Started, Onboard.
- **Metadata:** Root layout sets title, description, `metadataBase`, OG, Twitter card. Most pages export per-page `metadata`. Houston has a canonical + full OG block.
- **Sitemap:** `app/sitemap.ts` covers 12 routes with priorities.
- **Rendering:** All key pages are server components **except** `/integrations` and `/playbooks` (`'use client'`).
- **Trust copy:** CPA + ERP credential, published pricing ($399–$1,499/mo Operator; $4.5k–$8.5k Assessment; $25k+ Build), security page with FAQ, methodology, named founder with photo, no-fit-no-bill guarantee, four named early customers (dental, tree-removal, ERP consultant, payments firm).

## What's broken or missing (verified live, 2026-06-12)

| Item | Status | Evidence |
|------|--------|----------|
| `/terms`, `/privacy`, `/trust` | **404** — but linked from the footer on every page | `curl` → 404 on all three |
| robots.txt | No origin file; Cloudflare serves its "content signals" boilerplate — **comments only, no User-agent rules, no signal values set, no `Sitemap:` line** | live fetch |
| JSON-LD / schema.org | **Zero** structured data anywhere in `src/` | grep for `ld+json`, `schema.org` |
| llms.txt | 404 | live fetch |
| favicon.ico | 404 | live fetch |
| OG image | None — `twitter.card: summary_large_image` is declared but **no image exists**; `public/` contains only `email-logo.png` and a founder photo | code + live |
| `/playbooks` metadata | Duplicate root-layout `<title>` — `'use client'` page can't export metadata. (Content itself IS in the SSR HTML; an earlier grep for "COI on demand" failed only because the literal string is "Certificate of Insurance on demand") | curl + grep |
| `/integrations` metadata | Same duplicate-`<title>` problem; tool list IS server-rendered | curl + grep |
| `/contact` in sitemap | Missing — page exists and returns 200 but isn't in `sitemap.ts` | code |
| sitemap `lastModified` | `new Date()` on every request — every page claims it changed today, every day. Google ignores `lastmod` when it's provably wrong | code + live (`lastmod` = fetch timestamp) |
| Springfield IL | **Zero mentions anywhere on the site** despite the (217) phone number and that being home base | Explore audit |
| Blog / articles / case studies | None | Explore audit |
| Google Search Console / Bing Webmaster | Unknown — verify both are set up and the sitemap is submitted | action item |

---

# Part 1 — AI Agent Trust (GEO/AEO)

## 1.1 How AI assistants actually pick and recommend service providers

The mechanics matter because they dictate where to spend effort:

1. **Two pipelines:** (a) *training crawls* (GPTBot, ClaudeBot) shape what models "know" about Firmcraft unprompted; (b) *live retrieval* (OAI-SearchBot/ChatGPT-User, Claude-SearchBot/Claude-User, PerplexityBot/Perplexity-User) powers what they cite when a user asks "who can help my small business implement AI?" For recommendation queries, **live retrieval dominates**.
2. **Each assistant rides a search index:** ChatGPT → Bing + OpenAI's own index; Copilot → Bing; Claude → Brave Search; Perplexity → own index; Gemini/AI Overviews → Google. Seer Interactive found **87% of SearchGPT citations match Bing's top results**, and page-1 Google ranking correlates ~0.65 with LLM brand mentions. **Conclusion: traditional SEO ranking on Google *and Bing* largely determines AI citation.** Bing Webmaster Tools is the cheapest unworked lever.
3. **What gets cited:** A 30M-citation study found **comparative listicles lead at 32.5% of AI citations**; content with **tables is cited ~2.5× more** than prose. Top-cited domains for B2B vendor queries: Reddit, LinkedIn, G2, Clutch, Wikipedia, editorial listicles. When a user asks "best AI consultant for SMBs," the assistant typically retrieves 5–10 listicle/directory pages and synthesizes from them. **Being ON those third-party pages matters more than anything on firmcraft.ai itself.** Your own site's job is (a) to rank for the query directly and (b) to confirm and enrich the entity once the model finds you elsewhere.
4. **No major AI crawler executes JavaScript.** Vercel's own study of ~1.3B AI-crawler fetches confirmed GPTBot, ClaudeBot, and PerplexityBot fetch JS files but never render them. Anything client-rendered does not exist to them. (Note: Next.js `'use client'` pages are still server-rendered on first load, so the playbooks/integrations content IS crawler-visible — the rule matters for content that only appears after client-side interaction or data fetching.)

## 1.2 Bot access — current state: OK, but lock it in

Live probes: GPTBot, OAI-SearchBot, ClaudeBot, and PerplexityBot all currently receive **200** on the homepage. But the site sits behind Cloudflare, which **blocks AI crawlers by default for newly onboarded zones since July 2025**, and Vercel has an "AI Bots Managed Ruleset" that can deny them. Action items:

- In Cloudflare: Security → Bots → confirm AI crawler blocking / Pay-Per-Crawl is **off** (or explicitly allows retrieval bots) for the firmcraft.ai zone. The injected "content signals" robots.txt is a symptom of Cloudflare's managed robots.txt feature being on with no signals configured.
- In Vercel: project Firewall → confirm the AI Bots ruleset is not in deny mode.
- Ship an explicit `app/robots.ts` so the origin controls the file (Cloudflare prepends its block but your rules + sitemap line will be served):

```ts
// src/app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/get-started', '/onboard'],
      },
      // Explicitly welcome AI retrieval + training crawlers.
      // For a services firm, the content IS marketing — allow training
      // so models know the brand unprompted.
      ...[
        'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
        'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai',
        'PerplexityBot', 'Perplexity-User',
        'Google-Extended', 'Bingbot', 'Applebot-Extended',
      ].map((ua) => ({ userAgent: ua, allow: '/' as const })),
    ],
    sitemap: 'https://firmcraft.ai/sitemap.xml',
  }
}
```

(`/get-started` is token-gated and `/api/` is form plumbing — no reason to spend crawl budget there. Keep `/contact` crawlable; it carries NAP data.)

## 1.3 Structured data — the entire layer is missing

No JSON-LD exists on the site. LLM crawlers ingest JSON-LD as text, and the retrieval layers built on Google/Bing inherit those engines' structured-data understanding (both confirmed in 2025 that structured data feeds their generative features). Schema won't *cause* citations by itself, but it disambiguates the entity ("Firmcraft = this LinkedIn page = this Clutch profile = this phone number = serves these areas") and makes extraction trivial.

Recommended implementation — one shared component, rendered from the **root layout** (Organization) plus per-page blocks:

```tsx
// src/components/JsonLd.tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

```tsx
// in src/app/layout.tsx (inside <body>)
<JsonLd
  data={{
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService', // subclass of LocalBusiness + Organization
    '@id': 'https://firmcraft.ai/#org',
    name: 'Firmcraft',
    url: 'https://firmcraft.ai',
    logo: 'https://firmcraft.ai/og-logo.png',
    description:
      'Firmcraft is an AI consulting firm for small and mid-sized businesses. ' +
      'AI readiness assessment, fixed-fee implementation, ERP integration, and ' +
      'a managed AI operator (Firmcraft Operator) that runs in Slack or Teams.',
    telephone: '+1-217-303-8319',
    email: 'hello@firmcraft.ai',
    founder: {
      '@type': 'Person',
      name: 'Doyle Dettro',
      jobTitle: 'Founder & Principal',
      description: 'CPA and Microsoft Dynamics 365 Business Central consultant',
      sameAs: ['https://www.linkedin.com/in/<doyle-profile>'],
      knowsAbout: [
        'AI implementation', 'Microsoft Dynamics 365 Business Central',
        'ERP consulting', 'accounting', 'LLM evaluation',
      ],
    },
    areaServed: [
      { '@type': 'City', name: 'Springfield', containedInPlace: { '@type': 'State', name: 'Illinois' } },
      { '@type': 'City', name: 'Houston', containedInPlace: { '@type': 'State', name: 'Texas' } },
      { '@type': 'Country', name: 'United States' },
    ],
    knowsAbout: [
      'AI consulting for small business', 'AI implementation', 'managed AI services',
      'ERP integration', 'AI receptionist', 'workflow automation', 'AI agents',
    ],
    sameAs: [
      'https://www.linkedin.com/company/<firmcraft>',
      // add as created: Clutch profile, Crunchbase, X, Wikidata Q-ID
    ],
    priceRange: '$399 - $60,000+',
  }}
/>
```

Per-page additions:
- **`/services`, `/managed-ai`, `/houston`:** `Service` blocks (`serviceType`, `provider: {'@id': 'https://firmcraft.ai/#org'}`, `areaServed`, `offers` with the published prices — you already publish pricing, which most firms hide; put it in schema too).
- **`/pricing`, `/security`, `/support`:** `FAQPage` — these pages already have real Q&A sections ("What buyers ask before they sign," "Questions partners ask"). Google killed the FAQ *rich result* (fully deprecated May 2026), but the markup remains valid and the visible Q&A format is among the most extractable for answer engines. Mark up what's already there.
- **`/about`:** standalone `Person` for Doyle with `sameAs` → LinkedIn.
- **`/houston` (and future Springfield page):** `LocalBusiness`/`ProfessionalService` with `areaServed` for the metro and trade-specific `makesOffer`.

## 1.4 Entity clarity — say what Firmcraft is, in one extractable sentence

Models echo canonical self-descriptions. The site's copy is excellent *positioning* writing ("Big consulting firms won't touch you...") but never states the plain entity definition an LLM can lift. Nowhere does the HTML say:

> "Firmcraft is an AI consulting firm based in Springfield, Illinois, serving small and mid-sized businesses in central Illinois, Houston, and nationwide. We provide AI readiness assessments, fixed-fee AI implementation, ERP integration (Microsoft Business Central, NetSuite, Acumatica), and Firmcraft Operator — a managed AI employee starting at $399/month."

Add a version of this verbatim in three places: a short paragraph on the homepage (e.g., above the footer), the About page opening, and the footer itself. Boring on purpose — it's the sentence you want ChatGPT to repeat. Keep the brand voice everywhere else.

Also resolve the **ICP tension for machines**: the homepage targets "$10M–$500M revenue finance/ops SMBs running ERPs" while Houston/Operator target 5-person trade shops. Humans navigate this; an LLM summarizing the homepage will describe you as a mid-market ERP consultancy and may *not* surface you for "AI for my small contracting business." The entity definition should explicitly span both tracks ("from owner-operated trades to mid-market ERP shops").

## 1.5 What makes content citable (evidence-backed tactics)

From the Princeton GEO paper (Aggarwal et al., KDD 2024 — the most rigorous study in this space): adding **statistics, quotable claims, and cited sources** each improved generative-engine visibility 30–40%; keyword stuffing *hurt*. Combined with the citation-share data:

1. **Self-contained answer blocks.** Lead sections with a 1–3 sentence direct answer; question-style H2s; one idea per passage. The methodology and security pages are already close to this.
2. **Tables.** Cited ~2.5× more. The Houston page's "replaces five subscriptions" comparison and the managed-AI "vs. ChatGPT Teams / Copilot" table are exactly right — make sure they're real `<table>` HTML, not styled divs, and add more (pricing comparison vs. hiring, Operator plan matrix).
3. **First-party numbers.** "Our AI receptionist answered X% of after-hours calls for a Houston-area tree service, recovering ~$Y/month in missed jobs" is the kind of statistic that gets quoted. You have real deployment data (Rumble Bee, dental practice) — publish anonymized stats.
4. **Comparison pages.** "AI receptionist vs. answering service vs. hiring a receptionist" with a cost table. The #1 cited format.
5. **FAQ content** (visible, marked up) on every service page.

## 1.6 Third-party footprint — the highest-leverage GEO work isn't on your site

For "recommend me a vendor" queries, assistants synthesize from directories, listicles, review sites, and communities. Ranked by effort/return for Firmcraft:

1. **Clutch** — free listing; dominates "AI consultants" SERPs and frequently tops ChatGPT citations for service-provider queries. One verified client review (Mike Carr) makes the profile credible. Clutch has city-level pages; their Houston AI page is thin and there's no Springfield page — easy visibility.
2. **Google Business Profile** (see Local SEO) — feeds Gemini/AI Overviews directly.
3. **LinkedIn** — company page + founder posting. LinkedIn is a top-5 cited domain for B2B queries. Doyle posting case-study content monthly beats any directory.
4. **UpCity, GoodFirms, DesignRush** — free tiers, DR-70+ links, occupy listicle SERPs.
5. **Wikidata** — a Q-ID is attainable (Wikipedia is not — don't try; a consultancy this size won't clear notability). Reference it in `sameAs`.
6. **Reddit** — genuine participation in r/smallbusiness, r/sweatystartup, trade subreddits. Reddit is the #1 or #2 cited domain across assistants (volatile, but persistently large). Answer "should I get an AI receptionist?" threads honestly.
7. **Listicle inclusion** — pitch the 5–10 "best AI consultants for small business" articles that currently get cited (find them by asking ChatGPT/Perplexity the money questions and noting sources — see §1.8).

## 1.7 llms.txt — do it, expect nothing

Reality check: across 500M+ logged AI-bot visits in a 90-day 2026 study, only ~408 requests targeted llms.txt. No lab has committed to it; Google's John Mueller compares it to the keywords meta tag. It's 30 minutes and zero risk, so ship one for the marginal cases (some Perplexity retrieval workflows, agent tooling), but it is **not** a strategy:

```
# public/llms.txt
# Firmcraft

> Firmcraft is an AI consulting firm for small and mid-sized businesses,
> based in Springfield, Illinois, serving central Illinois, Houston TX, and
> US clients remotely. Services: AI readiness assessment (fixed-fee,
> $4.5k–$8.5k), AI implementation and ERP integration (Microsoft Business
> Central, NetSuite, Acumatica), managed AI operations, and Firmcraft
> Operator — a managed AI employee in Slack/Teams from $399/month.
> Founded by Doyle Dettro, CPA and ERP consultant. Sovereign by default:
> open-source Hermes foundation, client data stays in client environments.

## Services
- [Services overview](https://firmcraft.ai/services): Assess, Build, Operate, Advisory
- [Firmcraft Operator](https://firmcraft.ai/managed-ai): managed AI employee, $399–$1,499/mo
- [Pricing](https://firmcraft.ai/pricing): all prices published
- [Houston contractors](https://firmcraft.ai/houston): AI office manager for HVAC, plumbing, electrical, tree care

## Trust
- [Security & sovereignty](https://firmcraft.ai/security)
- [Methodology](https://firmcraft.ai/methodology)
- [About / founder](https://firmcraft.ai/about)

## Contact
- Email: hello@firmcraft.ai · Phone: (217) 303-8319
```

## 1.8 Measurement

- **GA4:** segment on referrers `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`. (AI answers often produce no click — this undercounts influence.)
- **Server/edge logs:** the real crawl-coverage check. Cloudflare's analytics show bot user-agents; grep for GPTBot/OAI-SearchBot/ClaudeBot/PerplexityBot hits monthly.
- **Monthly prompt panel (free, 20 min):** ask ChatGPT, Claude, Perplexity, and Gemini the money questions — "best AI consulting firm for a small business," "who can set up an AI receptionist for my HVAC company in Houston," "AI consultant Springfield Illinois" — log whether Firmcraft is named and **which sources each assistant cites**. Then go win placement on those exact sources. Paid alternative: Otterly.ai ($29/mo) or Ahrefs Brand Radar.

---

# Part 2 — SEO

## 2.1 Keyword strategy — skip the head terms, own the product × trade × city long tail

The generic "AI consulting" SERP is dominated by directories and 12,000+ agencies' self-ranking listicles. The demand worth chasing, by intent tier:

**Tier A — buyer intent, winnable now:**
- **"AI receptionist" / "AI answering service for contractors"** — hottest SMB AI cluster of 2025–26; contractors miss 60–80% of calls (cited revenue loss $45k–$120k/yr — use this stat). Maps directly to the voice agent. "[product] for [trade]" long-tails ("AI answering service for tree service companies") have tiny volume but near-100% buyer intent and almost no competition.
- **"AI employee"** — now a recognized SMB category (GoHighLevel popularized it; agencies white-label at $200–$600/mo — exactly Operator's space). "AI employee for [trade/city]" is open. The Houston page already uses this language; extend it.
- **"hire AI consultant," "AI consulting for small business," "AI consultant near me"** — decision-stage modifiers; local B2B SERPs are thin because B2B firms ignore local SEO.

**Tier B — rank by being IN the listicles, not outranking them:** "AI automation agency," "managed AI services" (currently skews enterprise/MSP — always pair with "for small business").

**Tier C — informational ("what is AI automation"):** only as citation bait, not lead-gen. Informational queries are migrating to AI assistants fastest.

**Validated niche:** a real, content-thin micro-SERP exists for "AI for tree service" (occupied by software vendors — Zentive, QuoteIQ — none with a done-for-you offer or a real case study). Firmcraft can own it.

## 2.2 Content roadmap (in build order)

1. **Tree-service case study** (`/case-studies/tree-service` or `/work/...`). Real numbers: calls answered, hours saved, dollars recovered, the FileMaker REST-shim story (already teased on /integrations). This single asset feeds: the case-studies page, the Springfield location page, the "AI for tree care" hub, Clutch review context, LinkedIn posts, podcast pitches, and AI citations. Highest-leverage content on this list.
2. **"AI for [trade]" hub pages** — tree care first, then HVAC, plumbing, electrical (Houston trades). Pain → what the AI actually does → realistic cost table → case study → FAQ (marked up) → CTA.
3. **Comparison/cost pages:** "AI receptionist vs. hiring a receptionist: the real math" (~$199/mo vs ~$35k+/yr); "AI employee vs. virtual assistant"; "How much does AI implementation cost for a small business?" (you already publish pricing — turn it into the article every competitor is afraid to write).
4. **ROI calculator** (missed calls × close rate × average ticket = lost revenue/mo). You already built a PricingCalculator for Houston — generalize it. Interactive, linkable, feeds sales calls. **Caveat:** render the surrounding explanation + a static default-scenario table server-side so crawlers get the numbers.
5. **Honest listicle:** "Best AI answering services for contractors (2026)" — include Smith.ai, Ruby, etc., rank honestly, feature yourself with the differentiator (done-for-you + whole-office, not just phones). This format owns the SERP and earns AI citations.
6. **A blog exists structurally** (`/blog` or `/guides` route group) so future content has a home and the sitemap grows. No blog or content hub exists today.

## 2.3 Local SEO — Springfield IL + Houston TX

**The asymmetry is the strategy.** Springfield (~115k metro): you can plausibly be the *only* AI consultancy with a GBP, chamber membership, and a local case study — winnable in 60–90 days. Houston: contested head terms; enter via trade × city long-tails only.

1. **Google Business Profile — Springfield, as a Service-Area Business.** Choose "I deliver services to my customers," **hide the address** (Chatham home address as the hidden verified address; showing a home address is a top suspension trigger; never a PO box/virtual office). Service area: Springfield metro + Sangamon County. Expect video verification in 2026 (business documents, branded materials). Categories: "Business management consultant" / "Computer consultant" — review available categories for the closest AI/automation fit.
2. **No Houston GBP** until there's a real Houston operating location with genuine operations — faking one risks suspension of everything. Houston presence = the `/houston` page (already good) + citations + directories.
3. **Two location pages, genuinely unique — not a doorway-page template farm:**
   - `/ai-consulting-springfield-il` — local client story (tree service), Springfield industry mix (state government, healthcare, ag, trades), in-person availability, local FAQs, `ProfessionalService` schema with `areaServed`.
   - Keep `/houston` (it's already the model for what these should look like) and consider an `/ai-consulting-houston-tx` alias or expanding /houston with consulting-track content; **do not** spawn suburb pages.
   - **Cross-link them from the footer** — currently /houston isn't in the header or footer nav at all; it's only reachable via sitemap.
4. **Citations:** consistent NAP (Firmcraft / hidden Chatham address / (217) 303-8319) across GBP, Bing Places, Apple Business Connect, Yelp, chamber directories.
5. **Reviews are the #1 service-area-business ranking lever.** Get a Google review from every client, starting with Mike Carr; ask reviewers to mention the service and city. With 3–5 reviews you can own the Springfield map pack.
6. **Springfield press:** SJ-R / Springfield Business Journal — "local CPA-turned-AI-consultant automates tree service company" is a real local-interest story = link + authority + GBP signal.

## 2.4 Authority & backlinks for a young domain (priority order)

1. **Free directory tier, week one:** Clutch, UpCity, GoodFirms, DesignRush (+ FindBestFirms). DR-70+ links and they occupy the listicle SERPs. Skip paid sponsorships.
2. **Chambers:** Greater Springfield Chamber (gscc.org — indexable member directory link); in Houston pick an affordable one (e.g., Houston West ~$500/yr) over the Greater Houston Partnership.
3. **HARO successors (~30 min/wk):** Featured.com (relaunched HARO, free, Apr 2025), Qwoted, Source of Sources, SourceBottle. Doyle's profile — "CPA who deploys AI agents for blue-collar SMBs" — is genuinely uncommon and quotable.
4. **TCIA (Tree Care Industry Association):** Corporate Member program with searchable supplier directory + TCI Buyers' Guide — niche link + direct pipeline into the exact vertical of your first case study. Later: ACCA (HVAC), PHCC (plumbing) as verticals expand.
5. **Podcast guesting:** trade-business podcasts want AI guests badly; each = link + exact-ICP audience.
6. **Original data (later, at 3+ clients):** anonymized Hermes deployment stats ("AI receptionists answered X% of after-hours calls across our field-service clients") — citable by every "SMB AI adoption" roundup and by AI assistants.

## 2.5 Technical SEO fixes (specific to this codebase)

### P0 — broken things

1. **Create `/terms`, `/privacy`, `/trust` pages** (or remove the footer links until they exist). Every page on the site links to three 404s. Privacy policy absence also blocks GBP verification and directory listings, and AI crawlers waste fetches on 404s (GPTBot burns 34% of fetches on 404s per Vercel's study). A `/trust` page can simply redirect to `/security` for now.
2. **`app/robots.ts`** — see §1.2.
3. **Favicon + OG image.** Add `src/app/icon.png` (Next file convention) and a default `src/app/opengraph-image.png` (1200×630) — or use the `opengraph-image.tsx` ImageResponse convention for branded cards. Right now every Slack/LinkedIn/iMessage share of firmcraft.ai renders with no image, and `summary_large_image` is declared with nothing behind it.

### P1 — rendering & metadata

4. **Refactor `/playbooks` and `/integrations`** — split into a server `page.tsx` that exports metadata + canonical and a client child component. (CORRECTION to the original finding: the lists are already in the SSR HTML; the refactor fixes the duplicate titles/descriptions, not invisibility.)

```tsx
// playbooks/page.tsx — server component
import type { Metadata } from 'next'
import { PLAYBOOKS } from './data'        // move the array out of the client file
import { PlaybookExplorer } from './PlaybookExplorer' // 'use client' — receives data as props

export const metadata: Metadata = {
  title: 'AI Playbooks for SMBs — 40 live automations | Firmcraft',
  description:
    '40 production AI playbooks for trades, healthcare, professional firms, and B2B: COI on demand, insurance claim submission, invoice chase, dispatch, and more.',
  alternates: { canonical: '/playbooks' },
}

export default function PlaybooksPage() {
  return (
    <>
      {/* server-rendered: every playbook name + description in HTML */}
      <PlaybookExplorer playbooks={PLAYBOOKS} />
      <noscript>{/* or render a plain <ul> fallback list above the explorer */}</noscript>
    </>
  )
}
```

   Better still: render the full categorized list as plain server HTML *below* the interactive explorer (crawlers read it, users use the explorer). Each playbook name is a long-tail query someone types ("AI certificate of insurance automation," "AI insurance claim submission dental"). Forty invisible playbooks = forty invisible landing-page opportunities. Same treatment for the 112-tool integrations list ("Eaglesoft AI integration" has real search demand from dental offices).

5. **Consider `/playbooks/[slug]` detail pages** (later): each playbook as its own URL with `HowTo`/`Service` schema. This turns the playbook library into the site's long-tail engine.

6. **Fix `sitemap.ts`:** add `/contact`; replace `lastModified: new Date()` with real per-route dates (hardcode and bump on deploy, or derive from git):

```ts
const ROUTES = [
  { path: '/', priority: 1, lastModified: '2026-06-01' },
  { path: '/contact', priority: 0.6, lastModified: '2026-05-15' },
  // ...
]
```

7. **Homepage `metadata` export:** add an explicit one with `alternates: { canonical: '/' }`. Add canonicals to all pages (only Houston has one). Cheap insurance against query-param duplicates (`?utm_…`).

8. **Title pattern:** switch root layout to a template so per-page titles stay clean:

```ts
title: {
  default: 'Firmcraft — AI Consulting & Managed AI for Small Business',
  template: '%s | Firmcraft',
},
```

   Note the default title rewrite: the current one ("AI implementation, integration, and enablement for SMBs") contains zero phrases buyers type. "AI consulting," "small business," and "managed AI" are the queries; "enablement" and "SMBs" are not. Apply the same lens to per-page titles — e.g. `Services` → "AI Consulting Services for Small Business — Assessment, Implementation, Managed AI".

### P2 — hygiene

9. **Core Web Vitals:** the site is mostly static server components on Vercel — LCP/CLS/INP should pass easily. Verify in PageSpeed Insights after the playbooks/integrations refactor (those pages currently ship the full data + filter logic as client JS). Targets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1. Check font loading: three font families (Geist, JetBrains Mono, Source Serif 4) — `display: swap` is set, good; consider subsetting if LCP suffers.
10. **Google Search Console + Bing Webmaster Tools:** verify both, submit the sitemap to both. Bing is disproportionately important (ChatGPT + Copilot). Use GSC's URL inspection to confirm /houston and the future location pages are indexed.
11. **Internal linking:** /houston, /playbooks, /integrations, /security are orphaned from the header nav (footer covers some). Add a "Houston" or "Locations" link in the footer Practice column; link the Houston page from /managed-ai ("serving Houston trades →") and vice versa.

---

# Ranked Action Plan

## Week 1 — fix what's broken (≈2 days of work)
| Task | Files |
|------|-------|
| Create /privacy, /terms; redirect /trust → /security | `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `next.config.mjs` |
| `app/robots.ts` with AI-crawler allows + sitemap | `src/app/robots.ts` |
| Favicon + default OG image | `src/app/icon.png`, `src/app/opengraph-image.png` |
| Organization JSON-LD in root layout; FAQPage on /pricing + /security; Service on /services + /managed-ai + /houston | `src/components/JsonLd.tsx` + layouts/pages |
| Fix sitemap (add /contact, real lastModified) + canonicals + title template | `src/app/sitemap.ts`, `src/app/layout.tsx`, page metadata |
| Entity-definition paragraph (home, about, footer) | copy edit |
| Verify Cloudflare + Vercel bot settings; GSC + Bing Webmaster setup + sitemap submission | dashboards |
| llms.txt | `public/llms.txt` |

## Weeks 2–3 — make the invisible visible (≈3 days)
- Server-render /playbooks and /integrations with proper metadata (P1 #4).
- Publish the tree-service case study.
- GBP (Springfield SAB) + Bing Places + Apple Business Connect; first Google review (Mike Carr).
- Free directory listings: Clutch (+ client review), UpCity, GoodFirms, DesignRush.
- LinkedIn company page polished; founder posts the case study.

## Month 2 — local + content engine
- Springfield location page; footer/internal links to both location pages.
- "AI receptionist vs. hiring a receptionist" comparison (with table).
- "AI for tree services" hub page.
- Join Greater Springfield Chamber; pitch SJ-R/Springfield Business Journal.
- Start Featured/Qwoted/SoS responses (30 min/wk).
- Set up GA4 AI-referrer segment + first monthly prompt panel.

## Month 3+ — compounding
- One trade hub per month (HVAC → plumbing → electrical, Houston-flavored).
- Generalized ROI calculator with server-rendered default scenario.
- Honest listicle ("Best AI answering services for contractors 2026").
- 2–3 trade-podcast pitches; evaluate TCIA corporate membership.
- /playbooks/[slug] detail pages.
- A Google review per client, every client.
- Re-run the prompt panel monthly; chase placement on whatever sources the assistants cite.

---

## Evidence quality notes

- **Strong evidence:** AI crawlers don't execute JS (Vercel, ~1.3B fetches); SEO-rank ↔ AI-citation correlation (Seer: 87% SearchGPT/Bing overlap; ~0.65 Google-rank correlation); listicle/table citation dominance (30M-citation study); Princeton GEO tactics (+30–40% for stats/quotes/citations); Cloudflare default AI-bot blocking since July 2025; Google FAQ rich-result deprecation (May 2026); llms.txt near-zero fetch rates.
- **Directional / vendor-sourced:** schema "20–30% more AI-summary appearances," AI-referral conversion quality, exact keyword volumes.
- **Hype to ignore:** llms.txt as a visibility lever; any "guaranteed AI ranking" service; mass suburb/location page generation.

## Key sources
- Princeton GEO paper: arxiv.org/abs/2311.09735 · llms.txt spec: llmstxt.org · llms.txt adoption: presenc.ai/research/state-of-llms-txt-2026
- Vercel AI crawler study: vercel.com/blog/the-rise-of-the-ai-crawler · Vercel bot management: vercel.com/docs/bot-management
- Seer 87% Bing overlap: seerinteractive.com/insights/87-percent-of-searchgpt-citations-match-bings-top-results · Rank↔mention correlation: searchengineland.com/google-search-rankings-llm-mentions-450348
- Citation-format study: searchengineland.com/ai-search-engines-cite-reddit-youtube-and-linkedin-most-study-473138 · B2B citation domains: higoodie.com/blog/most-cited-b2b-saas-domains-in-ai-search/
- Cloudflare default block: cloudflare.com/press/press-releases/2025 · Crawler roster: momenticmarketing.com/blog/ai-search-crawlers-bots
- FAQ deprecation: searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/ · Schema for AI: searchengineland.com/schema-markup-ai-search-no-hype-472339
- SAB/GBP rules: support.google.com/business/answer/3038177 · localfalcon.com/blog/how-to-set-up-google-business-profile-for-servicearea-businesses
- Doorway-page risk: searchengineland.com/guide/service-area-pages · HARO successors: backlinko.com/haro-alternatives
- Directories: clutch.co/consulting/ai · TCIA: tcia.org corporate listing · Contractor AI-receptionist market: leadtruffle.co, callbirdai.com, getnextphone.com
