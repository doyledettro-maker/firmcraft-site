# AI/ML Approaches for Field Service Scheduling & Dispatch Optimization

**Date:** June 8, 2026
**Author:** Firmcraft AI Research
**Purpose:** Technical research to inform architecture decisions for Firmcraft's AI-first scheduling + dispatch module targeting trade contractors (HVAC, plumbing, electrical) with 5-50+ technicians.

---

**Related docs:** [System Architecture](scheduling-dispatch-architecture.md) · [Build Plan](scheduling-dispatch-build-plan.md) · [Market Research](scheduling-dispatch-market-research.md) · [ROADMAP.md](../ROADMAP.md)

---

## Table of Contents

1. [Route Optimization Algorithms](#1-route-optimization-algorithms)
2. [Predictive Scheduling](#2-predictive-scheduling)
3. [Smart Dispatching / Auto-Assignment](#3-smart-dispatching--auto-assignment)
4. [Natural Language Job Creation](#4-natural-language-job-creation)
5. [Competitor AI Analysis: Claims vs. Reality](#5-competitor-ai-analysis-claims-vs-reality)
6. [Emerging AI Approaches](#6-emerging-ai-approaches)
7. [Open Source & Academic Resources](#7-open-source--academic-resources)
8. [Architecture Recommendations](#8-architecture-recommendations)

---

## 1. Route Optimization Algorithms

### 1.1 Problem Formulation

Field service scheduling maps to several well-studied Vehicle Routing Problem (VRP) variants:

| Variant | Abbreviation | Relevance to Field Service |
|---------|-------------|---------------------------|
| VRP with Time Windows | VRPTW | Customer has a 2-hour arrival window ("between 8-10am") |
| Capacitated VRP | CVRP | Tech truck has limited parts/tools capacity |
| Multi-Depot VRP | MDVRP | Techs start from home, not a central warehouse |
| Heterogeneous Fleet VRP | HFVRP | Different techs have different skills/certifications |
| Dynamic VRP | DVRP | Emergency calls arrive mid-day requiring re-routing |
| VRP with Pickup & Delivery | VRPPD | Pick up parts from supply house, then deliver/install |

**Key insight:** In real field service, these variants overlap constantly. You must match skills (HFVRP) while respecting customer windows (VRPTW), adapting to delays (DVRP), and planning across multiple start locations (MDVRP). No single textbook formulation covers it all.

### 1.2 Computational Complexity

VRP is NP-hard. Exact solutions are computationally infeasible for real-world problem sizes. The practical approaches fall into three tiers:

| Approach | Quality | Speed | Use Case |
|----------|---------|-------|----------|
| Exact (branch-and-bound, column generation) | Optimal | Hours for 50+ nodes | Academic benchmarking only |
| Metaheuristics (tabu search, simulated annealing, genetic algorithms) | Near-optimal (1-3% gap) | Seconds to minutes | Batch overnight planning |
| Construction heuristics + local search | Good (2-5% gap) | Milliseconds to seconds | Real-time re-optimization |

**For a 30-tech fleet with ~200 daily stops:** Modern solvers (OR-Tools, VROOM) can produce high-quality solutions in 2-30 seconds. Real-time re-optimization (when an emergency job arrives) can run in under 5 seconds using warm-start from the existing solution. This is absolutely feasible for production use.

### 1.3 Open-Source Solvers

#### Google OR-Tools
- **Language:** C++ core with Python, Java, C# wrappers
- **License:** Apache 2.0
- **Install:** `pip install ortools` (current version 9.x)
- **VRP Capabilities:** VRPTW, CVRP, MDVRP, pickup/delivery, heterogeneous fleet, time-dependent travel, penalties for dropped visits
- **Algorithm:** Uses a construction heuristic (e.g., cheapest insertion, savings algorithm) followed by local search metaheuristics (guided local search, simulated annealing, tabu search)
- **Performance:** For VRPTW with 200 stops and 30 vehicles, typical solve times of 2-15 seconds with time limits. On Solomon benchmark (100 customers), achieves solutions within 1-3% of known optimal. Solver can be configured with `time_limit` parameter for production use (recommended: 5-30 seconds for real-time, 60-300 seconds for batch planning)
- **Key strength:** Most complete constraint modeling for field service. Handles time windows, skills, capacities, break times, and multi-depot scenarios natively
- **Key weakness:** Python wrapper adds overhead. For sub-second performance, C++ direct or VROOM is better

#### VROOM (Vehicle Routing Open-source Optimization Machine)
- **Language:** C++20 core, Python wrapper via `pyvroom`
- **License:** BSD 2-Clause
- **Install:** `pip install pyvroom` (requires Python 3.10+, macOS/Linux)
- **API Features:** Time windows, skills matching, vehicle capacities, pickup/delivery (shipments), multi-depot, custom cost matrices
- **Performance:** Solves complex routing in **milliseconds**. On Solomon benchmark (56 VRPTW instances), average gap to optimal of just 1.63%. On TSPLIB benchmark, average gap of +2.47% while solving most instances in milliseconds
- **Key strength:** Speed. Best choice for real-time re-optimization. Skills matching built in (job can only go to vehicle with all required skills)
- **Key weakness:** Fewer constraint types than OR-Tools. No built-in support for break scheduling or complex overtime rules
- **API endpoints:** `solve` (full optimization) and `plan` (ETA computation for pre-ordered routes)

#### PyVRP
- **Language:** C++ optimization engine with Python interface
- **License:** MIT
- **Install:** `pip install pyvrp` (pre-compiled binaries for Windows/Mac/Linux)
- **Algorithm:** State-of-the-art metaheuristic based on iterated local search, building on Thibaut Vidal's HGS-CVRP
- **Supported problems:** CVRP, VRPTW, prize-collecting, pickup/delivery, heterogeneous fleet, multiple time windows
- **Academic validation:** Published in INFORMS Journal on Computing (2024). Wouda, N.A., L. Lan, and W. Kool. "PyVRP: a high-performance VRP solver package." INFORMS Journal on Computing, 36(4): 943-955
- **Key strength:** Best solution quality among Python-accessible solvers. Academic state-of-the-art
- **Key weakness:** Designed more for batch optimization than real-time; heavier setup

#### Timefold Solver (OptaPlanner successor)
- **Language:** Java/Kotlin core, Python wrapper (beta)
- **License:** Apache 2.0 (Community Edition)
- **Install:** `pip install timefold` (requires JDK 17+, JAVA_HOME configured)
- **History:** Forked from OptaPlanner in April 2023 by original OptaPlanner creator. Already faster, lighter, and better documented
- **Algorithm:** Metaheuristics including tabu search, simulated annealing, late acceptance
- **Supported problems:** VRP, employee rostering, task assignment, maintenance scheduling, job shop scheduling
- **Key strength:** Best for combined scheduling + routing problems (employee rostering + route optimization). Rich constraint DSL. Active March 2026 major release
- **Key weakness:** JVM dependency even for Python wrapper. More complex setup than VROOM/OR-Tools

### 1.4 Commercial APIs

#### Google Route Optimization API (formerly Cloud Fleet Routing)
- **Pricing (post-March 2025):**
  - Single vehicle: $10 per 1,000 visits
  - Multi-vehicle (fleet): $30 per 1,000 visits
  - Free monthly caps replaced old $200 credit system
  - Volume discounts available through Google Maps Partners
  - Requests with validation errors, VALIDATE_ONLY mode, or infeasible/ignored shipments are NOT billed
- **Capabilities:** Full VRPTW, fleet routing, cost-driven optimization, integrates with Fleet Engine for real-time tracking
- **Strengths:** No infrastructure to manage, integrates with Google Maps distance/duration matrix, handles traffic-aware routing
- **For 30 techs / 200 stops daily:** ~$6/day at fleet pricing ($30/1000 visits). ~$180/month. Very reasonable

#### Routific
- **Platform pricing:** Per-order (not per-driver since mid-2024)
  - First 100 orders/month: free
  - Up to 1,000 orders: $150/month
  - 1,001-2,000 orders: $0.15/order
  - 20,000+ orders: $0.03/order
- **Engine API:** Separate developer product, per-visit pricing with overage at $0.15/visit on Pro tiers
- **API docs:** https://docs.routific.com/
- **Strengths:** Clean API, good documentation, handles time windows and vehicle capacity

#### OptimoRoute
- **Pricing:** Per driver per month
  - Lite: $35.10/driver/month
  - Pro: $44.10/driver/month
  - Custom: contact sales
  - 10% discount for annual billing
  - API access included at all tiers
- **For 30 techs:** $1,053-$1,323/month
- **Strengths:** Full API, real-time tracking, integrations with business systems

#### Route4Me
- **Pricing:** Not publicly listed (historically $199-$349/user/month)
- **Watch out:** Add-on marketplace — many features competitors bundle are paid extras. Mobile app requires separate subscription
- **For 30 techs:** Likely $6,000-$10,000+/month. Too expensive for SMB target

### 1.5 Recommendation for Firmcraft

**Primary solver: VROOM (via pyvroom)** for real-time dispatch optimization. Millisecond solve times, built-in skills matching, BSD license, and the speed needed for dynamic re-routing.

**Fallback/batch solver: Google OR-Tools** for overnight route planning, complex constraint scenarios, and cases VROOM can't handle (break scheduling, complex overtime rules).

**Distance/duration matrix: Google Routes API** (Compute Route Matrix SKU) for travel time calculations with real-time traffic.

**Avoid building from scratch.** The open-source solvers are mature and well-tested. The differentiation is in the problem formulation, constraint modeling, and integration with the FSM workflow — not in the solver algorithm itself.

---

## 2. Predictive Scheduling

### 2.1 Job Duration Prediction

This is the highest-impact ML application for scheduling accuracy. Current approaches:

**Model Architecture:**
- **Gradient Boosted Trees (XGBoost/LightGBM)** are the current production standard. They handle mixed feature types, missing data, and non-linear relationships well
- **Random Forest** is simpler, more interpretable, and resistant to overfitting — good baseline
- **Ensemble approach** combining XGBoost, Random Forest, and LSTM has shown best results for HVAC-related predictions

**Feature Engineering (critical — this is where the value is):**

| Feature Category | Specific Features | Impact |
|-----------------|-------------------|--------|
| Job attributes | Service type, equipment model, equipment age, reported symptom, warranty status | High |
| Technician attributes | Years experience, certification level, historical avg duration for this job type, first-time-fix rate | High |
| Location attributes | ZIP code, drive time from previous job, property type (residential/commercial), floor count | Medium |
| Temporal attributes | Day of week, time of day, season, days since last service at address | Medium |
| Historical patterns | Average duration for this (job_type, tech) pair, rolling 30-day average, variance | High |
| External factors | Weather (temperature, precipitation), parts availability | Low-Medium |

**Expected accuracy:** With 6+ months of historical data and the features above, expect Mean Absolute Error (MAE) of 15-25 minutes for residential HVAC/plumbing jobs. The model improves significantly with more data — expect MAE to drop below 15 minutes after 12 months.

**Training approach:**
1. Start with median duration by job type as baseline
2. Train XGBoost regressor on historical job data
3. Use technician-specific adjustment factors (some techs are consistently 20% faster)
4. Retrain weekly on rolling 90-day window

### 2.2 Cancellation / No-Show Prediction

Transferable from healthcare appointment prediction research (extensive literature):

**Model:** Gradient boosted classifier (XGBoost or LightGBM)

**Key predictive features (ranked by importance):**
1. **Lead time** — most influential predictor. Longer interval = higher no-show risk
2. **Customer no-show history** — customers with previous no-shows have significantly higher rates
3. **Day of week and time of day** — Monday mornings and Friday afternoons typically higher
4. **Weather forecast** — storms increase cancellations for non-emergency work
5. **Appointment type** — maintenance/tune-ups cancel more than emergency repairs
6. **Communication recency** — days since last reminder affects show rate

**Expected performance:** Research shows gradient boost models achieve ~85% accuracy for no-show prediction and ~92% for late cancellation prediction. These numbers transfer well to field service.

**Actionable outputs:**
- Flag high-risk appointments for proactive confirmation calls
- Overbook maintenance slots when cancellation probability > 30%
- Trigger automated reminder sequences for high-risk appointments

### 2.3 Demand Forecasting (Seasonal)

Critical for HVAC contractors where demand swings 3-5x between peak and trough.

**Approach for HVAC seasonality:**
- Lennox Residential identifies **200+ micro-climates** within the US using ML clustering, each with distinct demand patterns
- Ensemble models combining **LSTM + Random Forest + XGBoost** achieve superior accuracy on seasonal demand data
- Key inputs: historical call volume by week, temperature forecast (7-14 day), equipment install dates (predict when units hit 10-15 year replacement age)

**For Firmcraft's target market (5-50 techs):**
- Simpler approach is fine: weekly demand forecast by job type, using 2+ years of historical data
- ARIMA or Prophet (Facebook/Meta time series library) for baseline seasonal model
- Add temperature as exogenous variable for HVAC demand
- Output: expected job count by type by day, 2 weeks forward

**Implementation priority:** Medium. Most valuable for capacity planning (hiring temporary techs) and marketing throttling, not day-to-day dispatch.

---

## 3. Smart Dispatching / Auto-Assignment

### 3.1 Multi-Objective Optimization

Field service dispatch is fundamentally multi-objective. The competing goals:

1. **Minimize total drive time** (fuel cost, windshield time)
2. **Maximize revenue** (send best closer to highest-value jobs)
3. **Balance workload** (prevent burnout, ensure fair distribution)
4. **Respect constraints** (skills, certifications, time windows, customer preferences)
5. **Maximize first-time fix rate** (match tech expertise to problem type)

**Solution approach: Weighted scoring with Pareto optimization**

Rather than finding a single "best" answer, generate a set of Pareto-optimal solutions and let configuration weights select among them. Weights can be customer-configurable:

```
Score = w1 * (1 - normalized_drive_time) 
      + w2 * predicted_job_revenue * tech_close_rate 
      + w3 * (1 - workload_imbalance_factor) 
      + w4 * skill_match_score 
      + w5 * customer_preference_match
```

Default weights could be: w1=0.30, w2=0.25, w3=0.15, w4=0.20, w5=0.10

This is what ServiceTitan's Dispatch Pro does conceptually — they simulate hundreds of scenarios and select the highest-profit configuration.

### 3.2 Real-Time Re-Dispatching

When conditions change mid-day (job runs long, emergency call comes in, tech calls out sick):

**Event triggers:**
- Job completion (actual time vs. estimated time delta > 20 min)
- New emergency job received
- Tech unavailability (sick, vehicle breakdown)
- Customer cancellation
- Job running over estimated duration by > 30%

**Re-optimization strategy:**
1. **Incremental:** Only re-route affected techs + neighbors. VROOM can do this in milliseconds
2. **Rolling horizon:** Re-optimize remainder of day from current state, every 15-30 minutes
3. **Hybrid:** Incremental for urgent events, full re-optimization on 30-minute cadence

**Architecture pattern:**
- Event queue (Redis/Kafka) captures dispatch events
- Optimization worker picks up events, runs VROOM solver
- Results pushed to dispatch board via WebSocket
- Dispatcher can accept/reject/modify suggestions (critical for adoption)

### 3.3 ServiceTitan Dispatch Pro: How It Actually Works

Based on ServiceTitan's documentation and blog posts, Dispatch Pro:

- Uses **ML algorithm that simulates hundreds or more scenarios** per optimization run
- Considers: predicted job value, technician performance (total sales, avg tickets, sold memberships, lead conversion probability), drive time, job type, skills
- Runs in **Auto Mode** (reshuffles dispatch board every 10 minutes) or **Assist Mode** (suggests, dispatcher approves)
- Focuses heavily on **profit maximization**, not just efficiency
- The "predicted job value" factor means it sends the best closer to the highest-revenue opportunities

**What this means for Firmcraft:** ServiceTitan's approach is revenue-optimization-first. This is powerful for larger shops ($5M+ revenue) but can feel uncomfortable for smaller contractors who value fairness and customer relationships. Firmcraft could differentiate with a "balanced" mode that weighs fairness/workload alongside revenue.

---

## 4. Natural Language Job Creation

### 4.1 Voice-to-Schedule Pipeline

**Example input:** "Book a furnace inspection for Mrs. Johnson at 2pm Thursday, send Dave"

**Required pipeline:**

```
Voice Input → STT → LLM (intent + entity extraction) → Validation → Job Creation
```

**Step 1: Speech-to-Text (STT)**
- **OpenAI Whisper V4** (released late 2025): ~3.2% WER on clean English, 8-12% on real-world audio (meetings, phone calls). Includes native speaker diarization and real-time streaming
- **Deepgram Nova-3:** Competitive with Whisper, better real-time streaming latency (~200ms)
- For field service voice notes with environmental noise: expect 8-15% WER. This is acceptable when paired with LLM correction

**Step 2: LLM Intent + Entity Extraction**

Using LLM function calling / structured outputs (OpenAI, Anthropic, etc.):

**Intent recognition:** `create_job`, `reschedule_job`, `cancel_job`, `check_availability`, `dispatch_tech`

**Entity extraction schema:**
```json
{
  "intent": "create_job",
  "customer_name": "Mrs. Johnson",
  "service_type": "furnace_inspection",
  "preferred_date": "2026-06-11",  // next Thursday
  "preferred_time": "14:00",
  "preferred_technician": "Dave",
  "urgency": "standard"
}
```

OpenAI's Structured Outputs mode (json_schema parameter) guarantees valid JSON matching a defined schema. This eliminates parsing failures — the model either extracts all fields correctly or reports what's missing.

**Step 3: Validation layer (deterministic, not ML)**
- Look up "Mrs. Johnson" in CRM → fuzzy match against customer database
- Resolve "Dave" → check technician registry
- Verify Dave's availability at 2pm Thursday → calendar check
- Verify Dave has furnace inspection certification → skills check
- Verify Mrs. Johnson's address is in Dave's service zone → geo check
- If any conflict: generate natural language response explaining the issue and suggesting alternatives

### 4.2 What Competitors Ship Today

**ServiceTitan Atlas:**
- Natural language interface — type or speak to run reports, find jobs, dispatch technicians
- Can create capacity rules via natural language ("prioritize emergency calls during heat waves")
- Still in "teen phase" per ServiceTitan — proactive cross-functional workflows coming
- AI Voice Agent handles inbound calls: books new jobs, confirms/reschedules appointments, recognizes memberships, escalates based on triggers

**Jobber AI Receptionist:**
- Launched August 2025
- Answers calls/texts 24/7, matches caller ID to client profiles, books visits, captures job details
- Included in Plus plan ($599/month) or $99/month add-on
- NOT intelligent dispatch — no skill/location matching

**Housecall Pro CSR AI:**
- Answers incoming calls and chats
- Automatically books jobs
- Provides after-hours support
- Separate "Analyst AI" for business intelligence queries

### 4.3 Architecture Recommendation

```
                        ┌──────────────────┐
                        │  Voice/Text Input │
                        └────────┬─────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Whisper V4 / Deepgram   │
                    │  (Speech-to-Text)        │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Claude / GPT-4o         │
                    │  (Structured Output)     │
                    │  Intent + Entity Extract │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Validation Engine       │
                    │  - Customer lookup       │
                    │  - Tech availability     │
                    │  - Skills verification   │
                    │  - Zone/geo check        │
                    │  - Conflict detection    │
                    └────────────┬─────────────┘
                                 │
                ┌────────────────▼────────────────┐
                │  Job Created + Dispatch Trigger  │
                └─────────────────────────────────┘
```

---

## 5. Competitor AI Analysis: Claims vs. Reality

### 5.1 ServiceTitan — Titan Intelligence

| Feature | Claim | Reality | Maturity |
|---------|-------|---------|----------|
| Dispatch Pro | AI-optimized dispatch maximizing profit | Real ML: simulates hundreds of scenarios, considers job value + tech performance + drive time. Auto-reshuffles every 10 minutes | Production (GA) |
| Atlas AI | Natural language interface for all ServiceTitan operations | Works for reports, job lookup, dispatch. "Teen phase" — still expanding capabilities | Early GA |
| AI Voice Agent | Books jobs, confirms appointments, handles after-hours calls via NLP | Real product. Books new jobs, recognizes memberships, escalates per triggers | Production |
| Marketing Pro | Feeds revenue data into Google Ads, optimizes for sales not clicks | Real integration. Throttles spend when schedule full, increases when demand light | Production |
| Pricebook AI | Dynamic pricing suggestions based on market data | Less clear how sophisticated the underlying model is | Limited info |

**Assessment:** ServiceTitan has the most genuine AI features in the market. Dispatch Pro is a real ML system, not rules-based. The $250-$500+/tech/month price point + $5K-$50K implementation puts it out of reach for 5-20 tech shops.

### 5.2 Jobber

| Feature | Claim | Reality | Maturity |
|---------|-------|---------|----------|
| Smart scheduling | Drag-and-drop calendar | Manual scheduling only. Rebuilt engine Oct 2025 but still no AI dispatch | Basic |
| AI Receptionist | 24/7 call/text answering, books visits | Real voice AI. Answers, matches caller IDs, takes messages. Good product | Production |
| Intelligent dispatch | Not claimed | Does not exist. No skill-matching, no location optimization, no workload balancing | N/A |
| Geofencing | Not offered | N/A | N/A |

**Assessment:** Jobber is a simple scheduling tool with a good AI receptionist bolted on. Target is 1-15 employees. No real optimization. Pricing: $29-$599/month.

### 5.3 Housecall Pro

| Feature | Claim | Reality | Maturity |
|---------|-------|---------|----------|
| CSR AI | Answers calls, books jobs 24/7 | Real voice/chat AI. Auto-books and provides after-hours support | Production |
| Analyst AI | Real-time business intelligence | Natural language queries against revenue, trends, performance data | Production |
| AI Dispatching | Matches jobs to techs by location, skill, schedule | Claimed, limited detail on sophistication | Unclear |
| Auto-reminders | AI sends/confirms/reschedules appointments | Real automation, handles customer responses | Production |

**Assessment:** HCP is investing heavily in AI but primarily in customer communication (voice AI, reminders). Dispatch intelligence is unclear — likely basic rule-based matching, not ML optimization.

### 5.4 New AI-First Entrants

**FieldCamp:**
- Markets as "AI field service software where you tell it what to do"
- Chat/command interface for scheduling, dispatch, CRM, invoicing
- Supports HVAC, plumbing, cleaning, landscaping
- Genuinely new approach but unclear how deep the AI goes beneath the chat UI

**FieldPulse:**
- Raised $50M Series C (August 2025) for AI features + expansion
- "Operator AI" — AI voice receptionist, qualifies leads, books jobs
- Targets HVAC, plumbing, electrical, general contracting
- Growing fast but AI is currently voice receptionist, not dispatch optimization

**Zuper:**
- AI-driven FSM for mid-size teams
- Real-time skill-matching for task assignment
- Emphasizes integrations with business tools
- More of a platform play than an AI-first product

**BuildOps:**
- Targets commercial service contractors
- Dependency-driven project scheduling with Gantt charts
- More project management than residential field service
- Not really AI-powered dispatch

### 5.5 Gap Analysis

**Nobody ships all of this today:**
- Real ML-powered dispatch optimization (only ServiceTitan, at enterprise pricing)
- Predictive job duration modeling
- Dynamic re-routing when conditions change
- Natural language job creation
- Demand forecasting for capacity planning

The gap is widest at the **5-50 tech range** — too sophisticated for Jobber, too small/expensive for ServiceTitan.

---

## 6. Emerging AI Approaches

### 6.1 Agentic AI for Dispatch

The 2026 trend is moving from "Copilot" AI (assists human dispatcher) to "Agent" AI (operates autonomously):

**Multi-agent architecture:**
- **Scheduler Agent:** Optimizes daily routes, handles re-dispatching
- **Diagnostic Agent:** Predicts equipment issues, suggests parts to bring
- **Communication Agent:** Handles customer notifications, confirmations, rescheduling
- **Compliance Agent:** Ensures technician certifications, license requirements

An airport ground handler deploying agentic workflow assignment reduced average dispatch response time by 35% (from 8+ minutes to under 5).

**Key caveat:** IBM's State of Salesforce 2025-26 report found 53% of organizations cite poor data availability or quality as the top barrier. Clean data infrastructure is prerequisite.

### 6.2 Computer Vision for Job Documentation

**XOi Technologies** is the market leader:
- Techs capture video/photos from HVAC, plumbing, electrical, MEP jobsites
- ML-powered content identification and archiving
- Natural language processing on field notes
- 10+ years of training data from technician field captures
- Vision platform runs on mobile devices and select smart glasses

**Microsoft Copilot for Field Service + Azure Cognitive Services:**
- Image recognition reads control board photos, identifies part numbers
- Surfaces relevant service bulletins
- Suggests next diagnostic steps

**HVAC-specific:** Computer-vision diagnostics on rooftop units, condenser coils, and electrical panels reportedly save 15-25 minutes per job.

**Firmcraft opportunity:** Photo capture with AI analysis could be a V2 feature. Start with simple photo documentation, add classification (equipment type, visible issue) via multimodal LLM (Claude/GPT-4o vision), then build toward diagnostic suggestions.

### 6.3 IoT Integration — Proactive Scheduling

**Smart thermostat data → proactive HVAC scheduling:**
- IoT sensors continuously monitor temperature, humidity, vibration, electrical consumption
- ML algorithms create health profiles of HVAC systems
- Predict maintenance needs before failures occur
- Auto-schedule tune-ups when anomalies detected

**Lennox example:** Uses ML algorithms + cluster analysis to identify 200+ US micro-climates, tracking seasonality across thousands of SKU-location combinations.

**Integration path for Firmcraft:**
1. Start with Nest/Ecobee API integration — pull runtime data
2. Flag systems running excessively (potential efficiency problem)
3. Auto-generate proactive maintenance recommendations
4. Contractor sends targeted outreach to affected customers

**Revenue model:** This converts break-fix customers into maintenance agreements — recurring revenue for the contractor.

### 6.4 Reinforcement Learning for Dynamic Routing

Academic research is advancing rapidly:

**"RL approach for dynamic VRP with stochastic request times and time-dependent travel times" (October 2025):**
- Combines RL with hybrid attention mechanism (Reverse LSTM + multi-pointer decoder)
- Optimizes routes AND departure times simultaneously

**"Fast Approximate Solutions using RL for Dynamic CVRP with Time Windows" (2021):**
- RL provides solutions significantly faster than exact methods
- Handles arbitrary number of customers/locations without retraining
- Dynamic arrival of demand at arbitrary locations

**"Deep RL for Dynamic VRP with Stochastic Customers" (ICAPS):**
- Formulates DVRP as route-based Markov Decision Process
- Combines Deep RL with Simulated Annealing heuristic (DRLSA)

**Practical assessment:** RL approaches are promising but not yet production-ready for field service. Current metaheuristic solvers (VROOM, OR-Tools) are more reliable and well-tested. Monitor RL research for 2027-2028 potential integration.

---

## 7. Open Source & Academic Resources

### 7.1 Solver Comparison Matrix

| Solver | Language | License | Install | Speed | Quality | Time Windows | Skills | Real-Time |
|--------|----------|---------|---------|-------|---------|-------------|--------|-----------|
| VROOM | C++20 / Python | BSD 2-Clause | `pip install pyvroom` | Milliseconds | 1.6% gap (Solomon) | Yes | Yes | Excellent |
| Google OR-Tools | C++ / Python | Apache 2.0 | `pip install ortools` | Seconds | 1-3% gap | Yes | Via dimensions | Good |
| PyVRP | C++ / Python | MIT | `pip install pyvrp` | Seconds | State-of-art | Yes | Yes | Moderate |
| Timefold | Java / Python (beta) | Apache 2.0 | `pip install timefold` | Seconds | Good | Yes | Via constraints | Moderate |

### 7.2 Academic Benchmark Datasets

**Solomon VRPTW Benchmark:**
- 56 instances with 100 customers each, in 6 classes
- R1/R2: random coordinates
- C1/C2: clustered
- RC1/RC2: mixed random + cluster
- Extended instances: 200, 400, 600, 800, 1000 customers
- Download: SINTEF website (sintef.no/projectweb/top/vrptw/solomon-benchmark/)
- Standard benchmark for all VRP solver evaluation

**GECCO 2026 ML4VRP Competition:**
- Machine learning-assisted evolutionary algorithms for VRP
- Cutting-edge research combining ML + optimization

**Multiple Time Window VRP Dataset:**
- Available on Zenodo (zenodo.org/records/15296114)
- Relevant for field service where customers have multiple acceptable windows

### 7.3 Open-Source FSM Frameworks

**For reference, not recommendation (build custom on top of solvers instead):**

| Framework | Stack | Notes |
|-----------|-------|-------|
| OCA Field Service | Odoo/Python | AGPL-3.0. Closest to real open-source FSM. Heavy ERP dependency |
| Beveren FSM | ERPNext/Python | 100% open source. Job logging, tech scheduling, spare parts, invoicing |
| ERPNext | Python/Frappe | Full ERP with service module. Overkill for standalone scheduling |

### 7.4 Supporting Libraries

| Library | Purpose | Install |
|---------|---------|---------|
| Prophet (Meta) | Time series forecasting (demand prediction) | `pip install prophet` |
| XGBoost | Gradient boosted trees (duration/cancellation prediction) | `pip install xgboost` |
| LightGBM | Fast gradient boosting (alternative to XGBoost) | `pip install lightgbm` |
| scikit-learn | ML baseline models, preprocessing, evaluation | `pip install scikit-learn` |
| OSRM | Open Source Routing Machine (distance/duration matrices) | Self-hosted or API |
| OpenRouteService | Routing + optimization API (uses VROOM internally) | API or self-hosted |

---

## 8. Architecture Recommendations

### 8.1 Phased Build Plan

> **Naming note (June 2026):** the four steps below are labeled **Stage 1–4** (previously "Phase 1–4") to avoid colliding with the global roadmap phases and the build plan’s Phase 2.1–2.5 numbering. Stage 1 roughly maps to build-plan Phase 2.3; Stages 2–4 are post-launch ML work.

**Stage 1 — Smart Dispatch (Months 1-3)**
- Integrate VROOM solver for route optimization
- Google Routes API for distance/duration matrix with traffic
- Basic skill-matching: tech certifications vs. job requirements
- Manual override: dispatcher can accept/reject/modify AI suggestions
- Display optimization score: "This assignment saves 45 min of drive time"
- **Tech:** Python/FastAPI service wrapping pyvroom, Redis for event queue

**Stage 2 — Predictive Duration + Dynamic Re-routing (Months 3-5)**
- Train XGBoost model on historical job data for duration prediction
- Replace fixed duration estimates with ML predictions
- Implement rolling re-optimization on 15-min cadence
- Emergency job injection: auto-re-route when new urgent job arrives
- **Tech:** MLflow for model management, scheduled retraining pipeline

**Stage 3 — Voice/NL Job Creation (Months 5-7)**
- Whisper V4 or Deepgram for speech-to-text
- Claude/GPT-4o with structured outputs for intent + entity extraction
- Validation engine: CRM lookup, availability check, conflict detection
- **Tech:** WebSocket for real-time voice streaming, LLM function calling

**Stage 4 — Demand Forecasting + Proactive Scheduling (Months 7-10)**
- Prophet/ARIMA for seasonal demand forecasting
- Cancellation prediction model (XGBoost classifier)
- IoT integration pilot: smart thermostat runtime data
- Proactive maintenance suggestions → customer outreach
- **Tech:** Scheduled ML pipeline, thermostat API integrations

### 8.2 Cost Estimates (Infrastructure)

| Component | Provider | Monthly Cost (30 techs) |
|-----------|----------|------------------------|
| Route optimization | VROOM (self-hosted) | $0 (open source) |
| Distance matrix | Google Routes API | ~$150-300/month |
| ML inference | AWS SageMaker or self-hosted | ~$50-150/month |
| Voice transcription | Whisper API or Deepgram | ~$50-100/month |
| LLM (intent extraction) | Claude/GPT-4o API | ~$30-80/month |
| **Total infrastructure** | | **~$280-630/month** |

This is dramatically less than commercial route optimization APIs ($1,000-$10,000+/month) and makes a $99-$199/month product price point viable with healthy margins.

### 8.3 Data Requirements

**Minimum viable data to start:**
- Customer addresses (for distance matrix)
- Technician home addresses + skills/certifications
- Job types with estimated durations
- Working hours and service area boundaries

**Data needed for ML features (Stage 2+):**
- 6+ months of historical job records (type, duration, tech, outcome)
- Customer appointment history (for no-show prediction)
- 2+ years of call volume data (for demand forecasting)

### 8.4 Key Technical Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Primary solver | VROOM via pyvroom | Fastest, good enough quality, skills built in |
| Distance matrix | Google Routes API | Real-time traffic, maintained, reasonable pricing |
| ML framework | XGBoost + scikit-learn | Battle-tested, fast training, good for tabular data |
| Voice-to-text | Whisper V4 or Deepgram | Best accuracy, real-time streaming |
| LLM for NL parsing | Claude Sonnet or GPT-4o-mini | Structured outputs, function calling, cost-effective |
| Time series | Prophet | Simple, handles seasonality, minimal tuning |
| Hosting | Self-hosted VROOM + cloud ML | Best cost/performance balance |

---

## Key Takeaways for Architecture Decisions

1. **VROOM is the solver to build on.** Millisecond solve times, skills matching, open source. OR-Tools as fallback for complex constraints.

2. **Google Routes API is the right distance matrix.** Traffic-aware, well-maintained, ~$150-300/month for 30-tech fleet. Avoid building your own routing engine.

3. **Job duration prediction is the highest-ROI ML feature.** XGBoost on historical data with tech/job/location features. 6 months of data needed. Directly improves schedule accuracy and customer experience.

4. **Voice-to-schedule is now feasible.** Whisper V4 + LLM structured outputs make this technically straightforward. The hard part is the validation layer (CRM lookup, conflict detection), not the NLP.

5. **ServiceTitan is the only competitor with real AI dispatch.** Everyone else is voice AI (answering phones) or basic rules. The gap at 5-50 techs is wide open.

6. **Start with dispatch optimization, not ML.** Dispatch optimization delivers immediate value with no training data needed. ML features (duration prediction, demand forecasting) require historical data that accumulates as customers use the platform.

7. **"Balanced" optimization is a differentiator.** ServiceTitan optimizes for profit. Firmcraft could offer configurable objectives: profit-first, efficiency-first, fairness-first, or balanced. This resonates with owner-operators who care about team culture.

8. **Infrastructure costs are low.** Total ML/optimization infrastructure runs $280-630/month for a 30-tech fleet, supporting the $99-199/month price target with strong margins.
