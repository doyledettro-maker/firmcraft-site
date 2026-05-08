# Handoff: Firmcraft Marketing Site

## Overview

A five-page marketing website for **Firmcraft**, an AI operator (think "an employee, not a chatbot") for small professional-services firms — dental, legal, accounting, trades, payments, B2B. Firmcraft is a product spinout of SkillCalibrate Co. and shares a parent brand but addresses the sub-50-seat market that SkillCalibrate's enterprise platform doesn't fit.

The site exists to do three jobs:

1. Establish that Firmcraft is **not "AI for SMBs" template slop** — the founder's voice, the product depth, and the visual identity all push hard against that category.
2. Convert skeptical owner-operators (dentists, partners, contractors) by showing concrete playbooks, real integrations, and a credible security posture.
3. Position cleanly against ChatGPT Teams / Microsoft Copilot ("a chatbot vs. an operator"), and against hiring/outsourcing ("an employee that compounds").

The five pages were designed in this order, and the homepage is built to push visitors deeper into the supporting pages as objections arise.

## About the design files

The HTML files in this bundle are **design references**, not production code. They are static, single-file prototypes (inlined CSS, no build step) showing intended look, copy, layout, interactions, and information architecture.

**Your task is to recreate these designs in the target codebase's environment** — React/Next.js, Astro, Rails + Tailwind, etc. — using its established components, design tokens, and patterns. If no marketing-site environment exists yet, pick the most appropriate framework for the project (Astro and Next.js are both excellent fits for a content-led marketing site like this; Astro has a slight edge for pure marketing pages).

Do not ship the raw HTML. The files are presentational — they don't have analytics, SEO meta, OG images, sitemap, robots.txt, accessibility audits, image optimization, or i18n hooks. Treat them as the visual + IA spec, not the artifact.

## Fidelity

**High-fidelity.** Final color palette, type system, spacing rhythm, copy, and interaction patterns. Recreate pixel-perfectly using the codebase's libraries and conventions. The design tokens and component patterns documented below are the source of truth.

The only exceptions where lofi judgment applies:
- Real customer logos in the proof strip (currently hand-drawn placeholders) — replace with actual customer logos when permission is in.
- Founder photo in the founder card — currently CSS placeholder with initials.
- Stock numbers in stats blocks (e.g. "112 integrations", "40 playbooks") — verify against the live product before launch.

## Pages / Views

The five pages, with each one's role in the funnel:

### 1. `01_home.html` — Home

**Purpose:** Top-of-funnel. Convert a cold visitor (introduced via founder-led outreach, podcast, or referral) into a "book a 20-minute call" lead.

**Layout, top to bottom:**
1. **Sticky nav** — brand mark + 5 links (How it works, Pricing, Playbooks, Capabilities, Security, Integrations, Who it's for) + ghost "Login" + primary "Book a call" CTA.
2. **Hero** — Two-column. Left: eyebrow tag, big serif headline ("Your firm runs on chat threads, sticky notes, and one overworked human.") + ledе + dual CTA. Right: "live chat" prototype showing the operator handling a tree-removal job, rotating through 3 industries (dental, marketing, accounting) on a 6-second timer with stage indicator dots. Background has soft radial gradients (terracotta + sage).
3. **Trust bar** — "Trusted by 30+ firms across 5 industries" + 6 monochrome customer-name placeholder logos.
4. **Problem section** ("The five walls every small firm hits") — five cards with serif numerals and short prose.
5. **How it works** — 3-step horizontal flow: Day 1 / Week 1 / Week 4. Each step is a card with eyebrow date, serif heading, body copy, and a dashed-bordered visual representation.
6. **Capabilities teaser** — 6 tiles, each links to `03_capabilities.html`. Tiles: Lives anywhere your team messages · Runs on a schedule · Runs on events · Connects to any API · Remembers across sessions · Approves before it acts.
7. **Industries** — 5 industry cards (Trades · Healthcare · Solo · Pro firms · B2B), each with a one-line scenario and a "see playbooks" link.
8. **Pricing** — Three-tier (Solo $400, Practice $1,200, Firm $2,800) flat-monthly, all-seats-included pricing.
9. **vs ChatGPT** — comparison table.
10. **Founder note** — A dense, voice-y founder note with photo placeholder + signature.
11. **CTA section** — "Book a 20-min call" with Calendly-style placeholder.
12. **Footer** — minimal, parent brand reference.

### 2. `02_playbooks.html` — Playbooks library

**Purpose:** Mid-funnel. Address the "but does it actually do *my* job?" objection by listing 40 named, specific playbooks across 6 industry categories.

**Layout:**
1. Nav (current page indicator on "Playbooks").
2. Hero — eyebrow ("Vol. 01 · Spring 2026"), big italic headline, lede, and a 3-stat strip (40 playbooks · 6 industries · ~12 hrs/wk saved).
3. Sticky filter bar — chip-style filter buttons + a search input that filters live.
4. Playbook grid — 40 cards organized by 6 industry sections (Trades · Healthcare · Solo Operators · Professional Firms · B2B · Cross-Industry). Each card: name, one-line description, "what it touches" tag strip, trigger metadata.
5. "Don't see yours" CTA — links to `05_integrations.html` and the home CTA.

### 3. `03_capabilities.html` — Capabilities

**Purpose:** Category-creation. Lift the perceived product out of "AI chatbot" and into "AI operator." Each tile demonstrates one capability ChatGPT/Copilot can't match.

**Layout:**
1. Nav.
2. Hero — "Beyond chat" eyebrow, big headline, 4-stat strip.
3. Six capability sections, alternating sides (text left, demo right; then text right, demo left, etc.):
   - **01 Lives anywhere your team messages** — multi-channel demo (Slack/Teams/Telegram/WhatsApp/Signal/SMS/email)
   - **02 Runs on a schedule** — cron-table demo with named scheduled jobs
   - **03 Runs on events** — webhook trigger demo (form → draft, Stripe fail → dunning, calendar → brief)
   - **04 Connects to any API** — connector-grid demo + "your weird tool" callout
   - **05 Remembers across sessions** — memory-card demo showing what the operator remembers about a specific client
   - **06 Approves before it acts** — approval-chain demo showing held actions waiting on partner sign-off
4. CTA section.

### 4. `04_security.html` — Security & trust

**Purpose:** Resolve "but client data" wall. The page partners forward to their compliance-anxious associates / outside counsel.

**Layout:**
1. Nav.
2. Hero — "Your data. Your environment. Your audit log." + 4-badge strip (Deployment · Audit log · Encryption · Compliance).
3. **Three trust principles** strip — three cards with serif numerals.
4. **Section 01 Deployment** — body prose + visual card showing deployment posture matrix (per-firm isolation, default region, BYO cloud, encryption posture, etc.).
5. **Section 02 Access & roles** — body prose + RBAC matrix table for an example dental practice (front desk / hygienist / doctor × actions).
6. **Section 03 Audit log** — body prose + monospace audit-log preview (24 hours of named events, including a "held" entry).
7. **Section 04 Compliance posture** — body prose + 6-tile compliance grid (SOC 2, HIPAA, pen testing, DPA, vulnerability disclosure, ISO 27001).
8. **FAQ** — 7 partner-CISO questions in a `<details>` accordion.
9. **CTA** — "Send the security packet" + direct contact lines (security@, vulns@, legal@, 911@).

### 5. `05_integrations.html` — Integrations wall

**Purpose:** Sales-rep ammo. The page reps paste into emails when a prospect asks "do you support X?"

**Layout:**
1. Nav.
2. Hero — 3-stat strip (112 native · 14 categories · custom in week 1).
3. Sticky filter bar — chip filter (15 categories: All, Accounting, Medical & dental PM, Legal PM, CRM & sales, Comms, Docs & storage, Payments, Calendars, Marketing, E-sign, Tasks & PM, Forms & intake, Customer support, Field service) + search input.
4. **The wall** — 14 category sections, each a 6-column grid of integration cards. Cards are minimal (name + short capability description + occasional badge: `new`, `beta`, `driven`).
5. **"When the list isn't long enough"** — explains the three connection modes (API / undocumented HTTP / browser-driven session) and a 4-stage week-1 onboarding timeline.
6. **Real custom connectors** — 3 example cards (Eaglesoft+Delta, FileMaker, multi-state filing portals).
7. CTA + tour-of-other-pages card.

## Interactions & Behavior

### Global
- **Sticky nav** with translucent paper-tone background and `backdrop-filter: blur(14px)`. Current-page link gets darker color + medium weight.
- **All links** are real cross-page anchors using relative paths (`href="warm.html#how"` etc.). When porting, replace with framework router links.
- **Hover states:**
  - Nav links: color shifts from `--ink-2` to `--accent`.
  - `.btn-primary`: background `--ink` → `--accent` over 180ms.
  - `.btn-ghost`: border `--line-2` → `--ink`, background transparent → `#fff`.
  - Cards: `transform: translateY(-2px)` + soft shadow over 180ms.
- **Focus states** — no custom styling currently; **add visible focus rings during port** (2px `--ink` outline, 2px offset is fine).

### Home (`01_home.html`)
- **Hero rotating chat prototype:** auto-cycles every 6 seconds across 3 industries (tree co · dental · CPA). Three stage indicator dots at the bottom. Implemented via `setInterval` in inline script. **When porting, use the framework's preferred state pattern** (React `useEffect` + `useState`, etc.) and respect `prefers-reduced-motion` (pause auto-rotation).
- The chat is purely visual — no real input. When porting, optionally make the input a no-op or a "this is a preview" tooltip.

### Playbooks (`02_playbooks.html`)
- **Filter chips** — clicking a chip filters the visible playbooks by industry category. Multiple chips active = OR logic.
- **Search input** — live-filters across playbook name, description, and tag strip. Combines with chip filter as AND.
- **"No results" empty state** — appears when filter yields zero. Currently styled in italic serif.

### Capabilities (`03_capabilities.html`)
- Mostly static. The demo cards in each section are visual snapshots, not interactive.

### Security (`04_security.html`)
- **FAQ `<details>` accordion** — clicking the summary expands the answer. Plus/minus icon swaps via CSS. **When porting, build a custom Disclosure component** rather than using raw `<details>` if your design system has one (Headless UI, Radix, etc.).

### Integrations (`05_integrations.html`)
- **Filter chips** + **search input** — same pattern as Playbooks.
- **Tool cards** lift on hover (`translateY(-2px)` + soft shadow).
- The "112 / 14 / week 1" stat numbers — **verify these against the actual product before launch**.

### Animations
- All transitions use 150–250ms easing, default `ease`. Nothing is decorative or attention-grabbing — the site reads as confident, not animated.
- Soft radial gradient blobs on hero backgrounds (terracotta and sage) are static — no motion.

## State management

Minimal. Per-page state is:

| Page | State | Notes |
|---|---|---|
| Home | `currentScenarioIndex: 0\|1\|2` | Hero chat rotation. Cycles on 6s timer. |
| Playbooks | `activeChips: Set<string>`, `searchQuery: string` | Drives visible cards. |
| Capabilities | None | Static. |
| Security | `openFAQ: string \| null` | Per-disclosure open state. |
| Integrations | `activeChip: string`, `searchQuery: string` | Single chip, not multi. |

No server state, no auth, no forms. The "Book a call" CTA opens an external Calendly link (placeholder in the prototype — wire to your actual booking tool).

## Design tokens

All five pages share one token system. **Lift these into your codebase as the source of truth** (Tailwind config, CSS custom properties, Theme UI tokens, etc.).

### Colors

```
--paper:    #FBF4EA    /* primary background — warm cream */
--paper-2:  #F4E9D6    /* darker cream — used for gradient bottoms, alt sections */
--ink:      #2D1F14    /* primary text — warm near-black */
--ink-2:    #5A4533    /* secondary text — warm brown */
--muted:    #8A7560    /* tertiary text, captions, mono labels */

--line:     rgba(45,31,20,0.12)   /* default borders */
--line-2:   rgba(45,31,20,0.22)   /* hover-state borders, ghost button */

--accent:   #D97757    /* primary accent — terracotta. CTAs, italic emphasis, links */
--accent-2: #6B8E5A    /* secondary accent — sage. Used for "ok"/positive states in audit logs, compliance "live" badges */
--accent-3: #3F7A8C    /* tertiary accent — slate blue. Rare; "browser-driven" badge, occasional callouts */
```

The palette is deliberately warm. **Do not introduce gray.** Anywhere you'd reach for `#6B7280` or similar, use `--ink-2` or `--muted` instead. The cream paper tone is what makes the site read as "made by humans" rather than "AI for SMBs template."

### Typography

Three families, loaded from Google Fonts:

```
Source Serif 4 — for all headlines, italic emphasis, "voice" moments
  Weights used: 400, 500
  Italic styles used: 400, 500
  Note the italic + emphasis colors: italic em tags inside headlines are colored --accent.

Geist — for all body, UI labels, buttons
  Weights used: 400, 500, 600, 700

Geist Mono — for eyebrow tags, badges, kbd-style metadata, monospace data tables
  Weights used: 400, 500
```

**Type scale (homepage hero is the largest; descend from there):**

| Use | Family | Size | Weight | Line height | Letter-spacing |
|---|---|---|---|---|---|
| Hero headline (h1) | Source Serif 4 | clamp(46px, 5.6vw, 80px) | 500 | 1.02 | -0.024em |
| Section heading (h2) | Source Serif 4 | clamp(34px, 3.8vw, 52px) | 500 | 1.05 | -0.022em |
| Sub-section (h3) | Source Serif 4 | clamp(30px, 3.4vw, 44px) | 500 | 1.05 | -0.018em |
| Card heading (h4) | Source Serif 4 | 18-21px | 500 | 1.25-1.3 | -0.005em |
| Body | Geist | 16-19px | 400 | 1.5-1.6 | normal |
| Eyebrow | Geist Mono | 11px | 500 | 1 | 0.18em UPPERCASE |
| Mono data | Geist Mono | 10.5-13.5px | 400-500 | 1.4-1.65 | 0.04-0.14em |

**Critical typographic moves:**
- All headlines use serif italic for the "emphasis" word, colored `--accent`. Example: "Your data. *Your environment.* Your audit log." — the middle phrase is `<em>` styled italic + accent. This is the central voice device.
- `text-wrap: balance` on every headline.
- `font-feature-settings: "ss01"` on the body to enable Geist's stylistic alternates.

### Spacing

Section padding rhythm:
- Sections: `64px` top/bottom (compact), `80px` (standard), `88px` (CTAs / FAQ).
- Section content: max-width `1280px`, horizontal padding `32px`.
- Card padding: `22-24px` (content cards), `14-16px` (small list-item cards).
- Gaps: `8px` (chips, tag strips), `10-14px` (grid gaps, list items), `48-56px` (section grid columns).

### Border radius

```
--radius-sm:  5-6px    /* mono badges, small pills */
--radius-md:  12-14px  /* cards, inputs, buttons inside cards */
--radius-lg:  16-18px  /* large cards (hero CTA card, footer CTA card) */
--radius-pill: 999px   /* nav links, chips, primary buttons */
```

### Shadows

Used sparingly — only on hover lift:
```
0 12px 22px -16px rgba(45, 31, 20, 0.18)
```

### Iconography

Currently **the design uses no icon library**. UI signals are conveyed through:
- Bullet dots (small filled circles in tool cards)
- Mono badges (`new`, `beta`, `driven`)
- Plain text + arrows (`→`, `←`)
- Italic serif "—" or "+/−" symbols

When porting, **resist the urge to add icons everywhere**. The site reads confident specifically because it doesn't lean on iconography. If your design system mandates icons, use the most restrained set (Lucide line icons at 16px, single-color `--ink-2`).

## Component patterns to lift

The HTML duplicates these patterns across pages. **Componentize them once** in your stack:

1. **`<Eyebrow>`** — mono uppercase tag with letter-spacing, colored `--accent` by default. Used to label every major section.
2. **`<Headline>`** — serif h1/h2/h3 wrapper with built-in `<em>` italic-accent treatment.
3. **`<Button variant="primary"|"ghost" size="default"|"lg">`** — pill-shaped, terracotta-on-hover for primary, ghost variant for secondary.
4. **`<Card>`** — base card primitive (white background on cream sections, cream background on white sections — the alternation is intentional). 1px border `--line`, radius 14-18px.
5. **`<Badge variant="new"|"beta"|"driven">`** — mono uppercase 10px badge in the top-right of a card.
6. **`<Chip active={bool}>`** — pill-shaped filter button. Active state inverts (ink background, paper foreground).
7. **`<TagStrip>`** — horizontal scrolling row of small mono tags (inline-block, `--paper` background, 1px border `--line`).
8. **`<FilterBar>`** — sticky filter row with chip group + search input. Used identically on Playbooks and Integrations.
9. **`<StatStrip>`** — top-of-page horizontal strip of 3-4 big-serif statistics with a mono label above.
10. **`<DefinitionList>` / `<DataTable>`** — used in Security's deployment posture and RBAC matrix. Mono labels left, value chips right.
11. **`<AuditLogRow>`** — mono monospace timestamp + event description, dashed bottom border.
12. **`<Disclosure>`** — `<details>`/`<summary>` accordion with italic serif question + +/− icon.
13. **`<RotatingScene>`** — the home hero pattern. Cross-fades through N children on a timer. Stage indicator dots optional.

## Cross-page nav contract

Every page has the same sticky nav header:
- Brand mark (links to `/`) + "Firmcraft" wordmark in italic serif.
- Links: How it works, Pricing, Playbooks, Capabilities, Security, Industries, vs ChatGPT, Integrations.
- "Login" ghost button + "Book a call" primary CTA.

When porting:
- Extract the nav as a single `<SiteHeader>` component.
- Mark the current page link with `aria-current="page"` and the visual treatment (darker color + medium weight).
- The "Book a call" CTA on every page should hit the same booking endpoint.

## Responsive behavior

Breakpoints used in the prototypes:
- `1100px` — integrations grid drops from 6-col to 4-col.
- `960px` — security RBAC and most hero/CTA grids stack to single column; nav links hide (mobile menu needed).
- `840px` — integrations grid drops to 2-col; chips wrap; search input full width.

**These are reasonable starts but the prototypes don't fully solve mobile.** When porting:
- Build a proper mobile nav (hamburger → drawer or full-screen sheet).
- Test the rotating hero chat on mobile — likely needs to drop the auto-rotate and show only the active scenario.
- The integrations wall on mobile may want a vertical list instead of a 2-col grid.
- Audit hit targets (44px min) on all chips and buttons.

## Accessibility checklist (do this during port)

The prototypes don't meet a11y bar. Required during port:

- [ ] Color-contrast audit. `--ink-2` on `--paper` is ~7:1, fine. `--muted` on `--paper` is ~4.2:1, marginal — bump to `--ink-2` for any non-decorative text.
- [ ] Focus rings on every interactive element.
- [ ] Skip-to-content link.
- [ ] `aria-current="page"` on active nav.
- [ ] Real `<button>` for chips (currently `<button>` ✓ but verify after componentizing).
- [ ] FAQ uses `<details>` natively which is a11y-OK but build a `<Disclosure>` if your stack has one with proper aria-expanded handling.
- [ ] Reduced-motion query: pause hero rotation, disable hover lifts.
- [ ] Image alt text everywhere — currently the prototype has placeholder logos rendered as styled text spans (not `<img>`); when real logos go in, add alt.

## Assets

The prototypes use **no images, no SVGs, no icon libraries.** Everything is rendered with CSS, type, and HTML.

What you'll need to source before launch:

| Asset | Where it goes | Status |
|---|---|---|
| Customer logos (6) | Home trust bar | Permission needed; current placeholders are CSS-rendered name pills |
| Founder photo | Home founder note | Currently CSS-rendered initials placeholder |
| OG image | All pages `<head>` | Not in prototypes; design 1200×630 with brand identity |
| Favicon | All pages `<head>` | Not in prototypes; use brand mark (terracotta circle with cream center) |
| Tool logos | Integrations wall | Optional. Current treatment uses just tool names + dots; adding logos is a creative choice — if you do, keep them monochrome `--ink-2` to preserve the editorial feel |

## Files in this bundle

```
design_handoff_firmcraft_marketing_site/
├── README.md                  ← you are here
├── 01_home.html               ← warm.html (the homepage)
├── 02_playbooks.html          ← 40-playbook library, filterable
├── 03_capabilities.html       ← 6 capability deep-dives
├── 04_security.html           ← Trust & compliance page
└── 05_integrations.html       ← 112-tool wall, filterable
```

Each HTML file is self-contained: inlined CSS, no JS dependencies (the only inline scripts are filter logic on Playbooks and Integrations, and the rotating scene on the homepage). Open any of them directly in a browser to preview.

## Suggested implementation order

1. Set up the framework (Astro recommended for marketing-only; Next.js if you'll add app/auth later).
2. Lift the design tokens into your config.
3. Build the 13 base components listed in **Component patterns to lift**.
4. Build `<SiteHeader>` and `<SiteFooter>` shells.
5. Implement pages in order: Home → Capabilities → Security → Playbooks → Integrations. (Home anchors the visual language; Capabilities and Security are mostly static so they shake out token issues; Playbooks and Integrations need the filter pattern, build last.)
6. Wire the "Book a call" CTA to your real booking tool.
7. Add OG images, favicon, sitemap, robots, analytics.
8. Run the a11y checklist.
9. Mobile QA pass.

## Open questions to resolve before launch

These were placeholder-resolved in the prototype but need real answers:

1. **Customer logos** — which 6 firms have given permission for the trust bar?
2. **Founder photo** — final headshot, ideally warm-toned to match the palette.
3. **Stat numbers** — "112 integrations", "40 playbooks", "30+ firms across 5 industries" — verify against the live product.
4. **Pricing** — confirm $400 / $1,200 / $2,800 monthly tiers are still current.
5. **Booking tool** — which Calendly/Cal.com/Savvycal link does the primary CTA hit?
6. **Compliance dates** — "SOC 2 Q3 '26" — confirm with the auditor.
7. **Direct email aliases** — `security@`, `vulns@`, `legal@`, `911@` — these are aspirational in the prototype; confirm the addresses route to real on-call rotations before publishing the page.

---

Questions or anything ambiguous in this README? Reply in the design conversation thread and we'll refine.
