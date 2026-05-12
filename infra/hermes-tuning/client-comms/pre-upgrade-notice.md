---
template: pre-upgrade-notice
recommended_send: 24-48h before MAINTENANCE_WINDOW
required_placeholders:
  - CLIENT_NAME           # First name of primary contact
  - INSTANCE_NAME         # Friendly name for the agent (e.g. "your Hermes operator")
  - VERSION_FROM          # Current version, e.g. "1.3.2"
  - VERSION_TO            # Target version, e.g. "1.4.0"
  - MAINTENANCE_WINDOW    # Human-readable, e.g. "Wednesday May 14, 9:00pm – 9:30pm CT"
  - DOWNTIME_ESTIMATE     # e.g. "about 5 minutes" or "~15 minutes"
  - NEW_FEATURES          # Bullet list, 2-4 items, plain language
  - SUPPORT_EMAIL         # e.g. "support@firmcraft.ai"
  - SENDER_NAME           # Person signing off
---

Subject: Heads up — quick maintenance window for {{INSTANCE_NAME}}

Hi {{CLIENT_NAME}},

Quick note before it lands on your calendar: we'll be upgrading {{INSTANCE_NAME}} from version {{VERSION_FROM}} to {{VERSION_TO}} during the following window:

  **{{MAINTENANCE_WINDOW}}**

Expected downtime is {{DOWNTIME_ESTIMATE}}. Nothing on your side needs to change — the agent will be unreachable briefly while we rebuild containers, and then it'll come right back with the same settings, same skills, same data.

What's in this upgrade:

{{NEW_FEATURES}}

A few practical notes:

- We back up your tuned config before the upgrade and verify it survived afterward. If anything looks off, we automatically restore from backup.
- We'll also push a maintenance banner to your dashboard at the start of the window so anyone using it knows what's happening.
- If you'd rather we run this at a different time, just reply to this email and we'll reschedule. No drama.

You don't need to do anything to prepare. We'll send a short note when maintenance starts and another when we're done.

Questions or want to push it back? Reply here or write to {{SUPPORT_EMAIL}}.

— {{SENDER_NAME}}
Firmcraft
