# Phase 1: AI Phone Answering — Decisions

**Status:** Awaiting Doyle's input
**First deployment:** Firmcraft itself (not Mike — we eat our own cooking first)

**Related docs:** [Technical Spec](PHASE1-AI-PHONE-ANSWERING-SPEC.md) · [ROADMAP.md](../ROADMAP.md) (Phase 1)

---

## Decision 1: Voice Provider ✅ DECIDED
**Decision:** Self-hosted with Pipecat (open source) — NOT Vapi
**Stack:** Pipecat + Twilio + Deepgram Nova-3 (STT) + Cartesia Sonic-3 (TTS) + our LiteLLM
**Why:** No platform fee ($0.05/min saved vs Vapi), full control, ~$0.05/min all-in vs $0.12-0.15 with Vapi. 60% cheaper. ElevenLabs stays on $5 Starter for SkillCalibrate lessons only.
**Fixed costs:** ~$40/mo (Cartesia $39 + Twilio $1.15/number). Variable: ~$0.05/min.

## Decision 2: Call Forwarding vs. Dedicated Number ✅ DECIDED
**Decision:** Per-client basis. Three deployment modes:
1. **Full answering** (solo contractors like Mike whose cell = biz phone) — Provision a NEW Twilio number. AI is the primary line, always on. Contractor puts it on marketing as their "office line."
2. **Overflow** (shops with a receptionist) — Forward to AI after X rings or when busy. Receptionist stays primary.
3. **After-hours only** — Forward kicks in outside business hours. AI handles nights/weekends.
**For Firmcraft:** New dedicated number (no existing business line to forward).
**Technical:** All three modes use the same Pipecat system, just different Twilio routing rules.

## Decision 3: Area Code Matching ✅ DECIDED
**Decision:** Customer's choice. We offer local area code matching by default and let the client pick their preferred area code during onboarding. Twilio has inventory in virtually every US area code ($1.15/mo per number).
**For Firmcraft:** Still needs Doyle's pick — 217 (Chatham), 312 (Chicago), or 800 (toll-free, $2/mo).
- [ ] **Doyle's call on Firmcraft's own number:** _________________________

## Decision 4: Voice Selection ⏳ DEFERRED
**Decision:** Explore during build. Cartesia has a voice library — we'll test several voices on actual phone calls and pick favorites. Client gets a choice during onboarding.
**Open questions:** How many options to offer? Male/female/both? Need to hear them on a real phone call first, not just browser demos.
**Action:** During build, create a voice demo tool — call a test number, hear 4-5 voices read the same greeting, pick favorites.

## Decision 5: Pricing Model ⏳ DEFERRED — RETHINKING
**Original question:** Usage caps on Solo/Team/Pro tiers.
**Doyle's direction:** May scrap the current Solo/Team/Pro pricing entirely. Instead, price each capability a la carte (voice answering, scheduling, contracts, etc.) and determine bundles after the pieces are built. Different bundles for different verticals.
**Implication:** Build Phase 1 voice answering as a standalone product with its own pricing, not tied to the current $399/$799/$1,499 tiers. Price it based on actual costs + margin once we see real usage patterns from Firmcraft's own line.
**Action:** Revisit pricing after Phase 1 is in production and we have real cost/usage data.

## Decision 6: Call Recording + Consent ✅ DECIDED
**Decision:** Record all calls. No disclosure unless legally required by the client's state. Configurable per client.
**Implementation:** Default to record-without-disclosure (covers one-party consent states like IL, TX, NV). For clients in all-party consent states (CA, FL, etc.), enable disclosure in the greeting automatically based on the client's state setting.
**Storage:** Recordings + transcripts saved per call for QA and dispute resolution.

## Decision 7: LLM Model for Voice ⏳ TEST DURING BUILD
**Direction:** GPT-5.5 via LiteLLM as the default for live calls. GPT-5.5 also for post-call processing (summaries, CRM notes, lead scoring). Claude Sonnet 4.6 as fallback for uptime.
**Open question:** Latency. If GPT-5.5 responds under ~500ms through LiteLLM, keep it. If there's noticeable lag on a real phone call, test GPT-4.1 mini as a faster alternative for live calls only.
**Action:** Build a test call during development, try both models, compare conversation feel.

## Decision 8: Notification Channel ✅ DECIDED
**Decision:** SMS as default notification for call summaries. Configurable per client — some may prefer Telegram, Slack, or email, but SMS is the one channel every contractor actually sees immediately.
**For Firmcraft:** SMS to Doyle's cell until there's a team or full-time switch.
**For Mike:** SMS.
**Implementation:** Hermes sends a concise SMS after each call: caller name/number, what they needed, outcome (booked, message taken, transferred). Full transcript available in the dashboard/Hermes thread for detail.
**Optional:** Also post to their Hermes channel (Telegram/Slack) as a backup log, but SMS is the primary alert.

## Decision 9: Calendar Integration ✅ DECIDED (REVISED)
**Decision:** Google Calendar from day one. Two modes, configurable per client:
1. **Message mode (default):** AI takes the caller's info and what they need. Hangs up. Sends contractor an SMS with the details. Contractor calls/texts them back to schedule. No booking happens on the call.
2. **Auto-book mode (opt-in):** AI checks Google Calendar, offers available times, books directly. For clients who trust the AI to manage their schedule (e.g. Firmcraft demo slots, established contractors with predictable job durations).
**Why message-mode default:** Can't keep a customer on hold waiting for contractor approval. And many jobs require the contractor to assess scope/pricing before committing a time. The AI captures the lead, the contractor closes it.
**Ties into Phase 2 scheduling:** Message mode is Phase 1. Auto-book + dispatch + multi-tech is Phase 2.

## Decision 10: After-Hours Behavior ✅ DECIDED
**Decision:** AI answers 24/7. Same message-taking behavior as during hours — capture caller info, what they need, notify contractor via SMS. For emergencies (configurable keywords like "flooding," "no heat," "gas leak"), transfer to owner's cell. Otherwise: "I've taken down your information and [Mike/the team] will get back to you first thing in the morning."
**For Firmcraft:** After-hours callers get: "Thanks for calling Firmcraft. Doyle will get back to you first thing tomorrow. Can I get your name and what you're looking for?"
**Configurable per client:** Emergency transfer on/off, emergency keywords, after-hours greeting.

## Decision 11: Timeline ✅ GREEN LIT
**Decision:** Build now. First deployment: Firmcraft's own inbound line.
**Testing:** Jack and Robert will test by calling in.
**Stack confirmed:** Pipecat + Twilio + Deepgram Nova-3 + Cartesia Sonic-3 + GPT-5.5 via LiteLLM + Hetzner
**Rollout:** Firmcraft → Mike → new clients

---

## Notes
- First deployment target is Firmcraft, not a client
- Spec is at docs/PHASE1-AI-PHONE-ANSWERING-SPEC.md (1,800 lines, implementation-ready)
- Once decisions are made, a single /goal session can build the Hermes skill
