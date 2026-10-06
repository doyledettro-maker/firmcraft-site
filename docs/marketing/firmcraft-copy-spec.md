# Firmcraft — Site Copy & Implementation Spec

> **Note (Oct 2026):** The "Amendment — Broaden the audience" section at the end of this spec supersedes any earlier text that mentions mid-market companies, asset-intensive or operations-heavy organizations, or the 50–1,500 headcount band.

**Status:** Complete copy for all pages. Ready to implement.
**Companion document:** `firmcraft-positioning-brief.md` (positioning rationale, voice rules, decisions log)
**Date:** 2026-09-19

---

## How to use this document

Everything between the rules under each page heading is **final copy**. Implement as written. Where a note appears in *italics inside brackets*, it is an instruction to the implementer, not copy.

Three standing rules that apply to every page and override any temptation to improve on the text:

1. **Register is professional services, not marketing.** Complete sentences. Headings describe their contents rather than perform. No fragments used for emphasis, no rhetorical reversals, no punchlines.
2. **No pricing and no packaging.** No figures, no tiers, no SKU names, no durations, no delivery-commitment badges — including in `<title>` and meta tags.
3. **No product or vendor names.** Categories only. Industries and business functions stay concrete; software products do not appear.
4. **No reference to employment elsewhere.** The site must not name another employer or imply that the person leading Firmcraft holds a concurrent role elsewhere. This rules out employer names, "day job" asides, and open-ended date ranges attached to outside roles ("2022 – Present"). Describe accumulated experience in the past tense with no employer attached: *"several years implementing ERP and adjacent operational systems"* is correct; *"a continuing role in the enterprise software industry"* is not.

---

## Global — navigation, footer, metadata

### Primary navigation

```
Advisory     How We Work     For Small Business     About          [Contact]
```

Four items and one contact link. Removed from the current nav: `Services`, `Operator`, and both instances of `Pricing`.

### Footer

Three columns plus a legal line.

**Practice** — Advisory · How We Work · Data Sovereignty · For Small Business
**Firm** — About · Contact
**Related** — SkillCalibrate

Legal line: `© [year] Firmcraft` *[no tagline, no italic flourish]*

### Page titles and descriptions

| Path | `<title>` | Meta description |
|---|---|---|
| `/` | Firmcraft — AI Advisory and Managed Services for Mid-Market Companies | Firmcraft advises mid-market companies on artificial intelligence and technology strategy, implements what the strategy requires, and manages it on an ongoing basis. |
| `/advisory` | Advisory Services — Firmcraft | Advisory, managed AI services, and infrastructure for companies bringing artificial intelligence into finance and operations. |
| `/how-we-work` | How We Work — Firmcraft | Firmcraft's approach to assessment, implementation, and ongoing support, adapted from enterprise systems implementation practice. |
| `/sovereignty` | Data Sovereignty — Firmcraft | How Firmcraft handles client data, what runs inside a client's own environment, and how those decisions are made. |
| `/for-small-business` | For Small Business — Firmcraft | A managed artificial intelligence capability for smaller organizations, operated by Firmcraft. |
| `/about` | About — Firmcraft | Firmcraft is an advisory practice combining business process, industry, and enterprise systems experience with hands-on technical implementation. |

### Redirects

| From | To | Type |
|---|---|---|
| `/pricing` | `/advisory` | 301 |
| `/services` | `/advisory` | 301 |
| `/operator` | `/for-small-business` | 301 |
| `/methodology` | `/how-we-work` | 301 |

---

## Page 1 — Home

### Hero

**Heading**
AI advisory and managed services for mid-market companies

**Subheading**
Firmcraft advises mid-market companies on artificial intelligence and technology strategy, implements what that strategy requires, and manages the result on an ongoing basis. The practice brings together business process, industry, and enterprise systems experience with hands-on technical implementation.

**Primary action:** Contact Firmcraft
**Secondary action:** How we work

*[Remove the metric strip and the engagement mock-up panel beneath the current hero. Both are decorative and both carry package framing.]*

---

### Section — The problem most organizations have with AI

In most organizations, artificial intelligence arrived from the bottom up. Individual employees adopted individual tools. Subscriptions accumulated without a central view of cost or exposure, few of those tools connect to the systems the business actually runs on, and no one owns the overall result.

The pace of change compounds the difficulty. A decision that was reasonable eighteen months ago may no longer be, and few mid-market organizations have someone on staff whose job is to track that.

Larger consulting firms are generally not structured to serve companies of this size. Firms that specialize in artificial intelligence often lack working familiarity with the financial and operational systems mid-market companies depend on. Firmcraft was established to address both gaps.

---

### Section — What Firmcraft does

Implementation runs through all three areas below. Firmcraft builds what the advice calls for, integrates it with the systems already in place, and trains the people who will use it.

**Advisory**
Establishing what is currently running, what it costs, and what it actually does. Determining what should be kept, replaced, built, or left alone. Owning the artificial intelligence and technology roadmap at the executive level, so that decisions are made deliberately rather than accumulated by default.

**Managed AI services**
Operating the resulting capability over time. Monitoring, evaluation, tuning, retiring what has become obsolete, and introducing what has genuinely improved. The objective is that a client's capability keeps pace with the field rather than freezing at the point of implementation.

**Infrastructure**
The technical foundation beneath both, with data sovereignty as the default position. Determining where client data resides, what runs inside the client's own environment, and what may reasonably be sent elsewhere.

---

### Section — What distinguishes Firmcraft

**Business process, industry, and systems depth**
Firmcraft is led by an advisor with more than two decades in enterprise software and digital transformation. That work has spanned business process design, solution architecture, and implementation for operations-heavy and asset-intensive organizations around the world.

**Commercial literacy**
An early career in public accounting and at early-stage companies, including one through its initial public offering, means engagements are led by someone who can assess whether a proposed project produces measurable financial value, and discuss that assessment with an owner, controller, or chief financial officer in their own terms.

**Independence**
Firmcraft does not resell software and does not take vendor margin. Where the appropriate answer is a system the client already owns, or no new system at all, that is the recommendation.

**An established implementation method**
Firmcraft's approach is adapted from enterprise systems implementation rather than from software piloting. Most artificial intelligence projects fail during scoping rather than engineering, and the method is built around that.

**Continuity**
The person who scopes an engagement leads the implementation and remains through ongoing support. Engagements are not passed to a delivery team.

---

### Section — Who Firmcraft works with

Firmcraft works with mid-market organizations where the owner, the chief executive, or the finance and operations leadership drives the technology agenda.

| | |
|---|---|
| **Revenue** | $10 million and above |
| **Headcount** | 50 to 1,500 employees |
| **Systems** | A system of record in place, or actively replatforming — an ERP, a dealer or practice management system, or equivalent |
| **Organizational lead** | Owner, chief executive, chief financial officer, controller, chief operating officer, or director of finance |
| **Typical situation** | Manual process load, constrained headcount, audit and control exposure |
| **AI maturity** | Isolated pilots without broader adoption, or no formal program |

Firmcraft is generally not the right fit for pre-revenue companies or for organizations whose financial and operational data is not yet held in a system of record.

*[Replaces the current "Not a fit" line. Same qualifying function, stated as information.]*

---

### Closing section

**Heading**
Start a conversation

**Body**
An initial conversation carries no cost and no obligation. If artificial intelligence is not the right investment for the problem you are describing, Firmcraft will say so.

**Action:** Contact Firmcraft

---

## Page 2 — Advisory

### Header

**Heading**
Advisory

**Introduction**
Firmcraft is an advisory practice. The firm offers managed artificial intelligence services and the infrastructure that supports them, and it advises on the decisions that determine whether either is worth undertaking.

---

### Section — Advisory

Most organizations do not have an accurate picture of their own artificial intelligence position. Tools have been adopted by individual teams, spending is distributed across departments, and the relationship between those tools and the systems of record is often unclear.

Advisory work begins with establishing that picture: what is running, what it costs, what it produces, and where it creates exposure. From there the work is a series of decisions — what to retain, what to replace, what to build, and what to stop. The output is a roadmap that an executive team can fund and a finance function can defend.

A material proportion of these engagements conclude with a recommendation not to build. In some cases the appropriate answer is better use of systems the organization already owns, or improvements to underlying data, rather than new technology.

---

### Section — Managed AI services

An implementation is a position taken at a moment in time. The field moves, models are superseded, costs change, and processes that were automated appropriately last year may warrant revisiting.

Managed services cover the ongoing operation of a client's artificial intelligence capability: monitoring and evaluation, tuning, cost management, retirement of components that no longer earn their place, and introduction of capabilities that have genuinely improved. Clients retain a single point of accountability for the whole of their artificial intelligence estate rather than managing a collection of vendors.

This includes operating assistants inside the tools leadership and staff already use for day-to-day work — handling correspondence, scheduling, document preparation, and follow-up on outstanding items — so that the capability is available where the work happens rather than in a separate system someone has to remember to open.

---

### Section — Infrastructure

Infrastructure work concerns where systems run and where data resides.

Firmcraft's default position is that client data remains within the client's own environment. Where a hosted model is the appropriate tool for a given task, it is used only where the data handling terms are acceptable to the client and the decision has been made explicitly rather than by default.

Further detail is set out in [Data Sovereignty](/sovereignty).

---

### Section — Independence

Firmcraft does not resell software and does not receive vendor margin. This is a deliberate constraint on the business model rather than a statement of preference.

The practical consequence is that recommendations are not shaped by a partner relationship. Where the appropriate answer is a system the client already owns, a change to process rather than technology, or no action at all, that is what Firmcraft recommends.

---

### Closing

**Heading**
Start a conversation

**Body**
An initial conversation carries no cost and no obligation.

**Action:** Contact Firmcraft

---

## Page 3 — How We Work

*[This page keeps its substance and loses its staging chrome. Remove the numbered phase markers, the `01`–`05` labels, the week annotations, the schedule and scorecard mock-up panels, and the "Inputs / Activities / Output / Owned by" label grids. The method is described in prose.]*

### Header

**Heading**
How we work

**Introduction**
Firmcraft's approach is adapted from enterprise systems implementation rather than from software piloting. Most artificial intelligence projects fail during scoping rather than during engineering, and the sequence below is built around that observation.

---

### Section — Discovery

Work begins with interviews of the people who perform the work in question — finance, operations, information technology, and whoever is responsible for the chart of accounts. Alongside the interviews, Firmcraft compiles an inventory of the systems in use and maps the processes that are candidates for change.

The output is a working document describing the current landscape, including the discrepancies between what the organization's systems are understood to do and what its people actually do. That document is referenced throughout the engagement.

---

### Section — Fit-gap analysis

Each candidate process is assessed against three questions. Does an existing system already perform this function. Does an existing system nearly perform it. Or is this genuinely absent.

Only the second and third categories proceed. Processes that fall into the first receive a recommendation not to build, with an explanation. In practice this analysis frequently pays for the engagement on its own, because organizations are often unaware of capability they already hold.

Candidates that proceed are assessed on feasibility, expected return, and whether they can be operated within the client's data sovereignty requirements.

---

### Section — Configuration

Implementation work follows the assessment: building what was agreed, integrating it with the systems already in place, and establishing the operational controls around it. Access, permissions, audit logging, and exception handling are treated as part of the build rather than as items to be addressed afterwards.

---

### Section — Training and evaluation

Two things happen in parallel. The people who will use the system are trained on it, using their own work rather than illustrative examples. And an evaluation framework is established so that the system's output can be assessed objectively over time rather than by impression.

Evaluation matters more for artificial intelligence than for conventional software. Behavior changes as models change, and without measurement that drift is not visible until it causes a problem.

---

### Section — Ongoing support

For a defined period after implementation, Firmcraft remains closely involved — resolving issues, adjusting configuration in response to real use, and confirming that the measured outcomes match what was projected during the assessment.

Beyond that period, clients generally move to ongoing managed services.

---

### Closing

**Heading**
Start a conversation

**Action:** Contact Firmcraft

---

## Page 4 — Data Sovereignty

### Header

**Heading**
Data sovereignty

**Introduction**
Firmcraft's default position is that client data remains within the client's own environment. This page sets out what that means in practice and how the decisions are made.

---

### Section — The default position

Where an artificial intelligence capability can reasonably be operated inside a client's own infrastructure, that is how Firmcraft builds it. Client records, documents, and operational data remain within the client's control, and the organization retains the ability to audit what has been processed and when.

---

### Section — When hosted services are appropriate

There are tasks for which a hosted model is the better tool, and Firmcraft will recommend one where that is the case.

Where it does, three conditions apply. The decision is made explicitly and recorded, rather than arrived at because it was the simpler path to build. The data handling terms are reviewed and found acceptable by the client. And the categories of data involved are agreed in advance rather than determined during implementation.

---

### Section — What clients own

Firmcraft deploys an open-source foundation, licensed under Apache 2.0, when a self-hosted and client-owned configuration is the appropriate answer. Where that applies, the client owns the deployment. Firmcraft maintains it under the managed services relationship, but the client is not dependent on that relationship continuing in order to keep operating.

This is not offered as a required component of every engagement. Where a client's circumstances call for a different configuration, that is what Firmcraft builds.

---

### Section — Commitments in writing

Sovereignty commitments belong in the engagement agreement rather than on a marketing page. Firmcraft will put its data handling undertakings into the contract, and expects to be asked to.

---

## Page 5 — For Small Business

### Header

**Heading**
For small business

**Introduction**
Smaller organizations often need the same operational relief as mid-market companies without the scale to justify a full advisory engagement. For these clients, Firmcraft operates a managed artificial intelligence capability directly.

---

### Section — What it does

The capability operates within the tools a business already uses for day-to-day communication. It handles routine administrative work — drafting and issuing documents, managing correspondence, scheduling, and following up on outstanding items — and connects to the systems the business already relies on.

It is operated by Firmcraft rather than installed and handed over. Configuration, maintenance, and changes are handled as part of the service.

---

### Section — Who it suits

This is appropriate for owner-operated and small-team businesses where administrative work is absorbing time that should be spent on the work itself, and where there is no one on staff whose role is to configure and maintain software.

Larger organizations often want the same capability, operated across departments and connected to more systems. That work is handled within an advisory engagement rather than as a standalone service.

---

### Closing

**Heading**
Start a conversation

**Action:** Contact Firmcraft

---

## Page 6 — About

### Header

**Heading**
About Firmcraft

**Introduction**
Firmcraft is an advisory practice working with mid-market organizations on artificial intelligence and technology strategy, implementation, and ongoing management.

---

### Section — Founder

*[Photo: `/founder/doyle.jpg` beside the bio. Professional treatment only: no pull quote, no credential badges, no skill tags. Name and title as plain text.]*

**Doyle Dettro**
Founder and Principal

Doyle Dettro earned his bachelor's degree in accounting at the University of Illinois, passing the CPA examination while completing it, and joined Arthur Andersen on graduation. He then worked at early-stage companies, including one through its initial public offering.

For more than two decades since, his career has been in enterprise software and digital transformation, working on ERP and enterprise asset management systems for operations-heavy and asset-intensive organizations around the world. That work has spanned business process design, solution architecture, implementation, and the commercial side of major system decisions. Over that time he has advised hundreds of businesses on their systems and operations.

He founded Firmcraft to apply that experience to artificial intelligence, which most organizations are now adopting without the discipline they would bring to any other major system. He leads every Firmcraft engagement directly and builds and operates the firm's AI infrastructure himself.

---

### Section — Why the practice is built this way

Artificial intelligence projects do not usually fail for technical reasons. They fail because the person defining the work does not understand the operational and financial processes the technology has to fit into: they have not run an implementation, have not sat through a fit-gap analysis, and cannot tell when the underlying data will not support what is being proposed. Firmcraft is built around the opposite arrangement.

---

### Section — Operating principles

**Process before technology**
The workflow is mapped before a tool is selected. Whether a process should change is settled before the question of what technology to apply to it.

**Data sovereignty by default**
Client data remains within the client's environment unless there is a specific reason for it not to, the client has agreed, and the terms have been reviewed.

**Independence**
Firmcraft does not resell software and does not take vendor margin. Recommendations are not shaped by partner relationships.

**Continuity of engagement**
The person who scopes an engagement leads the implementation and remains through ongoing support. Engagements are not passed to a delivery team.

---

### Section — SkillCalibrate

SkillCalibrate is Firmcraft's training and capability practice, covering the organizational side of artificial intelligence adoption. Where an engagement requires that a client's own people develop working competence rather than receive a delivered system, that work is carried out under SkillCalibrate.

*[Short block only. Link to skillcalibrate.com. Do not give it a nav slot.]*

---

### Closing

**Heading**
Start a conversation

**Body**
An initial conversation carries no cost and no obligation. If artificial intelligence is not the right investment for the problem you are describing, Firmcraft will say so.

**Action:** Contact Firmcraft

---

## Implementation checklist

- [ ] Navigation reduced to Advisory · How We Work · For Small Business · About, plus Contact
- [ ] Footer rebuilt per the structure above, including Data Sovereignty and SkillCalibrate
- [ ] All four redirects in place
- [ ] All `<title>` and meta descriptions replaced; no figures, no product names
- [ ] No currency figures anywhere in the rendered site
- [ ] No package, tier, SKU, duration, or fee language anywhere
- [ ] No product or vendor names; industry and function names retained
- [ ] Numbered section labels removed (`01 ·`, `Phase 01 ·`, `Build · 02`)
- [ ] Roman-numeral principle lists replaced with plain headings
- [ ] Decorative separators, status badges, and pull-quote treatments removed
- [ ] `operator.run` badge removed
- [ ] Contact route confirmed working, to `hello@firmcraft.ai`

### Verification

```bash
curl -sS https://firmcraft.ai | grep -ohiE '\$[0-9,]+|business central|netsuite|acumatica|operator\.run' | sort -u
# expect no output

for p in "" advisory how-we-work sovereignty for-small-business about; do
  printf '%-22s ' "/$p"; curl -sSI "https://firmcraft.ai/$p" | head -1
done
# expect 200 on all six

for p in pricing services operator methodology; do
  printf '%-14s ' "/$p"; curl -sSI "https://firmcraft.ai/$p" | head -1
done
# expect 301 on all four
```

---

## Amendment — Broaden the audience (Oct 2026, approved by Doyle)

Firmcraft serves businesses across industries and of every size. Doyle works with chief executives and boards as readily as with owners of small businesses, and his next engagement is a real estate business. Remove copy that narrows the firm to **asset-intensive industries** or to **mid-market companies**.

**Standing rule 5:** Do not name a target industry or company-size band. Describe clients as *business owners and executive teams* or simply *organizations*.

### Metadata (`layout.tsx`, `page.tsx`, `structured-data.ts`)
- Title (all instances): `Firmcraft — AI Advisory and Managed Services`
- Description (all instances): `Firmcraft advises business owners and executive teams on artificial intelligence and technology strategy, implements what the strategy requires, and manages it on an ongoing basis.`
- OG/Twitter short description: `Advisory, managed services, and infrastructure for organizations adopting artificial intelligence.`
- `knowsAbout`: replace `'mid-market ERP implementation'` with `'ERP implementation'`.

### Homepage
- **H1:** `AI advisory and managed services`
- **Lede:** Firmcraft advises business owners and executive teams on artificial intelligence and technology strategy, implements what that strategy requires, and manages the result on an ongoing basis. The practice brings together business process, industry, and enterprise systems experience with hands-on technical implementation.
- **"Business process, industry, and systems depth" body:** Firmcraft is led by an advisor with more than two decades in enterprise software and digital transformation. That work has spanned business process design, solution architecture, and implementation for organizations across a wide range of industries, from owner-led businesses to large enterprises, around the world.
- **Problem section, "pace of change" paragraph:** …A decision that was reasonable eighteen months ago may no longer be, and few organizations have someone on staff whose job is to track that.
- **Problem section, "Larger consulting firms…" paragraph — replace with:** Firms that specialize in artificial intelligence often lack working familiarity with the financial and operational systems a business depends on, and firms that know those systems rarely build and operate artificial intelligence themselves. Firmcraft was established to do both.
- **"Who Firmcraft works with" intro:** Firmcraft works with organizations where the owner, the chief executive, or senior leadership drives the technology agenda, from owner-led businesses to the executive teams of larger enterprises.
- **Fit table:** delete the `Headcount` row (`50 to 1,500 employees`). Change `Scale` to `Established operating business of any size`. Change the `Organizational lead` value to `Owner, chief executive, chief financial officer, chief operating officer, or other senior leader`.
- **Delete** the paragraph under the table beginning "Firmcraft is generally not the right fit for pre-revenue companies…".

### About
- **Lede:** Firmcraft is an advisory practice working with business owners and executive teams on artificial intelligence and technology strategy, implementation, and ongoing management.
- **Bio, second paragraph, first sentence:** For more than two decades since, his career has been in enterprise software and digital transformation, working on ERP and other enterprise systems for organizations across a wide range of industries around the world. *(Rest of the paragraph unchanged, including "Over that time he has advised hundreds of businesses on their systems and operations.")*

### For small business
- **Lede, first sentence:** Smaller organizations often need the same operational relief as larger companies without the scale to justify a full advisory engagement.

### `public/llms.txt`
Update the summary and the "works with" line to match the homepage lede and the "Who Firmcraft works with" copy above. No "mid-market", "operations-heavy", or "asset-intensive".

### Verify
```bash
for p in "" about advisory how-we-work for-small-business sovereignty llms.txt; do
  printf '%-20s ' "/$p"; curl -sSL "https://firmcraft.ai/$p" | grep -oiE 'mid-market|asset-intensive|operations-heavy|50 to 1,500|not the right fit' | sort -u | tr '\n' ' '; echo
done
# expect no matches on any line
```

---

## Amendment — Process redesign method (Oct 2026, approved by Doyle)

Doyle asked for the method to reflect process redesign more explicitly: understand how the work actually proceeds, redesign the process before automating any of it, measure current performance before building, and build inside the systems the organization already uses. The copy below is Firmcraft's own. Do not quote or paraphrase outside sources on the site.

### Homepage — problem section

Insert as the **second** paragraph, after "In most organizations, artificial intelligence arrived from the bottom up…":

> Most of that artificial intelligence has been applied to processes as they already exist. In a typical business process, the time spent doing the work is small compared with the time spent waiting between steps, for documents, for approvals, or for a reply from another team. Making each step faster leaves that waiting in place, which is why many initiatives produce satisfied users and little measurable change in how the organization performs.

The remaining paragraphs and the closing statement are unchanged.

### Homepage — "What distinguishes Firmcraft"

- **Business process, industry, and systems depth:** keep the current body and add this sentence at the end:
  > The same advisor designs the process, understands the systems it runs on, and builds and operates the artificial intelligence that supports it.
- **An established implementation method:** replace the body with:
  > Firmcraft's approach is adapted from enterprise systems implementation rather than from software piloting. Each process is redesigned before any part of it is automated, and its current performance is measured before anything is built, so that results can be compared against a known starting point.

### How we work

**Stage names (overview line and section headings):**
`01 Discovery · 02 Process redesign · 03 Implementation · 04 Training and evaluation · 05 Ongoing support`

The lede is unchanged.

**01 Discovery**

> Work begins with interviews of the people who perform the work in question, from the staff who handle it each day to the leaders accountable for its results. Alongside the interviews, Firmcraft reviews the records held in the organization's own systems: when each item was created, who handled it, how long it waited, and how often it was corrected. The interviews identify where the difficulty lies, and the system records show how often it occurs and what it costs.
>
> For each process, the review establishes how the work proceeds when nothing goes wrong, which cases depart from that path and how they are resolved, what happens before and after the process, which system is treated as authoritative when two disagree, and how much of the elapsed time is spent on the work itself.
>
> The output is a working document describing the current landscape, including the differences between what the organization's systems are understood to do and what its people actually do. That document is referenced throughout the engagement.

**02 Process redesign** *(replaces "Fit-gap analysis")*

> Before any step is automated, Firmcraft asks whether it needs to exist, and whether a system the organization already owns can perform it. Steps that exist only to move work between people, such as chasing documents, re-entering data, or waiting for a reply, are often removed entirely. A recommendation not to build, with an explanation, is a common outcome of this stage.
>
> Each remaining step is assigned to one of three treatments:
>
> 1. **Conventional software,** for steps that follow fixed rules. It is inexpensive, predictable, and auditable.
> 2. **An artificial intelligence agent,** for steps that require judgment, where there is a sufficient record of past decisions and the consequence of an error is limited. Its output is measured.
> 3. **A person,** for steps where the risk is higher, with the relevant information assembled in advance so that the decision can be made quickly.
>
> The current performance of each process is measured before anything is built, using elapsed time, cost, error rate, or whichever measure the organization already relies on. Work is then prioritized by where the most time is lost between steps, which is often not where the volume is highest.

*(Render the three treatments as the numbered list in the §4b design, replacing the former three fit-gap questions.)*

**03 Implementation** *(replaces "Configuration")*

> Implementation follows the redesign. Firmcraft builds what was agreed inside the systems the organization already uses, and introduces new systems only where there is no reasonable alternative. Access, permissions, audit logging, and exception handling are treated as part of the build rather than as items to be addressed afterwards.
>
> An organization does not need to consolidate its systems before this work begins. Agents can work across systems that hold inconsistent records, provided it is clear which system is authoritative for each item.

**04 Training and evaluation** — keep both current paragraphs and add:

> Evaluation is designed so that the underlying model can be changed without loss of control, and the organization is not dependent on a single provider.

**05 Ongoing support** — keep both current paragraphs and add, as the second paragraph:

> Results are reported against the measurements taken before the work began.

### Verify

```bash
curl -sSL https://firmcraft.ai/how-we-work | grep -oE 'Process redesign|Implementation|Conventional software|authoritative' | sort -u   # expect all four
curl -sSL https://firmcraft.ai/how-we-work | grep -oE 'Fit-gap analysis|Configuration' | sort -u                                   # expect none
```
