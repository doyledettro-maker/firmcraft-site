# Firmcraft — Commissioned Software Spec

**Status:** Approved by Doyle (Oct 2026). As built.
**Scope:** A fourth service line, a new footer-level page at `/commissioned-software`, a fourth homepage service card, a new Advisory section, and cross-links.
**Companion documents:** `firmcraft-copy-spec.md` (standing rules and voice), `firmcraft-saaa-page-spec.md` (Adaptable Software, the ownership principle this service delivers)

---

## The service, in Doyle's terms

Firmcraft builds software that public bodies and private organizations commonly obtain by subscription, to the client's specification, and hands it over. The client hosts it, receives all code and documentation, and can change it with its own staff or AI tools. Firmcraft supports it under managed services. It is part of the sovereignty and adaptable-software idea.

## Decisions (Oct 2026)

1. **Fourth service line.** Commissioned software joins Advisory, Managed AI services, and Infrastructure. It is the one exception to "implementation is never sold as a separate line", because the deliverable is a system the client owns.
2. **Public bodies may be named** on the Commissioned Software page. This is an approved exception to the rule against naming a target sector.
3. **No cost claims.** The site does not say the service costs less than a subscription. The lifetime cost comparison is a step of the service, and real figures will come from case studies.
4. **Category list.** The page names permitting and licensing, case management, grants administration, inspections, and service requests. Do not add field service, work orders, or asset management without Doyle's confirmation.

## Page copy (`/commissioned-software`)

**`<title>`:** Commissioned Software — Firmcraft
**Meta description:** Firmcraft builds systems that organizations commonly obtain by subscription, to the client's specification, and transfers them to the client to host, own, and change.
**Eyebrow:** Practice · **H1:** Commissioned Software

**Lede**
Many organizations rely on subscription software for systems that support one particular process, such as permitting and licensing, case management, grants administration, inspections, or service requests. Firmcraft builds systems of this kind to the client's specification and transfers them to the client. The client hosts the system in its own environment, owns its source code and documentation, and can change it with its own staff or with AI coding tools. Firmcraft supports the system under its managed services where the client wishes.

**Systems suited to this approach**
The approach suits systems that organize a particular workflow: receiving applications or requests, routing them for review, recording decisions, scheduling work, and reporting on progress. Organizations often obtain these systems by subscription and configure them to approximate how they work, and much of the capability they pay for goes unused.

It is generally not suited to software whose value depends on content the vendor maintains for its customers, such as payroll tax rules, or to widely used general-purpose tools. Where a subscription is the better arrangement, Firmcraft recommends keeping it.

**How the work proceeds** (numbered list)
1. **Review of the current system.** Firmcraft establishes which functions of the current system are relied on, what data it holds, which other systems it connects to, and when the subscription renews.
2. **Specification.** The specification is written from how the organization performs the work, using the same process redesign that precedes every Firmcraft implementation.
3. **Cost comparison.** Before any work is commissioned, Firmcraft compares the expected cost of the new system over its working life, including hosting, support, and further development, with the cost of the subscription it would replace. The client decides on that basis.
4. **Build and data transfer.** The system is built, records are transferred from the existing system, and the two run in parallel until the new system is confirmed to be working. Where possible, the change is timed to the renewal date of the subscription being replaced.
5. **Handover.** The client receives the source code, infrastructure configuration, documentation, test suite, and agent instructions described in Adaptable Software. Staff who will maintain the system can be trained through SkillCalibrate.
6. **Support.** Firmcraft remains available for support and further development under its managed services. The client does not need to retain Firmcraft in order to keep using or changing the system.

**Responsibilities after handover**
Once the system is handed over, the client is responsible for operating it, including hosting, backups, security updates, access management, and accessibility conformance. Firmcraft sets out these responsibilities in writing at handover and can carry them out on the client's behalf under its managed services.

**For public bodies**
Public bodies in a number of jurisdictions are required to own the software developed for them, to make it available to other public bodies, and to meet accessibility and records obligations in the systems they operate. Software that Firmcraft builds for a public body is delivered with the rights and documentation those obligations require, and is built to recognized accessibility standards.

**Closing:** Start a conversation. An initial conversation carries no cost and no obligation. Action: Contact Firmcraft.

## Elsewhere on the site

- **Homepage, "What Firmcraft does":** fourth card, eyebrow and H3 "Commissioned software", photo `public/media/service-commissioned.jpg`. Body: *Building systems that organizations commonly obtain by subscription, to the client's specification, and transferring them to the client to host and own, together with the source code and documentation needed to change them with its own staff or AI coding tools.* The grid is now two by two (16:9 images). The section intro reads "Implementation runs through each of the areas below."
- **Advisory:** the lede now names software built for clients to own; a "Commissioned software" section follows Infrastructure; a Service structured-data entry is added.
- **Adaptable Software:** a closing sentence in "Why custom software is now a practical choice" links to Commissioned Software.
- **Footer:** "Commissioned Software" after "Adaptable Software". Sitemap and `llms.txt` entries added.

## Research behind the positioning (Oct 2026)

- About 46% of SaaS licences go unused on average (Zylo; 55% for large enterprises in 2024).
- SaaS renewal prices rose roughly 8–12% a year against general inflation of about 2.7% (Vertice, SaaStr; vendor-adjacent sources).
- 35% of surveyed organizations had replaced at least one SaaS product with custom software, and 78% planned more (Retool 2026; vendor survey of its own customers).
- The US SHARE IT Act (December 2024) requires federal agencies to own and share custom code. FAR 52.227-14 gives the government broad rights in software first produced under a contract.
- Maintenance is usually 60–80% of a system's lifetime cost. This is why managed support is central to the offering.
- A 2025 METR randomized trial found experienced developers 19% slower with early-2025 AI tools on code they knew. The copy therefore describes AI coding tools as working under an engineer's direction and does not promise automatic maintenance.

## Verify

```bash
curl -sSI https://firmcraft.ai/commissioned-software | head -1                       # expect 200
for p in "" advisory adaptable-software about; do printf '%-20s ' "/$p"; curl -sSL "https://firmcraft.ai/$p" | grep -c 'href="/commissioned-software"'; done   # expect ≥1
curl -sSL https://firmcraft.ai/commissioned-software | grep -oiE '\$[0-9]|cheaper|less expensive than|SaaS' | sort -u   # expect none
```
