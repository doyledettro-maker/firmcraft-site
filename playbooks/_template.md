---
name: skill-name
description: One sentence describing what this skill does and when the agent should reach for it. Be specific — vague descriptions cause the wrong skill to fire.
version: 0.1.0
metadata:
  hermes:
    tags: [client-name, category]
    category: workflow
    requires_toolsets: []
---

# Skill Title

## When to Use

When does Hermes invoke this skill? List concrete trigger phrases or event types.

**Trigger phrases:**
- "..."
- "..."

**Triggering events (if event-driven):**
- New row in `<system>` table `<x>`
- Email received matching `<filter>`
- Scheduled: every weekday at 8:00 AM CT

**Do NOT use this skill when:**
- ... (point at the right skill instead)

## Inputs

What does Hermes need to start? If anything is missing, ask the user before proceeding.

- `field_a` — required, what it is
- `field_b` — optional, default `<value>`

## Procedure

1. Step one — be concrete. Name the tool, the system, the field.
2. Step two.
3. ...

## Outputs

What gets written, sent, or returned when this skill finishes successfully.

- CRM record created with ID `<id>`
- Slack message posted to `#<channel>`
- Confirmation returned to user

## Pitfalls

- Known failure modes and how to recover.
- Things that look like a match but aren't — point at the right skill.

## Verification

How does Hermes (or the human) confirm the skill did what it should?

- Check `<system>` for `<artifact>`
- Reply confirms `<state>`

## Example Interaction

> **User:** "..."
>
> **Hermes:** [walks through the steps, narrates what it did, links to the artifacts]

## Customization Notes

Anything a Firmcraft engineer should know when adapting this skill for a different client — knobs, assumptions, integrations to swap.
