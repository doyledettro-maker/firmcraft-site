# Scheduling & Dispatch Module: Market Research Report

**Prepared for:** Firmcraft AI — Phase 2 Module Development
**Date:** June 8, 2026
**Purpose:** Competitive intelligence, contractor needs analysis, technical architecture, and AI strategy to inform building a world-class AI-first scheduling + dispatch system for trade contractors (5-50+ technicians)

---

**Related docs:** [System Architecture](scheduling-dispatch-architecture.md) · [Build Plan](scheduling-dispatch-build-plan.md) · [AI/ML Research](ai-scheduling-dispatch-research.md) · [ROADMAP.md](../ROADMAP.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Competitive Teardown](#2-competitive-teardown)
3. [What Contractors Actually Need](#3-what-contractors-actually-need)
4. [AI in Field Service Scheduling](#4-ai-in-field-service-scheduling)
5. [Mobile UX Patterns](#5-mobile-ux-patterns)
6. [Technical Architecture](#6-technical-architecture)
7. [Integration with Other Firmcraft Phases](#7-integration-with-other-firmcraft-phases)
8. [Strategic Recommendations](#8-strategic-recommendations)

---

## 1. Executive Summary

The field service management (FSM) market is $2.34B in 2026, growing at 10-21% CAGR. The scheduling/dispatch segment is the most contested — and the most broken.

**The core finding:** There is a massive gap at the 5-50 technician level. ServiceTitan is the only platform with genuinely intelligent AI dispatch, but it costs $250-500/tech/month plus $5K-50K implementation fees and takes 6-12 months to deploy. Everything below ServiceTitan (Jobber, Housecall Pro, FieldPulse) offers drag-and-drop calendars with zero AI dispatch intelligence. Nobody offers ServiceTitan-grade scheduling intelligence at an accessible price point.

**Key market gaps Firmcraft can exploit:**

- **No one does AI dispatch well AND affordably.** ServiceTitan's Dispatch Pro is sophisticated but enterprise-priced. Workiz has AI answering but weak dispatch. Jobber and FieldPulse have zero AI dispatch.
- **Route optimization is surprisingly absent.** Housecall Pro (200K+ users) has NO route optimization in 2026. ServiceTitan's "Smarter Routing" is still in preview. Only Jobber has a basic production engine.
- **Mobile apps are universally mediocre.** ServiceTitan's crashes and drains battery. FieldEdge looks like 2016. Nobody has built a tech-delightful mobile experience.
- **Emergency re-scheduling is manual everywhere.** When a tech calls out sick or an emergency job arrives, every platform requires manual reshuffling of the entire day.
- **Offline-first is non-existent.** Techs work in basements, attics, and rural areas. No major platform provides full offline functionality.

**The opportunity:** AI-first scheduling at $99-199/month that matches ServiceTitan's dispatch intelligence, deploys in 2 weeks (not 6 months), and runs on a mobile app that's actually pleasant to use in the field. Total infrastructure cost for optimization, routing, ML, and voice features: ~$280-630/month for a 30-tech fleet — the economics support this price point with healthy margins.

---

## 2. Competitive Teardown

### 2.1 ServiceTitan — The Enterprise Incumbent

**Pricing (2025-2026):**
- Per-technician model: $245-$500/tech/month depending on tier
- Three tiers: Starter (~$245-300/tech/mo), Essentials (~$300-400/tech/mo), The Works (~$400-500/tech/mo)
- Implementation fees: $5,000-$15,000 for SMBs; $50,000+ for enterprise
- Add-ons stack fast: Marketing Pro, Phones Pro, Pricebook Pro can add $500-$1,600+/month
- Dispatch Pro (AI add-on): Custom quote through CSM, pricing not published
- Minimum 12-month contract; larger companies pushed to multi-year
- **A 10-tech company budgets roughly $63,000+/year in software fees alone**

**Scale:** IPO December 2024, ~$9B valuation. FY2026 revenue: $961M (24% YoY growth). ~11,800 business customers. ~12% market share in FSM.

**Dispatch Board Features:**
- Central interface with drag-and-drop job assignment, real-time status updates, color-coded job statuses
- G2 rates dispatch functionality at 8.9/10 across 206 reviews
- Real-time GPS technician tracking on map overlay

**Dispatch Pro (AI Add-on) — The Gold Standard:**
- Uses Titan Intelligence ML to auto-assign technicians
- Runs thousands of scenarios factoring in: tech skill/certifications, historical performance (total sales, average tickets, sold memberships, lead conversion probability), GPS proximity/drive time, predicted job value
- Two modes: Auto Mode (fully automated) and Assist Mode (suggestions for dispatcher to approve)
- Reshuffles the dispatch board every 10 minutes during business hours, every hour off-hours
- Optimizes schedules up to 3 days into the future

**Atlas AI Platform (2026):**
- Natural language AI assistant (typed or spoken) that can run reports, locate jobs, dispatch technicians, guide workflows
- Auto-throttles marketing spend when schedules are full; triggers campaigns when demand drops
- AI booking agents and interactive SMS scheduling
- Auto-fills daily logs, generates RFIs and change orders (commercial)

**Mobile App — The Achilles Heel:**
- Rebuilt as "ServiceTitan Field" (early 2026 rollout)
- Major complaints: crashes frequently, drains 20-50% battery during a workday, tiny text designed for tablets not phones, poor Android support, photos fail to upload, in-app calling works "about 25% of the time"
- New Field App described as "extremely clunky, over-engineered, and disjointed"
- Features turn on/off and menu locations change without notice

**What Contractors Love:**
- Depth of dispatch board for large operations (20+ techs)
- Dispatch Pro genuinely reduces dispatcher workload
- Comprehensive all-in-one platform
- Revenue-optimizing dispatch (assigns highest-value tech to highest-value job)

**What Contractors Hate:**
- Cost: Reddit user documented price increase from ~$3K to ~$10K/month in Feb 2026. BBB complaint documented $22K+ billing error
- Setup: G2 Ease of Setup score 6.8/10 (lowest category). Takes 2-12 months to implement. "Onboarding rep is overworked and not available to help you build the system around your business"
- System feels "excessively rigid" — teams create workarounds because they don't operate in a "cookie-cutter" way
- Data hostage: Multiple users report significant difficulty exporting data after cancellation; some needed lawyers
- Support: Tickets drag on for weeks, repeated escalations, limited follow-through

**Firmcraft Takeaway:** ServiceTitan's Dispatch Pro is the benchmark for AI dispatch quality. The goal is to match that intelligence at 1/10th the price, with a mobile app that doesn't make techs want to throw their phone.

---

### 2.2 Jobber — Mid-Market Leader

**Pricing (2025-2026):**
- Core: $29/month (1 user) — basic scheduling, invoicing, online payments
- Connect: $89/month (up to 5 users) — GPS tracking, QuickBooks sync, automations
- Grow: $149/month (up to 10 users) — two-way texting, marketing tools, quote add-ons
- Extra users: $29/month each on team plans
- Annual billing: up to 40% savings
- 14-day free trial, no credit card required

**Scale:** 100,000+ customers as of May 2026, 400,000+ service professionals using it daily. $167.5M ARR (2024). ~4.24% market share.

**Scheduling & Dispatch Features:**
- Rebuilt scheduling engine in October 2025 — significant improvements
- Drag-and-drop calendar with day, week, month, list, and map views
- Color coding and filters for team availability and job type
- New route optimization engine (2026): reoptimizes routes on the fly, arranges visits to reduce backtracking. Available on Connect and Grow plans.
- "Find a Time" highlights open slots on calendar for new jobs
- GPS Waypoint Tracking: records tech location when they take actions (clock in/out, job status changes). Not continuous real-time.

**Critical Limitations:**
- Dispatching is still 100% manual drag-and-drop
- NO AI-powered technician assignment considering skills, location, or workload
- No scheduling conflict alerts or automatic double-booking prevention
- Scales poorly past ~30 techs

**AI Features:** AI quote drafting, AI-powered Marketing Suite (2026). **No AI dispatch** — biggest gap.

**Mobile App:** 4.5+ stars on both app stores. Capterra: 4.7/5 (2,822 reviews). Generally praised for reliability and ease of use.

**What Contractors Love:** Clean interface, most owners operational within a day. Transparent pricing, self-serve onboarding. Strong calendar visibility.

**What Contractors Hate:** No AI dispatch. Map/routing limitations (doesn't show exact routes, no bridge/one-way awareness). QuickBooks integration: ~2% of line items drop during sync, auto-sync frequently breaks. Allows double-booking without warning.

---

### 2.3 Housecall Pro — Mid-Market

**Pricing (2025-2026):**
- Basic: $59/mo (annual) / $79/mo (monthly) — 1 user. Core scheduling, dispatching, invoicing. NO GPS, no QuickBooks.
- Essentials: $149/mo (annual) / $189/mo (monthly) — up to 5 users. GPS tracking, two-way QuickBooks sync.
- MAX: $329/mo (monthly) — up to 8 users. Advanced reporting, open API access.
- Extra users: $35/month each
- 14-day free trial

**Scale:** 200K+ Pros. ~7,713 companies using HCP for scheduling. Primarily US market.

**Scheduling & Dispatch Features:**
- Drag-and-drop dispatch board
- Real-time GPS tracking (Essentials+ plans)
- Proximity-based technician assignment for emergency requests
- Automated customer notifications
- **NO ROUTE OPTIMIZATION on any plan as of Feb 2026** — techs must plan own routes or use Google Maps. This is a huge gap.

**AI Features (Fall 2025 / 2026):**
- AI-powered dispatching assistance: matches incoming jobs to available techs based on location, skill set, and schedule
- CSR AI: AI-powered call answering and job booking
- Generative AI: drafts follow-up emails and estimates
- Targeting 40% reduction in admin time

**Mobile App:** iOS: 4.5/5 stars. Android: 3.3/5 stars (significant gap). Trustpilot declining: from 3.7/5 (Aug 2024) to 2.9/5 (late 2025).

**What Contractors Hate:** No route optimization (#1 missing feature). Hidden cost / add-on trap (most common reason businesses leave). Frequent glitches during peak hours. Scales awkwardly past 10 techs.

---

### 2.4 FieldPulse — Growing Competitor

**Pricing:** Essentials ~$65/user/month, Professional ~$90/user/month, Premium ~$115/user/month. Pricing requires demo/quote. GPS fleet tracking add-on via Azuga ~$30/vehicle/month.

**Standout Feature:** Uniquely ties projected margin, labor cost, and material expense directly into dispatch decision before tech assignment. Gantt chart views alongside map-based scheduling.

**Mobile App:** iOS: 4.6/5, Android: 4.5/5 — generally the best-rated mobile experience among competitors.

**Weaknesses:** Pricing bugs (different numbers on edit screen, client-facing estimate, and PDF). Basic reporting. QuickBooks Desktop integration creates duplicates. No AI features.

---

### 2.5 GorillaDesk — Pest Control / Lawn Care Focused

**Pricing:** Basic ~$49-65/month (1 tech), Pro ~$99/month, Growth ~$299/month.

**Standout Feature:** Purpose-built for route-based recurring services with strong recurring scheduling. FIFRA-compliant chemical application tracking (regulatory requirement for pest control). Route optimization groups jobs by location for recurring service.

**Weaknesses:** ~20% of users report slow syncing and no reliable offline. No real-time traffic awareness. Manual rebalancing when a tech calls out.

---

### 2.6 Workiz — Locksmith / Appliance Repair Focused

**Pricing:** Starter $65/month (2 users), Standard $169/month (6 users), Ultimate $299/month (unlimited). Phone system add-on: $19/user/month (built-in VoIP/call tracking).

**Standout Feature: "Genius Answering" (Jessica AI)** — An AI dispatcher that answers calls, emails, and texts; has live conversations with clients; schedules/reschedules jobs within policies; automates job assignments based on tech availability, location, and skill set; handles any volume of incoming communications. Saves teams up to 20% of manual effort. Fully customizable rules.

**Weaknesses:** Mobile app freezes mid-job. Android version noticeably lags behind iOS. Won't save comments or finance items at times.

---

### 2.7 Other Players — Quick Overview

**mHelpDesk:** ~$99-169/user/month. Supports scheduled and unscheduled workflows, one-time and recurring appointments. Good for mixed work types. Aging platform, limited AI.

**FieldEdge:** ~$100-125/user/month. Centralized dispatch board with drag-and-drop. 45+ year history in HVAC. Coolfront flat-rate pricing integration. **No native AI dispatcher, no AI receptionist, no announced 2026 AI roadmap.** Mobile UI looks like 2016. Support degraded after Xplor acquisition.

**Kickserv:** START $60/month (5 users), RUN $119/month (10 users), SCALE $199/month (20 users). Best value per-user pricing in the market. Simple, low-learning-curve. Good customer support. No AI features. Mobile app has glitches.

---

### 2.8 GoHighLevel — CRM-First Platform

**Pricing:** Starter $97/month, Pro $297/month, Agency SaaS Pro $497/month.

**Verdict: It doesn't do field service scheduling.** GoHighLevel is a CRM and marketing automation platform. No job estimation, no dispatch, no field operations. The recommended contractor stack is GoHighLevel for marketing + CRM paired with Jobber/HCP/ServiceTitan for operations, connected via Zapier.

**Relevance to Firmcraft:** GoHighLevel's AI call answering, automated SMS follow-up, and lead capture are directly relevant to Phase 1 (AI Phone) and Phase 5 (Digital Ops). Their HVAC-specific "Snapshots" (pre-built campaigns) show there's appetite for vertical-specific marketing automation.

---

### 2.9 Cross-Competitor Comparison Matrix

| Feature | ServiceTitan | Jobber | Housecall Pro | FieldPulse | Workiz |
|---|---|---|---|---|---|
| **Monthly cost (5 techs)** | ~$1,500-2,500 | ~$149-208 | ~$149-254 | ~$325-450 | ~$169 |
| **AI dispatch** | Yes (Dispatch Pro) | No | Partial (2025+) | No | Yes (Jessica AI) |
| **Route optimization** | Coming summer 2026 | Yes (2025+) | NO | Basic (nearest) | No |
| **Real-time GPS** | Yes | Waypoint-based | Yes (Essentials+) | Add-on ($30/veh) | Yes |
| **Mobile app quality** | Poor (crashes/battery) | Good (4.5★) | Mixed (iOS good, Android poor) | Good (4.5-4.6★) | Poor (crashes) |
| **Setup time** | 2-12 months | Same day | Days | Days | Days |
| **Free trial** | No | 14 days | 14 days | Demo only | 7 days |
| **AI booking/answering** | Yes (Atlas) | No | Yes (CSR AI) | No | Yes (Jessica) |
| **Offline support** | Limited | None | None | None | None |
| **Best for** | 20+ techs, enterprise | 1-30 techs, SMB | 5-20 techs | 3-15 techs | On-demand trades |

---

## 3. What Contractors Actually Need

### 3.1 The Manual Methods Gap

For every field service business using FSM software, approximately **seven still use paper**. Spreadsheets, whiteboards, and paper calendars remain commonplace. Manual systems cost an average of $4,800 per employee yearly in lost productivity and errors. One prospect was using "an amalgamation of Outlook, spreadsheets, and post-it notes" to schedule field work orders. On-call rotations at most companies are managed with "a whiteboard, a group text, or the same two reliable techs who always answer."

### 3.2 Critical Workflow: Emergency / Same-Day Dispatch

74% of homeowners expect service within 24 hours when HVAC is out; 30% want same-day. HVAC emergency dispatch targets 30-45 minute response for residential; plumbing targets 45-60 minutes for active leaks.

**Current process:** Dispatchers check GPS map to find nearest qualified tech, then manually reassign. A morning of routine drain cleanings can flip in 15 seconds into an emergency main-line break that needs the right tech, right truck inventory, and right ETA — all reassigned without dropping the day's other jobs.

**Pain point:** Assigning the "next available" tech without checking location sends someone across town. Dispatchers stay in reaction mode all day — scheduling becomes chaotic not because of bad decisions but because the operation is constantly trying to catch up.

**Firmcraft opportunity:** AI that instantly re-optimizes the entire day's schedule when an emergency arrives, factoring in tech location, skill, truck inventory, and remaining customer commitments.

### 3.3 Critical Workflow: Recurring Maintenance

42% of homeowners currently subscribe to an HVAC maintenance plan; 37% more are interested. Nearly 80% have or want one. Smart contractors shift maintenance from busy season to slow months — moving June/July visits to Feb/March/April to "flatten the curve."

**Pain points:** No software handles the "sell-schedule-execute-renew" lifecycle seamlessly. Getting 500+ maintenance agreements scheduled across the right seasons while respecting tech zones and skills is a manual planning nightmare.

**Firmcraft opportunity:** AI that proactively schedules maintenance visits in slow periods, optimizing across zones and tech availability, with intelligent customer communication timing.

### 3.4 Critical Workflow: Multi-Day Projects

A bathroom remodel or system install spans days/weeks with hard dependencies — demolition, rough plumbing, rough electrical, waterproofing, tile, fixture installation, final trim. One delayed phase pushes everything downstream. Jobber's scheduling logic is built for visit-based recurring work; multi-day projects hit limitations quickly. Job forms reset every visit. ServiceTitan is service-first and doesn't handle project workflows well either.

**Firmcraft opportunity:** Project-aware scheduling that respects dependencies, tracks phase completion, and automatically ripples delays through downstream schedules.

### 3.5 Critical Workflow: Warranty Callbacks

Dispatchers identify the original tech and service type, notify the tech and service manager, dispatch the original tech if possible. Most systems don't auto-match callbacks to original techs. Tracking callbacks per tech requires manual reporting.

**Firmcraft opportunity:** Automatic warranty detection that routes to original tech, tracks callback rates per tech, and flags patterns (parts failure vs. workmanship).

### 3.6 Capacity Planning

AC repair demand spikes 266% from winter to peak summer. Average HVAC tech handles 10-12 calls/day during peak, generating $200-$650 per call. HVAC labor shortage is worsening — companies can't simply hire more techs. Capacity comes from better utilization of existing staff.

**Firmcraft opportunity:** AI-driven demand forecasting tied to weather data, historical patterns, and service agreement obligations — pre-positioning techs and inventory before the surge.

### 3.7 Multi-Technician Considerations

**Skill-based routing:** Apprentices, journeymen, and masters have different capabilities. Moving from 1 to 2 skills per technician reduces travel time by 23%. Over 200 working days, that's 88 hours/year saved per tech. Most platforms use basic tags or no skill matching at all.

**Drive-time optimization — the clearest ROI story:** Average field service tech loses 40%+ of workday to travel, idle time, and scheduling inefficiency. A tech earning $25/hour spending 2.5 hours daily driving = $15,625/year in drive-time cost per employee. Across 25 techs: nearly $400,000/year. A Houston HVAC firm's techs spent 2.5 hours/day in traffic due to poor manual scheduling. After route optimization, billable hours increased from 5.5 to 7.5/day WITHOUT increasing shift length — an additional $1,200/day in billable labor across the fleet. Route optimization typically delivers 25-35% less drive time.

**Customer preferences:** Customers do request specific techs. CRMs store this in customer profiles, but dispatching systems rarely honor it automatically. The preference is noted in a CRM field but the dispatcher has to manually check and override.

**Zone-based assignment:** Companies divide territories by ZIP code, county, or custom-drawn zones. Pain point: static zones don't adapt to demand fluctuations.

### 3.8 Communication Patterns

**How techs get schedules today:** Mobile app with push notifications (modern), text messages/phone calls/printed sheets (still common), group texts and whiteboards (legacy).

**Mid-day changes:** Dispatchers communicate via in-app or text. By mid-morning, phones drive the schedule instead of the other way around because the office handles more calls than the system can manage.

**Customer expectations:** 50% of homeowners prefer phone calls, 24% prefer text, 12% prefer online/app (FIELDBOSS survey). Automated arrival notifications 15-20 minutes before arrival result in 30-40% fewer missed appointments. **38% of homeowner frustrations are communication-related vs. 21% citing price — communication outranks pricing as the #1 pain point.**

**When jobs run long:** Entirely manual — no existing software automatically detects a running-long job, calculates cascading impacts, and proposes the optimal re-shuffle.

### 3.9 Industry-Specific Challenges

**HVAC:** 266% seasonal demand increase. Equipment pickup from warehouse adds complexity. Growing labor shortage. 51% of homeowners have smart thermostats; techs increasingly need connected-system skills.

**Plumbing:** Emergency-heavy — burst pipes don't wait. Unpredictable duration — problems behind walls consistently reveal surprises. Industry advice: overestimate job duration by 30% and add 30-45 minutes between calls.

**Electrical:** Panel upgrades require 3 inspections (cover, service, final) plus utility coordination (2-3 weeks notice). Multi-visit requirements with dependency on external parties (inspector availability, utility timing).

**Cross-trade:** Weather halts outdoor work. Smart ops reserve 2 slots/day as buffer. 51% of repeat visits caused by insufficient/incorrect parts on site. Customer no-show rate: 5-15%, costing small businesses $26,000+/year.

### 3.10 First-Time Fix Rate: The Hidden Scheduling Problem

Average FTFR: 75% industry standard — meaning 25% of jobs need a return trip. Top cause: missing parts (51%), followed by wrong tech skills (25%), insufficient time allocated (13%). Cost per failed visit: $200-$300 per truck roll. At 500 calls/day with 75% FTFR, that's 125 repeat dispatches costing $25,000-$37,500 daily. 57% of customers want better first-time fix rates — it's the single largest factor in customer defection.

**Firmcraft opportunity:** Pre-verify parts availability before dispatching, match tech skills to job requirements, allocate realistic time blocks based on historical data.

### 3.11 Dispatcher Burnout

When calls pour in faster than dispatchers can handle, even seasoned professionals get overwhelmed. Many businesses rely on "heroic" dispatchers or owners who step in daily — problems solved manually, not systematically. Overbooking techs to cope with shortages leads to burnout, rushing, rework, and turnover. The dispatcher role is the single biggest bottleneck — and the single biggest opportunity for AI augmentation.

---

## 4. AI in Field Service Scheduling

### 4.1 Route Optimization Algorithms

The field service scheduling problem maps to the Vehicle Routing Problem with Time Windows (VRPTW) — a well-studied NP-hard optimization problem with excellent practical solvers.

**Primary Recommended Solver: VROOM (via pyvroom)**
- Solves 200-stop / 30-vehicle problems in milliseconds
- Built-in skills matching (tech qualifications → job requirements)
- BSD license, Python bindings via `pyvroom`
- Handles time windows, vehicle capacities, skill requirements
- Fast enough for real-time re-optimization when emergencies arrive

**Backup: Google OR-Tools**
- More powerful for complex constraints (break scheduling, overtime rules, multi-depot)
- Slower than VROOM for simple problems but handles edge cases better
- MIT license, Python/C++/Java

**Commercial APIs:**
- Google Routes API (fleet routing): $30/1,000 fleet routing visits. Post-March 2025 pricing. Traffic-aware.
- Routific: $39-149/vehicle/month. Good REST API, handles dynamic re-routing.
- OptimoRoute: Similar pricing tier to Routific.

**Computational Reality:** A 30-tech fleet can be fully re-optimized in under 1 second using VROOM. This supports real-time re-dispatching when jobs run long, emergencies arrive, or techs call out. This is not a theoretical capability — it's production-feasible today.

### 4.2 Predictive Scheduling

**Job Duration Prediction — Highest ROI ML Feature:**
- XGBoost/LightGBM on historical data
- Features: job type, tech experience level, equipment age, ZIP code (property age/size proxy), season, time of day, customer history
- Expected accuracy: 15-25 minute MAE with 6 months of training data, dropping below 15 minutes after 12 months
- Direct impact: More realistic time blocks → fewer cascading delays → more jobs completed per day

**Cancellation/No-Show Prediction:**
- Random forest or logistic regression on customer history
- Features: customer tenure, appointment time, weather forecast, day of week, distance from service area center, previous no-show history
- Allows strategic overbooking (like airlines) for high-probability no-show slots

**Demand Forecasting:**
- Time series models (Prophet, ARIMA, LSTM) on historical job volume
- External signals: weather forecast (temperature → HVAC demand), housing data (new construction → electrical/plumbing), seasonal patterns
- Enables proactive capacity planning: hire seasonal techs, shift maintenance visits, pre-position inventory

### 4.3 Smart Dispatching / Auto-Assignment

**Multi-Objective Optimization:**
The dispatch decision must simultaneously optimize across competing objectives:
1. Minimize drive time (route efficiency)
2. Maximize revenue (high-value tech → high-value job)
3. Balance workload (prevent burnout, ensure fairness)
4. Honor customer preferences (requested tech, time window)
5. Match skills (right qualifications for the job)
6. Minimize parts risk (truck inventory matches job needs)

**ServiceTitan's approach (the benchmark):** Dispatch Pro simulates hundreds of scenarios, scores them on weighted objectives, and reshuffles the board every 10 minutes. It factors in historical tech performance (close rates, average ticket) to maximize revenue.

**Firmcraft's approach should be:** VROOM for route optimization + custom scoring layer for revenue/skill/preference matching + real-time re-optimization triggered by events (new job, job running long, tech status change). This achieves comparable intelligence at a fraction of the cost because VROOM is open-source.

### 4.4 Natural Language Job Creation

Voice-to-schedule is now production-feasible:
- **Whisper V4:** ~3.2% WER (clean audio), 8-12% on real-world calls
- **LLM structured outputs (Claude/GPT-4o):** Guarantee valid JSON entity extraction
- **Example flow:** "Book a furnace inspection for Mrs. Johnson at 2pm Thursday, send Dave" → Parse entities (customer: Johnson, service: furnace inspection, time: Thursday 2pm, tech: Dave) → CRM lookup (find Mrs. Johnson's address) → Availability check (is Dave free Thursday 2pm?) → Conflict detection → Confirm or suggest alternatives

The hard part is the deterministic validation layer (CRM lookup, availability check, conflict detection), not the AI parsing. The LLM extracts intent; business logic validates and executes.

### 4.5 What Competitors Actually Ship vs. Claim

**ServiceTitan Dispatch Pro:** Legitimately sophisticated. Real ML, real multi-scenario optimization, real revenue-aware dispatching. The benchmark.

**ServiceTitan Atlas:** Real natural-language AI assistant. Can take actions (not just report). The most advanced AI in FSM.

**Jobber "smart scheduling":** Basic rules engine + new route optimization. No ML. Marketing describes AI features but they're limited to quote drafting and marketing campaigns.

**Housecall Pro AI dispatch:** Announced Fall 2025. Matches jobs to techs based on location, skill, schedule. Unclear how sophisticated the matching actually is — likely rule-based, not ML.

**Workiz Jessica AI:** Real AI answering agent that handles calls, emails, texts and can schedule jobs. Impressive for inbound communication handling. Dispatch optimization itself is basic.

**Everyone else:** No real AI. FieldPulse, GorillaDesk, FieldEdge, Kickserv, mHelpDesk — all manual dispatch only.

### 4.6 Emerging AI Approaches

**LLM-powered dispatch assistants:** Conversational scheduling where the dispatcher (or customer) describes what they need in natural language and the system figures out the optimal assignment. ServiceTitan's Atlas is pioneering this.

**IoT integration:** Smart thermostat data → proactive HVAC scheduling. 51% of homeowners have smart thermostats. Connected equipment can report performance degradation before failure, triggering proactive service visits.

**Predictive maintenance:** Equipment data → schedule service before failure. Companies that pre-identify issues through proactive monitoring see significant reduction in emergency calls and increase in maintenance contract renewal.

**Computer vision for job documentation:** Photo → AI diagnosis. Tech takes a photo of a condenser unit; AI identifies the model, age, and visible issues, suggests parts needed.

### 4.7 Infrastructure Cost Estimate

For a 30-tech fleet:
- Route optimization (VROOM, self-hosted): ~$0 (runs on existing compute)
- Distance/duration matrix (Google Routes API): ~$150-300/month
- ML inference (job duration, demand forecasting): ~$50-100/month (GPU instance or serverless)
- Voice transcription (Whisper): ~$30-80/month
- LLM API calls (entity extraction, NL interface): ~$50-150/month
- **Total: ~$280-630/month**

This comfortably supports a $99-199/month retail price point. ServiceTitan charges $2,500-5,000/month for comparable (arguably inferior, except for Dispatch Pro) capabilities.

---

## 5. Mobile UX Patterns

### 5.1 Current Market — App Quality

| Platform | iOS Rating | Android Rating | Key Strength | Key Weakness |
|---|---|---|---|---|
| ServiceTitan | Mixed | Poor | Feature depth | Crashes, battery drain, data loss |
| Jobber | 4.5+ | 4.5+ | Reliability, simplicity | Basic features |
| Housecall Pro | 4.5 | 3.3 | Upselling tools | Android lag, glitches at peak |
| FieldPulse | 4.6 | 4.5 | Best-rated overall | Loading issues in field |
| Workiz | Mixed | Poor | Integrated VoIP | Crashes mid-job, data loss |

**The opportunity:** Nobody has built a mobile app that techs actually love using. ServiceTitan rebuilt their app ("Field Pro") achieving 99.99% crash-free rate, but it's over-engineered with too many screens. Jobber is reliable but basic. The field is wide open for a mobile-first, tech-delightful experience.

### 5.2 Design Principles for Field Technicians

**One-Handed Operation (Three-Zone Model):**
- Bottom third (easy reach): All primary actions — job status changes, navigation, camera
- Middle third (neutral): Secondary controls
- Top third (stretch zone): Informational content only — customer name, address, job notes

**Touch Targets:**
- WCAG 2.2 minimum: 44x44pt (iOS) / 48x48dp (Android)
- For gloved operation: 56-64dp recommended
- Generous padding between interactive elements
- Avoid swipe-to-reveal patterns (hard with thick gloves); prefer explicit, visible buttons

**Outdoor Visibility:**
- High contrast mode option for sunlight conditions
- Auto-scaling UI elements in bright ambient light
- Monochrome/high-contrast emergency mode

**Voice Input:**
- 75% of field service firms expected to use voice by 2026
- Hands-free voice can increase tech productivity by ~20%
- On-device speech-to-text (Whisper, ML Kit) works offline
- Voice commands for common actions: "Mark job complete," "Add note: replaced capacitor," "Call customer"

**Performance Targets:**
- Cold start under 2.5 seconds
- Time-to-first-interaction under 2 seconds
- Apps taking 3+ seconds see 40% higher bounce rates

### 5.3 Best-in-Class Patterns from Gig Economy Apps

**From Uber Driver:**
- Earnings transparency dashboard (techs care about pay per job)
- Simple accept/decline with countdown timer
- Turn-by-turn navigation integrated in app
- Automatic status transitions based on location (approaching → arrived → departed)

**From DoorDash Dasher:**
- Multi-job route view showing entire day's sequence
- Per-job visibility before acceptance
- Photo proof + swipe to complete
- Batched job assignments rather than one-at-a-time dispatch

**From Amazon Flex:**
- Barcode/label scanning for equipment identification
- Photo-based completion confirmation
- Route optimization that techs can manually override (trust local knowledge)
- Time-window awareness

**Cross-cutting patterns to adopt:**
- Earnings transparency: show techs what they'll earn per job
- Shift/availability control: let techs set when they're available
- Quick onboarding: new tech productive within first session
- Real-time updates: job availability, schedule changes, earnings — all pushed instantly

### 5.4 Offline Capabilities — Non-Negotiable

300,000+ US field service techs work in basements, equipment rooms, remote sites, and areas with no signal. Offline-first is the primary operating mode for HVAC techs in attics, electricians in panels, plumbers in basements.

**What must be available offline:**

| Data Category | Offline Requirement | Sync Priority |
|---|---|---|
| Today's schedule | Full read/write | High — sync immediately on reconnect |
| Customer info | Full read | Medium |
| Job details | Full read/write | High |
| Pricing/parts catalog | Read-only cache | Low — sync daily |
| Photos/signatures | Write (capture) offline, upload on reconnect | Medium |
| Forms/checklists | Full read/write | High |
| Navigation/maps | Cached tiles for service area | Low — pre-cache |
| Invoicing | Full read/write | High |

**Sync Strategy:** Field-level merge with last-write-wins per field, plus business rule validation on sync. When a real conflict occurs (e.g., two dispatchers assign same tech to overlapping jobs), surface it to the dispatcher for resolution rather than auto-resolving.

**PWA vs. Native:** Native wins for field service. PWAs fall short for complex offline-first use cases. iOS Safari evicts PWA storage after ~7 days of inactivity. Background sync and continuous location tracking require native capabilities.

### 5.5 Photo/Signature/Document Capture

**Photo workflow:** Standard set per job — wide context shot, detail shot of problem, "after" photo of completed repair. Photos attach directly to work order, not phone gallery. Before/after pairing built into the "Job Complete" flow so it's not skippable.

**Photo annotation:** Circling problems, adding notes on images. Web: Konva.js / react-konva. Mobile: react-native-sketch-canvas or WebView wrapper.

**Digital signatures:** Signature Pad (szimek/signature_pad) — lightweight, no dependencies, canvas-based. The standard choice.

**OCR for equipment labels:** Google ML Kit Text Recognition v2 — on-device, works offline, free. Capture image → ML Kit text recognition → regex match against serial/model patterns → auto-populate equipment fields.

---

## 6. Technical Architecture

### 6.1 Recommended Stack

| Layer | Technology | Why |
|---|---|---|
| **Mobile App** | React Native + Expo | Cross-platform native, offline-first, hot updates via OTA |
| **Offline Storage & Sync** | PowerSync (SQLite ↔ Postgres) | Field-level merge, automatic sync, React Native SDK |
| **Backend** | Supabase (Postgres + Realtime + Auth + Storage + Edge Functions) | Postgres foundation enables AI features naturally |
| **Dispatch Board** | FullCalendar Premium | Resource timeline view (techs as rows, time as columns), 19K+ GitHub stars |
| **Map View** | Mapbox GL JS | 5x cheaper than Google Maps, full style control |
| **Real-Time Updates** | Supabase Realtime | DB changes automatically broadcast to all connected clients |
| **Route Optimization** | VROOM (pyvroom) | Solves 200-stop / 30-vehicle in milliseconds, BSD license |
| **Distance Matrix** | Google Routes API | Traffic-aware, $30/1K fleet routing visits |
| **Geofencing** | Radar.io | Free tier for 1K users, auto clock-in/out, handles OS limitations |
| **Push Notifications** | Firebase Cloud Messaging | Free, reliable, unlimited messages |
| **Photo/Media** | expo-camera + react-native-compressor + Cloudinary | Capture, compress, CDN delivery |
| **OCR** | Google ML Kit v2 | On-device, free, offline-capable |
| **Signatures** | Signature Pad (szimek) | Lightweight, no dependencies |
| **Calendar Sync** | Google Calendar API + Microsoft Graph API | One-way push from dispatch system |

### 6.2 Real-Time Dispatch Board Architecture

**Hybrid approach:**
- **SSE (Server-Sent Events)** for the dispatch board view — server pushes job updates, tech location updates, schedule changes to all connected dispatchers. SSE is dramatically underused; it covers most real-time dispatch needs with far less operational complexity than WebSocket.
- **WebSocket** only for drag-and-drop interaction layer — dispatcher actions needing immediate bi-directional acknowledgment.

**Supabase Realtime as infrastructure:** Postgres Changes subscribe to database changes via logical replication. When a job is created/updated/assigned in Postgres, all connected dispatch boards get the update automatically. Broadcast handles tech location pings. Presence tracks which dispatchers are online.

**Scaling:** Free tier supports 50K MAU and 500 concurrent connections. Pro ($25/month) handles more.

### 6.3 Tech Location Updates

- Every 30-60 seconds while on a job, every 5 minutes when driving between jobs
- Adaptive polling: iOS significant location changes API (low power, ~500m accuracy) as baseline, switch to GPS near geofence boundaries
- Data payload: ~100 bytes per update ({tech_id, lat, lng, timestamp, accuracy, speed, heading})
- For 50 technicians: ~50-100 location updates/minute — trivial server load

### 6.4 Calendar Integration Strategy

Your dispatch system is the **source of truth** for scheduling. One-way push to external calendars (Google/Outlook) for tech visibility only. If a tech creates an event in their personal calendar, treat it as a "blocked time" rather than a job. Your system always wins for job scheduling; external calendar events create availability constraints only. This avoids the nightmare of true two-way sync with conflict resolution across platforms.

Google Calendar API rate limits require care with 50+ tech calendars — use push notifications (webhooks) rather than polling, implement incremental sync (sync tokens), spread operations throughout the day, use batch requests.

### 6.5 Mapping Cost Estimate

**Mapbox for dispatch board** (cheaper, customizable):
- 50K free map loads/month
- Geocoding: $0.75/1K (vs. Google's $5/1K)
- Full style control for the dispatch map view

**Google Maps for tech navigation** (what techs already use):
- "Navigate" button opens Google Maps/Waze on tech's phone
- No API cost for external navigation links

**Google Routes API for fleet routing:**
- $30/1K fleet routing visits
- ~$150-300/month for a 30-tech fleet

### 6.6 Open Source Alternatives Worth Evaluating

**Scheduling UI:** FullCalendar (19K+ stars, MIT for basic, commercial for premium), react-big-calendar (8.5K stars, free), DHTMLX Scheduler (GPL/commercial).

**Routing engines:** OSRM (open-source routing, self-hosted, no API costs), Valhalla (Mapbox's open-source routing engine).

**Offline/sync:** PowerSync, WatermelonDB (built for React Native, SQLite backend, native thread), RxDB (reactive offline DB with sync adapters).

**Real-time:** Supabase Realtime (Postgres-native), Socket.io (self-hosted), Ably (managed).

**FSM platforms (none sufficient but architecturally instructive):** Odoo Community + OCA Field Service, ERPNext (field service inside full ERP), Resgrid (open-source dispatch, more suited for emergency services).

---

## 7. Integration with Other Firmcraft Phases

### 7.1 Phase 1 → Phase 2: AI Phone → Scheduling

When a customer calls and the AI phone agent handles it:

1. **Intent detection:** AI identifies the call is a service request (vs. billing question, complaint, etc.)
2. **Entity extraction:** Customer name, service type, urgency level, preferred time, preferred tech
3. **Real-time availability check:** Phone agent queries the scheduling system for available slots
4. **Smart slot selection:** System considers tech skills, location proximity, customer history, revenue optimization
5. **Booking confirmation:** Phone agent confirms the appointment, sends SMS/email confirmation
6. **Auto-dispatch:** Job appears on dispatch board, tech gets notification

**Critical integration points:**
- Phone system must have real-time read access to scheduling availability
- New jobs created by phone agent must trigger dispatch board updates instantly (Supabase Realtime)
- Emergency calls must trigger re-optimization (VROOM re-solves in <1 second)
- Customer preferences stored in CRM must be accessible during phone booking

### 7.2 Phase 2 → Phase 3: Scheduling → Online Booking Widget

Online booking is pulled forward as the next module after scheduling — it depends on the availability engine, not on invoicing. Customers self-book from an embeddable widget:

1. **Self-scheduling:** Customer books from available time slots (filtered by service type, zone, skill requirements) via an embeddable widget on the contractor's site or a QR code
2. **Appointment status:** Scheduled, tech en route, tech arrived, in progress, complete
3. **ETA updates:** "Your technician Dave is 20 minutes away" with live map tracking
4. **Rescheduling:** Customer can reschedule non-emergency appointments through the self-service portal
5. **History:** Past appointments, technician assigned, work performed, photos

**Critical integration points:**
- Scheduling must expose a public-safe availability API (tenant-scoped widget key) so the widget can check slots without an end-user login
- Self-scheduling only shows genuinely available slots (capacity-aware, not just calendar gaps)
- Rescheduling triggers re-optimization of affected techs' routes
- Real-time tech location (with customer consent) feeds into "tech is X minutes away"
- Automated notifications at key status transitions

### 7.3 Phase 2 → Phase 4: Scheduling → Invoicing

When a tech completes a job:

1. **Job completion triggers:** Tech marks job complete in mobile app, captures after photos, collects signature
2. **Auto-populate invoice:** Service type, labor hours (calculated from clock-in/out), parts used (from job form), travel time
3. **Pricing rules:** Apply flat-rate pricing, time-and-materials, or membership discounts automatically
4. **Approval flow:** Tech reviews invoice on-site, customer signs, invoice sent
5. **Revenue tracking:** Completed job updates revenue dashboards

**Critical integration points:**
- Job timer (arrival → departure) feeds into labor hours on invoice
- Parts used during job (tracked in job form) auto-populate invoice line items
- Membership/warranty status affects pricing automatically
- Warranty callbacks marked as $0 invoice with internal tracking

### 7.4 Phase 2 → Phase 5: Scheduling → Digital Ops

The scheduling system must talk to the marketing system:

1. **Capacity-aware marketing:** When schedule is 90%+ full, throttle ad spend and lead generation. When schedule is <60% full, increase marketing. ServiceTitan's Atlas already does this.
2. **Maintenance campaign timing:** When scheduling capacity is available in slow months, trigger maintenance reminder campaigns to fill the schedule
3. **Review solicitation:** The review flywheel already ships within Phase 2 (job complete → SMS review request → Google review link → AI-drafted response); Digital Ops absorbs it into its reputation dashboard rather than rebuilding it
4. **Service area marketing:** Digital Ops knows which ZIP codes have capacity for new customers vs. which are saturated

**Critical integration points:**
- Real-time capacity signal (% schedule filled) exposed to Digital Ops
- Completed job events trigger post-service marketing workflows (review requests are already wired in Phase 2)
- Service area utilization data informs geographic ad targeting
- Maintenance agreement status drives renewal campaign timing

### 7.5 Scheduling → Office Dashboard (cross-cutting — built incrementally)

The office dashboard is no longer a standalone phase; each module ships its dashboard tabs into the admin panel as it lands. Scheduling contributes the Job Board and Tech Utilization tabs. Key scheduling KPIs that matter:

| KPI | What It Measures | Target |
|---|---|---|
| **Jobs/tech/day** | Technician utilization | 6-8 for service, 1-2 for installs |
| **Drive time %** | Route efficiency | <25% of workday |
| **First-time fix rate** | Dispatch quality | >85% |
| **Revenue/tech/day** | Profitability | Trade-specific benchmarks |
| **Callback rate** | Work quality | <5% |
| **On-time arrival %** | Customer experience | >90% |
| **Average job duration** | Scheduling accuracy | Actual vs. predicted |
| **Emergency response time** | Emergency dispatch quality | <45 min |
| **Schedule fill rate** | Capacity utilization | >80% |
| **Customer wait time** | Booking to service | <48 hours non-emergency |

**Critical integration points:**
- All metrics derived from scheduling data (job timestamps, tech locations, completion records)
- Real-time dashboard updates via Supabase Realtime
- Historical trending for seasonal planning
- Per-tech performance breakdowns for coaching

---

## 8. Strategic Recommendations

### 8.1 Firmcraft's Competitive Position

**Target:** The 5-50 technician trade contractor that is either (a) outgrowing Jobber/HCP but can't afford ServiceTitan, (b) stuck on ServiceTitan and drowning in cost/complexity, or (c) still using spreadsheets and whiteboards because nothing fits.

**Price point:** $99-199/month for the scheduling module. Infrastructure costs of $280-630/month for a 30-tech fleet support this with healthy margins.

**Deployment speed:** Operational in 2 weeks, not 6 months. Self-serve onboarding with AI-guided setup. This alone is a ServiceTitan killer — their G2 Ease of Setup score is 6.8/10.

### 8.2 Top 10 Differentiation Opportunities

1. **Intelligent Emergency Re-Optimization:** When an emergency arrives, AI reshuffles the entire day across all techs in <1 second — factoring in location, skills, truck inventory, customer priority, and downstream commitments. No existing tool does this automatically.

2. **Offline-First Mobile:** Full functionality without connectivity. Techs in basements, attics, and rural areas work seamlessly. Universal complaint across all competitors.

3. **Predictive Job Duration:** Historical data → realistic time blocks per job type/tech/equipment. Prevents cascading delays. No competitor does this.

4. **Parts-Aware Dispatch:** Check truck inventory against job requirements BEFORE dispatching. Prevent the 51% of failed first visits caused by missing parts.

5. **AI Dispatcher Assistant:** Handle 80% of routine dispatch decisions (which tech, which order, which route) so humans focus on exceptions. Directly addresses dispatcher burnout.

6. **Dynamic Capacity Planning:** Weather-aware, demand-forecasting capacity that adjusts in real-time. Auto-shift maintenance to slow periods. Pre-position for seasonal surges.

7. **Multi-Day Project Support:** Phase-based scheduling with dependency tracking — something the service-first platforms all handle poorly.

8. **Fast Onboarding:** Operational in 2 weeks. AI-guided setup that learns your team, zones, skills, and workflows.

9. **Customer Communication Intelligence:** Right message, right channel, right time. Not just ON/OFF alerts — context-aware notifications that respect time of day and customer preferences.

10. **Fair On-Call Rotation:** Automated, transparent on-call scheduling that tracks hours, ensures equal distribution, handles swaps. Most companies manage this on whiteboards.

### 8.3 Phased Build Recommendation

**Phase 2a (Months 1-3): Smart Dispatch MVP**
- Dispatch board with drag-and-drop (FullCalendar Premium)
- Map view with tech locations (Mapbox)
- VROOM-powered route optimization
- Basic skill matching (tag-based)
- Real-time updates (Supabase Realtime)
- Mobile app: schedule view, job status, navigation, photos
- Offline mode for mobile (PowerSync)

**Phase 2b (Months 3-5): Predictive Intelligence**
- Job duration prediction (XGBoost on historical data)
- Dynamic re-routing when jobs run long
- Emergency dispatch re-optimization
- Automated customer notifications (ETA, delays)
- Parts-aware dispatch (truck inventory check)
- Geofencing for auto clock-in/out (Radar.io)

**Phase 2c (Months 5-7): Voice & Natural Language**
- Voice-to-schedule (Whisper + Claude structured outputs)
- Natural language dispatch ("Move Dave's 2pm to tomorrow and send Mike instead")
- AI dispatch suggestions (Auto mode with human approval)
- Callback/warranty auto-routing

**Phase 2d (Months 7-10): Advanced Optimization**
- Demand forecasting (seasonal, weather-based)
- Capacity-aware marketing integration (Phase 5 Digital Ops connection)
- Multi-day project scheduling
- On-call rotation management
- Revenue-optimizing dispatch (match high-value tech to high-value job)
- Full Phase 1/3/4/5 integrations

### 8.4 The Pitch

"ServiceTitan's Dispatch Pro optimizes schedules across thousands of scenarios every 10 minutes. We do the same thing — but we also work offline in basements, predict how long jobs will actually take, check if the right parts are on the truck before dispatching, and re-optimize your entire day in under a second when an emergency walks in. All for $149/month instead of $63,000/year."

---

## Sources

### Competitor Data
- [ServiceTitan Pricing (FieldCamp)](https://fieldcamp.ai/reviews/servicetitan/)
- [ServiceTitan Pricing (Projul)](https://projul.com/blog/servicetitan-pricing-analysis-2026/)
- [ServiceTitan Dispatch Pro](https://www.servicetitan.com/features/pro/dispatch)
- [ServiceTitan Atlas](https://www.servicetitan.com/features/atlas)
- [ServiceTitan Pantheon 2025 Expansions](https://www.servicetitan.com/press/servicetitan-major-product-expansions-pantheon-2025)
- [ServiceTitan FY2026 Revenue](https://www.stocktitan.net/news/TTAN/)
- [ServiceTitan Reviews (OneCrew)](https://www.getonecrew.com/post/servicetitan-reviews)
- [ServiceTitan Reviews (Capterra)](https://www.capterra.com/p/150053/ServiceTitan/reviews/)
- [Jobber Pricing](https://www.getjobber.com/pricing/)
- [Jobber 100K Customers](https://www.prnewswire.com/news-releases/jobber-surpasses-100-000-customers-302768759.html)
- [Jobber Route Optimization](https://help.getjobber.com/hc/en-us/articles/34303089729559)
- [Jobber Reviews (Capterra)](https://www.capterra.com/p/127994/Jobber/reviews/)
- [Housecall Pro Pricing](https://www.housecallpro.com/pricing/)
- [Housecall Pro AI Updates Fall 2025](https://www.prnewswire.com/news-releases/housecall-pro-unveils-major-ai-powered-updates-302594189.html)
- [Housecall Pro No Route Optimization (Tooled Up Pro)](https://tooleduppro.com/guides/housecall-pro-pricing/)
- [FieldPulse Reviews (Capterra)](https://www.capterra.com/p/153475/FieldPulse/reviews/)
- [GorillaDesk Reviews (Capterra)](https://www.capterra.com/p/130290/GorillaDesk/reviews/)
- [Workiz Pricing](https://www.workiz.com/pricing-plans/)
- [Workiz Genius Answering](https://www.workiz.com/ai-genius-answering/)
- [FieldEdge Reviews (FieldCamp)](https://fieldcamp.ai/reviews/fieldedge/)
- [Kickserv Pricing](https://www.kickserv.com/pricing)
- [GoHighLevel Pricing](https://www.gohighlevel.com/pricing)
- [GoHighLevel for Contractors (RockIt)](https://rockitgodigital.com/post/gohighlevel-contractors-review-2026)

### Contractor Pain Points
- [FIELDBOSS HVAC Consumer Survey 2025](https://www.fieldboss.com/blog/hvacs-real-problem-isnt-price-its-poor-communication/)
- [HVAC Tech Pain Points (ServiceTitan)](https://www.servicetitan.com/blog/hvac-technician-pain-points)
- [First Time Fix Rate Stats (Fieldpoint)](https://fieldpoint.net/first-time-fix-rates/)
- [Drive Time Cost (Geotab)](https://www.geotab.com/blog/routing-decisions-cost-more-than-fuel/)
- [Skill-Based Routing (Timefold)](https://timefold.ai/blog/how-upskilling-technicians-unlocks-field-service-routing-efficiency)
- [HVAC Summer Surge (GoSameDay)](https://www.gosameday.com/post/how-hvac-companies-maximize-capacity-during-summer-season)
- [On-Call Rotation (ACC Solutions)](https://accsolutions.com/how-to-set-up-an-on-call-rotation/)
- [Warranty Callbacks (ServiceTitan)](https://www.servicetitan.com/field-service-management/recalls-callbacks-warranty)
- [Dispatcher Burnout (Workiz)](https://www.workiz.com/blog/field-service/dispatchers-ultimate-survival-guide/)

### Market Data
- [FSM Market Growth](https://www.globalgrowthinsights.com/market-reports/field-service-management-software-market-122644)
- [ServiceTitan Market Share (6sense)](https://6sense.com/tech/field-service-management/servicetitan-market-share)
- [Field Service AI Trends (FieldProxy)](https://www.fieldproxy.ai/resources/blog/best-field-service-management-software-with-ai-scheduling-and-dispatch)

### Technical References
- [Google Maps Platform Pricing (2025+)](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Mapbox Pricing](https://www.mapbox.com/pricing)
- [Radar.io Geofencing](https://radar.io/pricing)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [FullCalendar](https://fullcalendar.io/)
- [VROOM Project](https://github.com/VROOM-Project/vroom)
- [Google OR-Tools](https://developers.google.com/optimization)
- [PowerSync](https://www.powersync.com/)
