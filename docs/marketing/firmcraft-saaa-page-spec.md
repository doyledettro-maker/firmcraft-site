# Firmcraft — Software as an Asset Page Spec

**Status:** Approved by Doyle (Oct 2026). Ready to build.
**Scope:** New footer-level page, footer link, cross-links from Advisory and Sovereignty, and one consistency edit to How we work.
**Companion documents:** `firmcraft-copy-spec.md` (standing rules and voice), `firmcraft-positioning-brief.md`, `firmcraft-redesign-spec.md` (visual treatment)

---

## Doyle's positions this page rests on (Oct 2026)

1. Every AI deployment involves software built for the client. AI cannot be deployed without something to work with: integrations, data access, rules, and controls. Typically this also means rules-based automation, AI embedded in specific steps, and dashboards built for how the client works. The more of a workflow that can be handled this way, the less an organization has to rely on subscription software it only partly uses.
2. Hosting depends on the client. Some will run the software themselves; others will have Firmcraft operate it. Firmcraft will always offer support and further development, but the people who run a business should be able to own the software that runs it.
3. Software Firmcraft builds for a client is proprietary to the client. Where an engagement uses a solution from Firmcraft's own library, that code is handed over to the client in the same way. Nothing is licensed back.

**Not on the site yet:** a library of solutions for particular industries, or for the gaps between ERP and CRM systems. That is a future direction. Do not mention it until it exists.

---

## Standing rules

All five standing rules from the copy spec apply:

1. Professional register. Complete sentences; headings describe; no fragments for emphasis, no rhetorical reversals, no punchlines, no repeated sentence frames.
2. No pricing and no packaging. No named agreements, tiers, or durations. Ongoing work is described as the existing **managed services**, not as a new offering.
3. No product or vendor names.
4. No reference to employment elsewhere.
5. No target industry or company-size band.

**Name (Doyle's decision):** the page is titled *Software as an Asset*, with the abbreviation *SaaA*. The play on "software as a service" is intended. Use the full name in the title, H1, and footer; use "SaaA" once, in parentheses after the first mention in the lede. The body copy still states what Firmcraft provides and does not argue against subscription software.

---

## Page — Software as an Asset

### Metadata

| Field | Value |
|---|---|
| Path | `/software-as-an-asset` |
| `<title>` | Software as an Asset — Firmcraft |
| Meta description | How Firmcraft structures the software it builds for clients so that the client owns it, can host it where it chooses, and can change it without depending on Firmcraft. |

### Header

**Eyebrow:** Software ownership

**H1:** Software as an Asset

**Lede**
Deploying artificial intelligence in an organization always involves software built for that organization. An artificial intelligence system needs integrations with the systems the business already runs, access to the right data, rules that govern what it may do, and controls around its output. Every Firmcraft engagement therefore includes software built for the client, typically rules-based automation, artificial intelligence embedded in particular steps of a process, integrations, and dashboards designed around how its people work. Firmcraft delivers that software as software as an asset (SaaA). The client owns it, and can operate it, host it, and change it on its own terms.

The people who understand a business best are the people who run it. Firmcraft's view is that they should own the software that supports their work and be able to decide how it changes.

### Section — What the client receives

The result of the work is a functioning system together with everything required to operate, maintain, and extend it: the application source code, the infrastructure configuration that defines where and how it runs, the database and its schema, written documentation of the system's design and behavior, a test suite, a deployment pipeline, and a development environment that another engineering team could use immediately. Where artificial intelligence is part of the system, the client also receives the agent instructions and the evaluation framework that govern how those components behave.

The system is built so that someone who did not build it can understand and modify it. Documentation, consistent naming, test coverage, and the structure of the code are treated as part of the work rather than as items to be completed afterwards.

### Section — How ownership works

The client owns the source code, the data, and the infrastructure configuration for software Firmcraft builds for it. The software is proprietary to the client, and its ownership is set out in the engagement agreement. Where an engagement uses a component from Firmcraft's own library of previously built solutions, that code is handed over to the client on the same basis.

Where the software runs depends on the client. Some clients host it in their own environment and operate it themselves. Others ask Firmcraft to operate it as part of its managed services. In either case the client owns the software and can move it to an environment of its choosing.

The client can also change the software without Firmcraft's involvement. There is no contractual restriction on who may work on the code. The client may assign its own staff, engage another engineering firm, or direct AI coding agents to make changes.

Firmcraft remains available for further development and support through its managed services, which give the client continued access to the people who built the system. That arrangement is not a condition of continuing to use the software.

### Section — Why custom software is now a practical choice

Many organizations pay for subscription software of which they use a small part, and adjust their processes to fit what that software was designed to do. Where a workflow can be handled by software built for it, working alongside the organization's existing financial and customer systems, the result is often simpler for staff to use and less expensive to run. Firmcraft makes that comparison during the process redesign and recommends a subscription product where it is the better answer.

The larger cost of custom software has historically been maintaining and changing it over time. Organizations often found that they could not change a custom system without returning to the original builder, because no one else understood it well enough to work on it safely. AI coding agents, working under the direction of an engineer, can now perform much of that work on code that is well structured, documented, and tested. Firmcraft builds with that in mind and delivers the documentation and agent instructions that make it possible.

### Section — Relationship to data sovereignty

Software ownership and data sovereignty are separate questions that support each other. Owning the code is of limited value if the data it works on is held in an environment the client does not control, and control of the data is incomplete if the software that processes it can be withdrawn by a third party. Firmcraft's default position on both is that the client retains control. How Firmcraft handles client data, including where it resides and what may be sent to hosted services, is set out in [Data Sovereignty](/sovereignty).

### Section — Ownership in the engagement agreement

The transfer of source code, infrastructure configuration, documentation, and related materials to the client, including any component drawn from Firmcraft's library, is written into the engagement agreement.

### Closing

**H2:** Start a conversation
**Body:** An initial conversation carries no cost and no obligation.
**Action:** Contact Firmcraft

---

## Consistency edit — How we work, 03 Implementation

The current first paragraph says Firmcraft "introduces new systems only where there is no reasonable alternative." That conflicts with software built for the client being part of every engagement. Replace the first paragraph with:

> Implementation follows the redesign. Firmcraft builds what was agreed around the systems the organization already relies on, such as its financial and customer systems. That work always includes software built for the client, because artificial intelligence needs integrations, access to data, rules, and controls in order to do useful work. Typically this means rules-based automation, artificial intelligence embedded in particular steps, integrations, and dashboards. The client owns that software. Access, permissions, audit logging, and exception handling are treated as part of the build rather than as items to be addressed afterwards.

Keep the second paragraph (no need to consolidate systems first) unchanged. Add after it:

> How ownership of that software is structured is described in [Software as an Asset](/software-as-an-asset).

The homepage "Independence" block stays as it is. It remains accurate: Firmcraft does not resell other vendors' software or take vendor margin.

---

## Cross-links

- **Advisory, Infrastructure section:** after "Further detail is set out in Data Sovereignty.", add:
  > How Firmcraft structures ownership of the software it builds is described in [Software as an Asset](/software-as-an-asset).
- **Sovereignty, "What clients own" section:** after the paragraph ending "…not dependent on that relationship continuing in order to keep operating.", add:
  > Ownership of software that Firmcraft builds for a client, including what is delivered and how the client can operate and change it independently, is described in [Software as an Asset](/software-as-an-asset).

## Implementation notes

- **Page:** `src/app/software-as-an-asset/page.tsx`, using the **Phase A inner-page treatment** from `firmcraft-redesign-spec.md`: cream background, hairline rules between sections, serif H1 and H2, brass-ink eyebrow, navy closing band. Do **not** copy the old alternating `surface-2` grey bands from `sovereignty/page.tsx`. Multi-paragraph sections follow the How we work pattern.
- **Footer:** add "Software as an Asset" to the Practice column, between "Data Sovereignty" and "For Small Business".
- **Header:** no change to the primary navigation. Add `'software-as-an-asset'` to the `SiteHeaderCurrent` type only if the component needs it to compile.
- **Sitemap and `llms.txt`:** add the page. `llms.txt` line: `/software-as-an-asset — Software as an Asset (SaaA): how Firmcraft structures the software it builds so that the client owns it.`

## Verify

```bash
curl -sSI https://firmcraft.ai/software-as-an-asset | head -1                     # expect 200
for p in "" advisory how-we-work sovereignty for-small-business about; do
  printf '%-22s ' "/$p"; curl -sSL "https://firmcraft.ai/$p" | grep -c 'software-as-an-asset'; done   # expect ≥1 everywhere
curl -sSL https://firmcraft.ai/software-as-an-asset | grep -oiE 'SaaS|\$[0-9]|subscription tier|package' | sort -u   # expect none
curl -sSL https://firmcraft.ai/how-we-work | grep -o 'no reasonable alternative'                                     # expect none
```
