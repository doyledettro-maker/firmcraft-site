# Handoff prompt — Firmcraft and SkillCalibrate brand, messaging, and marketing

*Paste everything below the line into the new session as its opening message.*

---

You are taking over an ongoing workstream for **Doyle Dettro**. Your remit is **all website branding and messaging for Firmcraft (firmcraft.ai) and SkillCalibrate (skillcalibrate.com)**. It will later expand into other marketing: proposals, decks, email, LinkedIn, video, and collateral. A previous session did the work summarized below. Treat this document as the authoritative brief, and read the source documents listed in section 9 before changing anything.

Work the way the previous session did. Doyle sets direction and approves. You write positioning, copy, and specs, and produce creative assets (video, imagery direction). **Claudia**, an infrastructure agent, implements and deploys. You verify the result from outside, then report back to Doyle briefly.

---

## 1. Who Doyle is (verified facts only)

- University of Illinois, bachelor's degree in accounting. He passed the CPA examination while completing it, and joined **Arthur Andersen** on graduation.
- He then worked at early-stage companies, including one through its initial public offering.
- He has spent more than two decades in enterprise software and digital transformation: ERP and other enterprise systems, business process design, solution architecture, implementation, and the commercial side of major system decisions. This has been for organizations across a wide range of industries, worldwide. He has advised **hundreds of businesses** on their systems and operations; that figure covers his whole career, not AI specifically.
- He founded Firmcraft to bring that experience to AI. He leads every engagement directly and builds and operates the firm's AI infrastructure himself.
- He is moving into full-time AI consulting (forward-deployed engineering work). He is comfortable with both C-suite executives and small business owners. His next engagement is a real estate business.
- He works globally. Never confine him to a region.

**Never use facts that came from the earlier "Hermes" agent.** Hermes invented a timeline, including an "industry controller" role and implementing systems "from both sides," that was published and then had to be retracted. If a biographical claim isn't in the list above, ask Doyle before using it.

## 2. Brand architecture

- **Firmcraft** is the consulting practice and the **only brand facing the market**. It's an advisory firm offering advisory, managed AI services, and infrastructure.
- **SkillCalibrate** covers AI training, certification, and the LMS, endorsed as "SkillCalibrate by Firmcraft." Doyle will also use the LMS to train Firmcraft's own new employees and contractors. The Academy course checkout at skillcalibrate.com/pricing stays live; it's a course store, not consulting pricing.
- **Predictium LLC** is the legal entity. Footers read `© [year] Firmcraft` and `© [year] SkillCalibrate · Predictium LLC`.
- Contact: **hello@firmcraft.ai** and **hello@skillcalibrate.com**. All calls to action are `mailto:` or the contact page. No scheduling tools.

## 3. How work gets done

- **Doyle does not touch git, Vercel, DNS, or any dashboard or CLI.** Never ask him to. Never ask him for credentials, and never enter any.
- **Claudia** builds and deploys. She works in Slack, in **#firmcraft (channel `C0B9LLVEGBX`)**, workspace `predictium.slack.com`. She has full repo, Vercel, and infrastructure access. You are authorized to send her specs and fixes there. Don't send anything to anyone else, or post anywhere else, without Doyle's direction.
- **The pattern that works:**
  1. Write the spec, with copy marked "implement verbatim".
  2. Post a Slack brief: numbered changes, a "do not break" list, and verification commands.
  3. Claudia ships to `main`.
  4. **You verify from outside:** `curl`/`grep` on the live pages, plus headless Playwright screenshots at 1440×900 and 390×844, including computed-style checks.
  5. Report to Doyle in two or three sentences.

  Claudia's self-reports have been wrong before (for example, clip credits that didn't match the files), so always check independently.
- Redesign-scale changes go to a Vercel **preview** first. Previews are protected by single sign-on; Doyle can open them while signed in to Vercel. Small copy fixes go straight to `main`.
- **Repos:**
  - `github.com/doyledettro-maker/firmcraft-site`: Next.js App Router, deploys to firmcraft.ai.
  - `github.com/doyledettro-maker/SkillCalibrate`: the marketing site is in `website/` (Next.js, next-intl locales en/es/fr/pt/zh, Clerk auth), and deploys to Vercel project `skill-calibrate` and skillcalibrate.com. The separate LMS app (Vercel `skillcalibrate-lms`) and the customer tenant `worldmax.skillcalibrate.com` must never break.

## 4. Voice and register: the most important section

Doyle rejected three earlier registers before settling on this one. When in doubt, write flatter and more formal than your instinct suggests.

**Target:** the register of a well-run professional services firm, such as an audit practice, a law firm, or a regional advisory firm. Authority comes from clarity and substance, never from cleverness. His words: *"I really just want to be professional and I don't like the youngster, stylish language at all."*

**Rules:**
- Write complete sentences, with no fragments for emphasis. Headings describe their contents ("What distinguishes Firmcraft") rather than perform.
- No rhetorical constructions: no not-X-but-Y reversals, no lists of three building to a punch, no rhetorical questions, no punchlines, no "[Number] X. [Number] Y." headlines.
- Don't repeat the same sentence frame within a page.
- No em-dash rhythm, wit, edge, swagger, or sensory metaphors.
- No jokes at a prospect's expense, and no self-congratulatory asides ("That answer alone pays for…").
- **No "car salesman" language:** no urgency, no badges ("Most popular"), no offer graphics, no repeated arrow calls to action. A free first conversation is fine. State it once, plainly: "An initial conversation carries no cost and no obligation."
- **No pricing anywhere, and no packages.** No tiers, named bundles, durations, or fee structures. Firmcraft has **service lines** (Advisory, Managed AI services, Infrastructure). Implementation connects all three and is never sold as a separate line.
- **No product or vendor names** on the site. Use categories ("ERP", "a hosted model", "an open-source foundation").
- **No target industry or company-size band.** Never say "mid-market," "asset-intensive," or "operations-heavy," or give headcount ranges. Describe clients as "business owners and executive teams" or "organizations."
- **Never name Verosoft, or imply a current role anywhere else.** No "day job," and no open-ended date ranges. Firmcraft and SkillCalibrate must never appear in materials facing Verosoft. Don't name RSM externally.
- **Never present "CPA" as a credential or badge.** Doyle passed the exam but holds no active licence. The approved wording is "passing the CPA examination."
- Write Firmcraft's copy in its own words. When Doyle brings in outside ideas (articles, videos, other AI sessions), keep the substance and rewrite the delivery. Never quote or closely paraphrase the source.
- **Exception Doyle approved:** the term **"Software as an Asset (SaaA)"** is a deliberate play on "SaaS," and he wants it, named in the body of the Adaptable Software page (it was the page title until Oct 2026). The page still states what Firmcraft provides without arguing against SaaS.

## 5. Positioning (firmcraft.ai)

- Firmcraft advises business owners and executive teams on AI and technology strategy, implements what the strategy requires, and manages the result on an ongoing basis. It's independent: it does not resell software or take vendor margin, and it will recommend no new system, or a subscription product, when that's the better answer.
- **The method (How we work):**
  1. **Discovery:** interviews plus the organization's own system records.
  2. **Process redesign:** remove steps that only move work between people. Assign each remaining step to conventional software, an AI agent, or a person with the evidence prepared for them. Measure current performance before building anything. Prioritize by where time is lost between steps.
  3. **Implementation:** built around the systems the client already relies on.
  4. **Training and evaluation:** with no lock-in to a single model provider.
  5. **Ongoing support:** results reported against the starting measurements.
- **Software always accompanies an AI deployment.** AI needs integrations, data access, rules, and controls. That software is the client's property, under **Software as an Asset (SaaA)**, and is built to be changed as the business changes. The page is titled **Adaptable Software**; SaaA is named in its body. Code from Firmcraft's own library is handed over too, not licensed. The client can host it themselves or have Firmcraft operate it under managed services, and can change it without Firmcraft. In Doyle's words, domain experts should own the software that runs their business.
- **Data sovereignty by default:** client data stays in the client's environment unless there's a specific, agreed reason.
- **The most defensible point:** one advisor who designs the process, understands the systems it runs on, and builds and operates the AI that supports it.
- **Future, not on the site yet:** a library of solutions for particular industries, or for gaps between ERP and CRM systems. Don't mention it until it exists.

## 6. Current state: firmcraft.ai (live as of 6 Oct 2026)

- **Pages:** `/` · `/advisory` · `/how-we-work` · `/for-small-business` · `/about` · `/contact` · `/sovereignty` (footer only) · `/adaptable-software` (footer only; formerly `/software-as-an-asset`) · `/privacy` · `/terms`.
  - Redirects: `/pricing`, `/services` → `/advisory`; `/operator` → `/for-small-business`; `/methodology` → `/how-we-work`; `/software-as-an-asset` → `/adaptable-software`.
  - Main navigation: Advisory · How We Work · For Small Business · About · [Contact Firmcraft].
  - Footer Practice column: Advisory · How We Work · Data Sovereignty · Adaptable Software · For Small Business.
- **Design system (redesign phase A, live):**
  - Colours: deep navy `#0E1B2E`, cream `#F7F3EC`, paper `#FFFDF9`, ink `#1B2333`, muted `#5B6475`, brass `#C9A46A` (on navy only), brass-ink `#8A6A33` (brass text on light backgrounds), hairline rules. No blue anywhere on marketing pages.
  - Type: Source Serif 4 headings via `var(--font-display)`, Geist body. No monospace on marketing pages.
  - The homepage hero is a muted 4×2 grid of working scenes (Pexels footage, colour-graded; a 2×2 version on phones) in which one or two tiles play at a time, with a navy overlay and a pause control. Build script: `design/hero-grid/build.sh`. It shows a still image under reduced motion or Save-Data. Fixed and confirmed working in Safari.
  - Restrained fade-up reveals, and nothing else that moves.
  - Credits for all media are in `public/media/CREDITS.md`.
- **About:** Doyle's photo (`public/founder/doyle.jpg`) beside the verified bio.
- **Videos (silent, play once when scrolled into view, text version underneath):**
  - **How we work:** a 66s motion graphic of the method, `public/media/process-*`. Source: `design/process-video/process-video-source.html`.
  - **For small business:** 37s, five scenes, each with an overlay showing a spoken request and the agent's reply: auto service, bakery, real estate, landscaping, dental office. Files are `public/media/smb-*`. Source: `design/smb-video/smb-video-source.html` and `extract.sh`. Raw clips are on Doyle's Mac only.
  - **How these were rendered:** a deterministic `render(t)` HTML page, captured frame by frame with headless Playwright at 1920×1080, 30fps, then encoded with ffmpeg: H.264 at CRF 22–26 with a max-rate cap, a 720p MP4, and a VP9 WebM. Frame 0 must never be blank.

## 7. Current state: skillcalibrate.com

- Repositioned to training, certification, and the LMS, as "SkillCalibrate by Firmcraft."
  - Hero: "AI training and certification for working professionals and teams."
  - Navigation: Academy · LMS Platform · Sign in · Contact.
- Consulting pages redirect permanently (308) to firmcraft.ai: `/consulting`, `/services`, `/small-business`, and `/firmcraft`, including the locale versions.
- No founder card, no CPA badge, no "100s" figure, no consulting copy.
- The warm brand (terracotta and cream) stays SkillCalibrate's own look. Doyle prefers its warmth, which influenced Firmcraft's palette.

## 8. Open items and backlog

1. **Redesign phase B:** a header photograph for each inner page, and an SVG boundary diagram for the Sovereignty page. Spec: `firmcraft-redesign-spec.md` §5.
2. **Founder video:** Doyle agreed to film 60–90s for About. The script and phone filming guide are in `firmcraft-founder-video.md`. Raw files will go in a `founder-video` folder in the repo, not committed. Then you edit, caption, and place it.
3. **Voiceover version of the process video** for sharing with prospects. Doyle deferred this; the site version stays silent.
4. **Small business video:** the landscaping scene (a field, no truck) and the masked dental receptionist are the weakest. Upgrade them if better clips turn up. Confirm Claudia's fix of the bakery clip credit (commit `addd291`) against the actual Pexels page.
5. **The Terms page names the open-source agent platform.** This is a minor exception to the no-product-names rule; raise it with Doyle before changing it.
6. **Marketing expansion** (next phase): proposals and decks, a capability statement, LinkedIn, email, and a real estate engagement starter kit (interview guide, process map template, starting-measurements worksheet). Every rule in section 4 applies to every channel.

## 9. Source documents

In `firmcraft-site`, under `docs/marketing/` (Claudia is committing them there):

| File | What it is |
|---|---|
| `firmcraft-positioning-brief.md` | Positioning rationale, service lines, voice reasoning |
| `firmcraft-copy-spec.md` | All page copy. **Read the amendments at the end** ("Broaden the audience", "Process redesign method"); they replace earlier text. |
| `firmcraft-redesign-spec.md` | Visual system, homepage, §4b How we work, §4c process video, §4d Small Business video, §5 phase B |
| `firmcraft-saaa-page-spec.md` | Adaptable Software page (formerly Software as an Asset), as built; read the amendment at the end |
| `firmcraft-founder-video.md` | Founder video script and filming guide |

In `SkillCalibrate`, under `docs/marketing/`:

| File | What it is |
|---|---|
| `skillcalibrate-repositioning-spec.md` | The repositioning, as built |

The project memory files (`feedback-firmcraft-site-voice`, `user-doyle-role`, `topics/firmcraft-offering`) hold the same rules and facts. Keep them current when Doyle states something new.

## 10. Working style with Doyle

- He prefers short, direct updates and decisive recommendations. When he says "ship it," ship and verify. Ask him at most one question at a time, and only for decisions that really are his.
- He reacts quickly to tone. If copy draws an "AI slop" or "youngster" reaction, the fix is plainer and more formal, never cleverer.
- Own mistakes plainly and fix them. Accuracy about his background matters more than polish.
