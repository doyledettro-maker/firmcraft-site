# Firmcraft — Visual Redesign Spec

**Status:** Approved by Doyle (Oct 2026). Build to a Vercel **preview** first; Doyle reviews before it goes live.
**Repo:** `firmcraft-site` · `main` → Vercel → firmcraft.ai
**Depends on:** `firmcraft-copy-spec.md`, including the "Amendment — Broaden the audience" section. **Copy does not change in this redesign.** This spec covers presentation only.

---

## Intent

The site reads correctly but looks like a document. Make it look like a serious, established advisory firm: confident typography, real photography and video, warm restraint. Flair comes from imagery, type, and space, never from louder copy.

**Doyle's decisions**
- Hero: a muted background video loop of people at work
- Palette: deep navy and cream with a brass accent
- Founder video: Doyle will film one for About; build the slot now
- Process: build straight to a preview link for Doyle to review

**Never:** AI clichés (glowing brains, circuit boards, robot hands, holograms, code on screens), handshake stock, people looking into the camera, gradients, glassmorphism, typewriter effects, counters that tick up, parallax, flashy scroll effects, or anything that reads as a software product landing page. Do not name or depict a specific industry as *the* client: imagery must read as cross-industry, so an owner of a small business and a chief executive both see themselves in it.

---

## Scope and phasing

| Phase | Scope | Gate |
|---|---|---|
| **A** | Global design tokens, typography, header, footer, homepage including the hero video | Preview → Doyle approves → live |
| **B** | Inner pages: Advisory, How we work, Sovereignty, For small business, About, Contact | Preview → Doyle approves → live |
| **C** | Founder video on About, once Doyle has filmed it (see `firmcraft-founder-video.md`) | Doyle approves the cut |

**Do not break:** `/onboard`, `/api/*`, `/support`, `/get-started`, and any app or console pages that use the existing `--color-console` and `--color-operator` tokens. Scope the new palette to marketing pages, through a `.marketing` root class or a separate marketing layout. Marketing pages are light-only: do not apply the existing dark-mode override to them.

---

## 1. Design tokens (marketing)

| Token | Value | Use |
|---|---|---|
| `--m-navy` | `#0E1B2E` | Hero overlay, navy bands, footer, primary button fill |
| `--m-navy-2` | `#16263D` | Raised surfaces on navy |
| `--m-cream` | `#F7F3EC` | Page background; text on navy |
| `--m-paper` | `#FFFDF9` | Cards on cream |
| `--m-ink` | `#1B2333` | Body and heading text on light (contrast 14.2:1) |
| `--m-muted` | `#5B6475` | Secondary text on light (5.4:1) |
| `--m-muted-navy` | `#A9B2C3` | Secondary text on navy (8.1:1) |
| `--m-brass` | `#C9A46A` | Accent on navy: rules, eyebrow labels, button fill with navy text (7.4:1) |
| `--m-brass-ink` | `#8A6A33` | Brass text on light backgrounds (4.5:1) |
| `--m-brass-soft` | `#EFE4CF` | Subtle tinted panels |
| `--m-rule` | `rgba(27,35,51,0.12)` | Hairlines on light |
| `--m-rule-navy` | `rgba(247,243,236,0.14)` | Hairlines on navy |

Brass `#C9A46A` must **not** be used for text on cream (2.9:1). On light backgrounds use `--m-brass-ink`.

Retire the cool slate and blue (`--color-signal`) on marketing pages. Links on light backgrounds are ink with a brass-ink underline; on hover the underline thickens.

## 2. Typography

- **Display (H1–H3, statements):** Source Serif 4 (already loaded as `--font-display`). Weight 500 for H1 and H2, 600 for H3. Letter-spacing `-0.015em`.
- **Body and UI:** Geist Sans (already loaded).
- **Retire JetBrains Mono on marketing pages.** It reads as a software product.

| Element | Size | Line height |
|---|---|---|
| H1 (hero) | `clamp(2.75rem, 5.5vw, 4.75rem)` | 1.05 |
| H1 (inner pages) | `clamp(2.5rem, 4.5vw, 3.75rem)` | 1.08 |
| H2 | `clamp(2rem, 3.4vw, 3rem)` | 1.12 |
| H3 | `1.375rem` | 1.3 |
| Statement (see §4) | `clamp(1.75rem, 3vw, 2.625rem)`, serif, weight 400 | 1.25 |
| Lede | `1.25rem` | 1.6 |
| Body | `1.0625rem` (17px) | 1.7 |
| Eyebrow label | `0.8125rem`, uppercase, tracking `0.16em`, weight 600, brass-ink (brass on navy) | — |

Body text column max width is about 68ch. Be generous with space: sections get `clamp(5rem, 10vw, 8.5rem)` vertical padding.

## 3. Header and footer

**Header:** on the homepage it is transparent over the hero video, with the cream wordmark and cream nav. After about 80px of scroll it becomes solid cream with a hairline bottom rule and navy text, with a 200ms transition. Inner pages use the solid cream header from the start. The **Contact Firmcraft** button is navy-filled with cream text, or brass-filled with navy text while over the video.

**Footer:** navy background, cream and muted-navy text, a brass hairline at the top. Same links and content as today.

## 4. Homepage

The copy is exactly as in `firmcraft-copy-spec.md` plus the amendment. Only the presentation changes.

### Hero: background video

- Full-bleed, `min-height: 88vh`. The video fills the area (`object-fit: cover`).
- Overlay: navy gradient, heavier on the left for legibility: `linear-gradient(90deg, rgba(14,27,46,0.88) 0%, rgba(14,27,46,0.65) 45%, rgba(14,27,46,0.25) 100%)`.
- H1, lede, and two buttons sit bottom-left in cream (primary **Contact Firmcraft** in brass with navy text; secondary **How we work** as a cream outline button). A short brass hairline above the H1.
- **Pause/play control** bottom-right: small, cream, with a label for screen readers. This is required, because looping motion longer than 5 seconds needs a pause control (WCAG 2.2.2).

**Footage**
- 3–5 clips cut into one 15–25 second seamless loop. Slow, steady camera; no fast cuts. A crossfade between clips of about 1s.
- Subjects are people at work in professional settings across different kinds of business:
  - a leadership team in discussion around a table
  - an owner working in their own business
  - two people reviewing documents or figures together
  - someone walking through a well-designed office or a property
  - architectural interiors with people in them
- Grading: slightly warm, slightly desaturated, with all clips matched.
- Nobody looks into the camera. No readable screens, logos, or brand marks.
- **Source:** licensed stock. Pexels or Pixabay (free commercial licence) is acceptable; a paid library is fine if the quality is materially better. Record each clip's source URL and licence in `public/media/CREDITS.md`.
- **Selection:** put together 2–3 candidate cuts and show them to Doyle on the preview, for example with a `?hero=a|b|c` query switch on the preview only. Do not ship more than one.

**Delivery**
- `public/media/hero-1080.mp4` (H.264, ≤ 6 MB) and `hero-1080.webm` (VP9); `hero-720.mp4` (≤ 2.5 MB) served via `<source media="(max-width: 768px)">`.
- No audio track. Attributes: `autoplay muted loop playsInline preload="metadata"` plus a `poster`.
- Poster: the strongest frame, exported as `hero-poster.avif` and `.jpg`. The poster shows immediately; the video must not block LCP.
- `prefers-reduced-motion: reduce` → poster only, with no video request.
- If the video errors or Save-Data is set → poster only.

### Service lines (Advisory · Managed AI services · Infrastructure)

- Three columns on desktop, stacked on mobile. Each column has a 4:3 photograph on top with a brass eyebrow label (`Advisory`, `Managed services`, `Infrastructure`), then the H3 and body copy, then a text link to the relevant page.
- Photographs follow the footage rules above and use the same grade. Suggested subjects: Advisory, a conversation across a table; Managed services, someone at work at a desk with the screen not readable; Infrastructure, a clean architectural or server-room detail with no brand marks.

### Problem section

- Two columns: the H2 on the left (sticky on desktop), the body paragraphs on the right.
- After the body, set the section's existing closing sentence ("Firmcraft was established to do both.") on its own line as a **statement**: large serif, with a brass hairline above. This reuses existing copy; do not write new copy for it.

### What distinguishes Firmcraft (five blocks)

- A two-column grid on a `--m-paper` band. Each block has a brass-ink numeral (`01`–`05`) in small serif, a hairline rule, the H3, then the body.

### Who Firmcraft works with

- A full-width navy band. H2 and intro in cream.
- The fit table becomes a clean two-column list on navy: labels in brass eyebrow style, values in cream, hairlines between rows. No boxes or cards.

### Closing (Start a conversation)

- A cream band. On the left, the H2, body copy, and **Contact Firmcraft** button. On the right, Doyle's photo (`/founder/doyle.jpg`), small (about 160px, rounded 4px, not circular), captioned "Doyle Dettro, Founder and Principal" in muted text. This puts a person behind the call to action without adding copy.

### Motion (sitewide)

- Sections fade up on first entry: 12px translate, 450ms ease-out, once only. Stagger child items by 60ms at most.
- `prefers-reduced-motion` → no reveals.
- Nothing else moves on the page apart from the hero video.

---

## 4b. How we work (moved into Phase A)

Doyle flagged this page. Build it on the Phase A preview branch with the new type system.

**Header:** cream background, brass-ink eyebrow `How we work`, serif H1, lede (copy unchanged).

**Stage overview:** directly under the header, a horizontal line of five brass nodes joined by a hairline, labelled `01 Discovery · 02 Fit-gap analysis · 03 Configuration · 04 Training and evaluation · 05 Ongoing support`. Each label is an anchor link to its section. On mobile the line runs vertically. It draws in once on first view (900ms), and is static under reduced motion.

**Each stage section:**
- Single cream background throughout, with a hairline rule between stages. No alternating grey bands.
- Two columns on desktop (about 5 : 7):
  - **Left (sticky, `top: 120px`):** the numeral (`01`) in serif, `3.5rem`, brass-ink, weight 400; below it the stage title as a serif H2, `clamp(2rem, 3vw, 2.75rem)`, ink, weight 500.
  - **Right:** body paragraphs at `1.0625rem` / `1.7`, max about 62ch, `1.1em` between paragraphs. In Fit-gap analysis, the three questions ("Does an existing system already perform this function…") become a short numbered list, with the wording unchanged.
- Vertical padding `clamp(4rem, 8vw, 6.5rem)` per stage. Stacked on mobile.

**Closing:** the navy call-to-action band from the homepage closing section.

---

## 4c. Process video on How we work (follow-up to Phase A)

**Assets:** `design/process-video/`. Move to `public/media/`:
- `process-1080.mp4` (H.264, 1.6 MB)
- `process-1080.webm` (VP9)
- `process-720.mp4` (for viewports up to 768px)
- `process-poster.jpg`

This is a 66-second silent motion graphic in the site palette, walking through the method. `process-video-source.html` is the editable source; it is rendered frame by frame to video.

**Placement:** on `/how-we-work`, directly below the stage overview line and above stage 01. Full content width (max about 1200px), 16:9, 6px radius, hairline border. No other text around it.

**Behaviour:**
- `muted playsInline preload="none"` with the poster. It starts playing when at least 50% of the video is in view and pauses when it leaves view. It plays **once**, with no loop, and stops on the end card.
- A visible play/pause control in cream at the bottom right, plus a replay control once it has ended.
- `prefers-reduced-motion: reduce` → no autoplay; the poster shows with a play button.
- Accessibility: `aria-label="Video: how Firmcraft approaches a process"`. Below the video, a collapsed `<details>` labelled "Text version of this video" containing the six caption lines below, in order.

**Text version (the captions shown in the video):**
1. In most processes, the work itself takes a small share of the elapsed time. Most of the time is spent waiting between steps.
2. Discovery. Interviews and the organization's own system records establish how the work actually proceeds, including the exceptions.
3. Process redesign. Each step is removed, handled by conventional software, assigned to an AI agent, or kept with a person.
4. Process redesign. Current performance is measured before anything is built, so that results can be compared against it.
5. Implementation. The redesigned process is built inside the systems the organization already uses.
6. Training and evaluation, and ongoing support. People are trained on their own work, and results are reported against the starting measurement.

---

## 4d. Small business video on For small business

**Assets:** `design/smb-video/`. Move to `public/media/`:
- `smb-1080.mp4` (5.8 MB)
- `smb-1080.webm`
- `smb-720.mp4` (2.8 MB, for viewports up to 768px)
- `smb-poster.jpg`

Silent, 37 seconds. Five working scenes (tree service, bakery, real estate, landscaping, dental office), each with an overlay showing a spoken request and the agent's reply, closing on the Firmcraft card. The source is `smb-video-source.html`. Clip credits are in `design/smb-video/CREDITS.md`; copy each used clip's entry into `public/media/CREDITS.md`.

**Placement:** on `/for-small-business`, directly below the page header and lede, above the first section. The frame, behaviour and controls are the same as the How we work process video (§4c): it plays once in view, muted, no loop, with play/pause and replay, and no autoplay under reduced motion. Use `aria-label="Video: examples of a managed AI agent handling routine tasks for small businesses"`.

**Text version** (collapsed `<details>`, "Text version of this video"):
1. Auto service. Request: "Order brake pads for the car in bay three." Agent: The parts department has the order. The pads will be at bay three by two o'clock, and the customer has been told the car will be ready at five.
2. Bakery. Request: "Order flour and butter for Friday's baking." Agent: Ordered from your usual supplier: ten bags of flour and twenty-four pounds of butter, arriving Thursday morning.
3. Real estate. Request: "Confirm the four o'clock showing at 212 Elm Street." Agent: Confirmed with the buyer's agent for four o'clock. Your reminder is set for three.
4. Landscaping. Request: "Pull up the work order for the next property." Agent: Work order 1048: spring cleanup, hedge trimming, and mulch for the front beds. The gate code is in the notes.
5. Dental office. Request: "Submit the claim for this morning's cleaning." Agent: The claim has been submitted to the patient's insurer. I will follow up if it has not been acknowledged within two days.

Names, addresses and figures are illustrative.

---

## 5. Inner pages (Phase B)

**Page header pattern, all inner pages:** cream background, brass eyebrow (page name), large serif H1, lede. To the right on desktop, or below on mobile, one photograph following the same rules (aspect 4:5 or 3:2, same grade). Sovereignty uses a diagram instead of a photograph.

| Page | Additions |
|---|---|
| **Advisory** | Header photograph. The three service lines become three alternating image-and-text rows. |
| **How we work** | Moved into Phase A. See §4b. |
| **Sovereignty** | An **SVG boundary diagram**: a navy-outlined box labelled with the client's environment, containing the client's data and the AI services that run there. Firmcraft's management access is shown crossing the boundary as a single brass line, and nothing else leaves. Labels must come from existing page copy, with no vendor or product names. |
| **For small business** | Header photograph of an owner working in their own business, of no specific identifiable trade. |
| **About** | The Founder section becomes a **video slot**. Until the video exists, show `doyle.jpg` as it is today. When it exists, the poster is a frame from the video with a cream play button; it plays inline with captions on by default. The bio text stays beside it. |
| **Contact** | A navy band header; the form or contact details on cream. |

---

## 6. Performance and accessibility (acceptance)

- Lighthouse on a mobile preview: Performance ≥ 90, Accessibility ≥ 95, CLS < 0.05, LCP < 2.5s.
- All photographs in AVIF or WebP via `next/image` with explicit dimensions, lazy-loaded below the fold.
- Every photograph has meaningful `alt` text that describes the scene, never "stock photo". The decorative hero video is `aria-hidden` with a labelled pause control.
- Keyboard focus is visible: a 2px brass-ink outline on light backgrounds, brass on navy.
- No layout shift when the header changes from transparent to solid.

## 7. Review

1. Deploy Phase A to a Vercel preview. Make sure Doyle can open it from a link without signing in: turn off deployment protection for that preview, or share it with a bypass link.
2. Post the preview link in #firmcraft with the 2–3 hero video candidates. Claude reviews visually first, then Doyle picks one.
3. After Doyle approves, merge to main. Then Phase B follows the same steps.

## 8. Verify (after each phase goes live)

```bash
curl -sSL https://firmcraft.ai | grep -oE 'hero-(1080|720)\.(mp4|webm)|hero-poster' | sort -u   # expect the video and poster assets
curl -sSL https://firmcraft.ai | grep -oiE 'mid-market|asset-intensive|JetBrains' | sort -u        # expect none
for f in hero-1080.mp4 hero-720.mp4 hero-poster.jpg; do printf '%-16s ' $f; curl -sSI https://firmcraft.ai/media/$f | grep -iE '^(HTTP|content-length)' | tr -d '\r' | tr '\n' ' '; echo; done
```
