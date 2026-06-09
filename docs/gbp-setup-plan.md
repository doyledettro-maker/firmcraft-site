# Google Business Profile Setup Plan — Firmcraft

**Related docs:** [ROADMAP.md](../ROADMAP.md) (Phase 6) · [GBP API Checklist](gbp-api-application-checklist.md) · [Digital Ops Research](digital-ops-research.md)

_Sub-doc of [ROADMAP.md](../ROADMAP.md) → **Phase 6: Digital Ops**. Created 2026-06-08._

This is the end-to-end plan for standing up Firmcraft's own Google Business Profile (GBP), getting approved for GBP API access, and building the integration that powers the Digital Ops module. The single most time-sensitive item is **Phase 1 below — the 60-day verification clock must start now (June 2026)**, because GBP API approval requires a verified profile that has been active for 60+ days.

Companion doc: [gbp-api-application-checklist.md](./gbp-api-application-checklist.md) — the execute-ready reference for the API application itself (form fields, drafted use case, post-approval API enablement).

---

## Phase 1 — Create & Verify GBP Listing (Today, June 2026)

**Goal: start the 60-day clock immediately.** API access (Phase 2) is gated on a GBP that has been verified and active for 60+ days. Every day this slips pushes the entire Digital Ops critical path.

### Create the listing
- Go to https://business.google.com/ and create Firmcraft's Google Business Profile
- **Business name:** Firmcraft
- **Category:** "Business management consultant" as the primary category (best fit for an AI operations platform serving small businesses). Add secondary categories where allowed:
  - "Software company" / "Computer software company"
  - "IT services" / "Marketing agency"
  - Primary category matters most for ranking — lead with the one that matches how clients describe what we do, then layer the rest as secondary.
- **Address / service area:** Set up as a **service-area business (SAB)** rather than a storefront, since Firmcraft serves clients remotely and doesn't take walk-ins.
  - Base location: Doyle's Chatham, IL address (800 Williamson Ave, Chatham, IL 62629)
  - Service areas: Houston, TX (current contractor outreach market) + Chatham/Springfield, IL
  - SAB mode hides the street address publicly while still anchoring the listing — appropriate for a platform business run from a home office.
- **Phone:** (217) 303-8319 _(the Firmcraft Twilio line already wired to the voice agent)_
- **Website:** https://firmcraft.ai
- **Owner/manager email:** add a `@firmcraft.ai` address as owner (required later — the API application email domain must match the website domain)

### Complete the profile (raises both ranking and API-approval odds)
- Business description
- Hours (or "open 24 hours" / by-appointment as fits a SAB)
- Logo + cover photo + a few brand/product photos
- Services list
- Attributes (e.g., "online appointments," "identifies as…") where relevant

### Verify
- Choose whichever verification method Google offers for this listing — in order of preference:
  1. **Instant / phone / email verification** if available (fastest)
  2. **Video verification** (increasingly the default for SABs)
  3. **Postcard** (mailed to Chatham address; 5–14 days — slowest, plan accordingly)
- **The 60-day clock starts at verification, not at creation** — so push the listing through verification as fast as the offered method allows.

**Exit criteria for Phase 1:** Firmcraft GBP is verified, fully complete, website = firmcraft.ai, and a `@firmcraft.ai` email is owner. Note the verification date — that date + 60 days is the earliest the Phase 2 application can be submitted.

---

## Phase 2 — GBP API Application (After 60 days, ~August 2026)

**Earliest submit date = Phase 1 verification date + 60 days.** Assuming verification lands in June 2026, the application window opens in **August 2026**.

- Submit the API access form at https://support.google.com/business/contact/api_default
  - Select **"Application for Basic API Access"**
- Use the drafted use case description and field-by-field guidance in [gbp-api-application-checklist.md](./gbp-api-application-checklist.md) (Step 4 + Step 5)
- Key approval requirements (all should already be true from Phase 1):
  - Verified GBP active 60+ days ✓ (Phase 1)
  - Application email domain matches website domain (`@firmcraft.ai` ↔ firmcraft.ai)
  - Fully complete profile
  - Specific, workflow-level use case (reviews, posts, profile management, performance reporting)
- **Expected approval:** Google's FAQ states up to 14 days; community reports suggest **3–10 business days** for well-prepared applications.
- One approval covers all GBP sub-APIs at 300 QPM. After approval, enable the 9 APIs listed in the checklist (Step 7) and configure OAuth (Step 8).

**Exit criteria for Phase 2:** Quota shows 300 QPM in Cloud Console, all 9 APIs enabled, OAuth scope `https://www.googleapis.com/auth/business.manage` configured, test call returns 200.

---

## Phase 3 — Integration Build (Sept 2026 → Q4 2026)

Once API access is live, wire GBP into Hermes as a Digital Ops skill.

- **Integrate the GBP MCP server** — `jmdurant/gbp-mcp-server` (28 tools) as the API surface for all GBP operations
- **Wire into Hermes as a Digital Ops skill** — alongside the existing Firmcraft ops skills, so the agent can act on GBP on behalf of clients (client-authorized via OAuth)
- **Review monitoring + response drafting** — pull new reviews into the client dashboard, draft owner-approved responses
- **GBP post scheduling** — create and schedule local posts (updates, offers, events) across client locations
- **Profile optimization** — keep hours, descriptions, categories, attributes, and photos accurate and current
- Per Google's third-party policies: each client authorizes Firmcraft via OAuth (no stored credentials), notify clients of changes within 48h, provide a disconnect path within 7 business days

**Exit criteria for Phase 3:** GBP MCP server live in Hermes, review/post/optimization workflows functional against Firmcraft's own profile, ready to onboard the first client location.

---

## Timeline

| When | Milestone |
|------|-----------|
| **June 2026** | Create & verify Firmcraft GBP listing (60-day clock starts) |
| **August 2026** | Submit GBP API access application (verification date + 60 days) |
| **September 2026** | Begin integration build (GBP MCP server → Hermes skill) |
| **Q4 2026** | Digital Ops beta with GBP live for first contractors |

> The full Digital Ops module build target is **Q1 2027** (per ROADMAP Phase 6). This GBP track is the critical-path dependency that must lead it.

---

## Critical Path Summary

```
Phase 1 (verify, June) ──60 days──▶ Phase 2 (API apply, Aug) ──3-10 days──▶ Phase 3 (build, Sept-Q4) ──▶ Digital Ops beta (Q4 2026)
```

The only thing that *cannot* be parallelized or accelerated is the 60-day verification waiting period. **Start Phase 1 today.**

---

## Reference Links

- API application checklist (companion doc): [gbp-api-application-checklist.md](./gbp-api-application-checklist.md)
- Create a profile: https://business.google.com/
- API application form: https://support.google.com/business/contact/api_default
- GBP API prerequisites: https://developers.google.com/my-business/content/prereqs
- Third-party / agency policies: https://support.google.com/business/answer/7353941
- GBP MCP server: https://github.com/jmdurant/gbp-mcp-server
