---
client: WorldMax
workstream: Firmcraft Workstream 7
status: initial draft
---

# WorldMax Playbooks

This directory holds the **Hermes Agent skills** that Firmcraft is building for WorldMax (B2B reseller). Each `.md` file in this folder is one skill — a self-contained playbook describing when Hermes should fire it, what inputs it needs, the procedure to follow, and how to verify it worked.

## What's here

| File | Purpose |
|---|---|
| [`lead-intake.md`](./lead-intake.md) | Process new leads — capture, log, ack, notify, schedule follow-up |
| [`partner-communications.md`](./partner-communications.md) | Manage reseller-partner email, announcements, performance summaries, deadlines |
| [`order-tracking.md`](./order-tracking.md) | Look up orders, send proactive delay notifications, escalate stuck orders |
| [`commission-tracking.md`](./commission-tracking.md) | Calculate commissions, run reports, handle disputes, reconcile payments |
| [`daily-briefing.md`](./daily-briefing.md) | Mary's 7am CT morning briefing |
| [`invoice-followup.md`](./invoice-followup.md) | AR — escalating-tone reminders, aging reports, overdue flags |

## How these map to Hermes skills

Hermes's native packaging is a **directory containing a `SKILL.md`** with YAML frontmatter and a body of markdown sections (`When to Use`, `Procedure`, `Pitfalls`, `Verification`). See the [Hermes skills docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).

We use a **flattened variant** in this repo — one `.md` file per skill instead of a directory — for two reasons:

1. **Easier to review and edit during the design phase.** Most skills don't need supporting assets yet; a single file keeps the diff small.
2. **Promotable.** When a skill grows assets (templates, config files, sub-prompts), we promote it to a directory: `lead-intake.md` → `lead-intake/SKILL.md` + `lead-intake/_templates/...`. The frontmatter and section structure are unchanged, so Hermes loads it identically either way.

The frontmatter and section names in our files match the Hermes spec, so the skills are loadable as-is once we drop them into a Hermes workspace.

### Frontmatter we use

```yaml
---
name: worldmax-<skill>            # globally unique
description: <one sentence — used by Hermes to decide which skill to fire>
version: 0.1.0
metadata:
  hermes:
    tags: [worldmax, <category>]
    category: <high-level grouping>
    requires_toolsets: [<tools the skill needs>]
---
```

### Sections we use

- **When to Use** — triggering events + explicit "do NOT use when" routing to other skills
- **Inputs** — what the skill needs to start
- **Procedure** — numbered steps, often broken into subflows (A/B/C/...) when one skill covers a related family of operations
- **Outputs** — what the skill produces
- **Pitfalls** — known failure modes; the part you regret omitting
- **Verification** — how to confirm the skill did what it should
- **Example Interaction** — one concrete walkthrough
- **Customization Notes** — knobs, integrations TBD, things a Firmcraft engineer should know when adapting

## Status of integrations (as of initial draft)

These playbooks reference systems that aren't wired up yet. Where you see "TBD" or "placeholder," that's a known gap:

- **CRM** — MCP server TBD. Steps that say "log to CRM" currently queue the call.
- **ERP** — MCP server TBD. Order/invoice lookups described as if the API exists.
- **Accounting** — for AR aging and commission reconciliation. TBD.
- **Email** — outbound sends use the configured business mailbox (TBD per environment).
- **Slack** — channel names assumed (`#worldmax-leads`, `#worldmax-fulfillment`, `#worldmax-finance`, `#worldmax-partners`). Confirm with Mary before instantiation.
- **Calendar** — for daily briefing prep and AE follow-up reminders.
- **Templates and config** — referenced as `_templates/` and `_config/` subdirs. Create when promoting a skill to a directory.

When an integration lands, update the affected skills' `Procedure` step and remove the placeholder language. Bump the skill's `version`.

## Customizing and extending

### Editing an existing skill

1. Read the `When to Use` and `Pitfalls` sections first — that's where most edits should land.
2. Make the change.
3. Bump `version` in the frontmatter.
4. If the change affects how Hermes routes between skills, update the `Do NOT use this skill when` cross-references in the related skills too.

### Adding a new skill for WorldMax

1. Copy [`../_template.md`](../_template.md) to `playbooks/worldmax/<skill-name>.md`.
2. Fill in frontmatter (`name: worldmax-<skill>`, version `0.1.0`).
3. Be specific in `description` — Hermes uses it to decide which skill to fire. Vague descriptions cause routing mistakes.
4. Write the `When to Use` block with explicit triggers AND explicit non-triggers (point at the right skill instead).
5. Add the new file to the table at the top of this README.
6. Cross-reference from the related skills' `Do NOT use this skill when` lists.

### Creating playbooks for a new client

This `worldmax/` folder is the model for how a Firmcraft client engagement is structured in the repo. For a new client:

1. Create `playbooks/<client>/` and a `playbooks/<client>/README.md` (start from this one).
2. Map the client's recurring workflows during discovery — one workflow per skill is the right granularity. If a workflow has obvious sub-variants, those become subflows (A/B/C) inside one skill, not separate skills.
3. Copy `playbooks/_template.md` per skill.
4. Resist the urge to write speculative skills. Start with the 4–6 highest-frequency or highest-pain workflows; add more once the core set proves itself in production.

### Style guide for skill content

- **Be concrete.** Name the system, the field, the channel, the threshold. "Log to CRM" is too vague; "Create CRM lead, tag with `source:<source>` and `intake-date:<today>`" is right.
- **Write the `Pitfalls` section like you've already been burned.** This is where institutional knowledge lives.
- **Explicit non-triggers in `When to Use` are as important as triggers.** Most skill-routing mistakes are "fired the wrong skill," not "failed to fire any skill."
- **Match tone to audience in templates.** Customer-facing tone is friendly and direct. Internal-facing tone can be terse.
- **Auto-send vs. review-first.** Default new outbound to review-first. Promote to auto-send only after Mary explicitly OKs a template's track record.
