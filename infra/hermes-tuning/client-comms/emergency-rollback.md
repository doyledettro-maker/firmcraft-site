---
template: emergency-rollback
recommended_send: Within 30 minutes of completing the rollback
required_placeholders:
  - CLIENT_NAME
  - INSTANCE_NAME
  - VERSION_FROM          # Version we tried to install (the one that failed)
  - ROLLBACK_VERSION      # Version now running (the previous-known-good)
  - INCIDENT_START        # e.g. "9:04pm CT"
  - INCIDENT_END          # e.g. "9:18pm CT" — when service was restored
  - ISSUE_SUMMARY         # One or two plain sentences about what went wrong. No jargon.
  - NEXT_STEPS            # What we'll do next; when we'll try again or how we'll close the loop
  - SUPPORT_EMAIL
  - SENDER_NAME
---

Subject: We rolled back the upgrade — {{INSTANCE_NAME}} is healthy

Hi {{CLIENT_NAME}},

Quick, direct update: the upgrade to {{VERSION_FROM}} didn't go cleanly, so we rolled {{INSTANCE_NAME}} back to {{ROLLBACK_VERSION}}. It's been running normally since {{INCIDENT_END}}.

**Timeline**

- {{INCIDENT_START}} — Upgrade started, banner went up.
- During the upgrade — we hit a problem: {{ISSUE_SUMMARY}}
- {{INCIDENT_END}} — Rollback complete. Agent verified healthy, config restored from backup.

Total time you were degraded: from {{INCIDENT_START}} to {{INCIDENT_END}}.

**Your data and config**

Untouched. We back up `config.yaml` before any change and verify it byte-for-byte afterward — that's exactly the safeguard that caught this one. No skills, no settings, and no history were lost.

**What's next**

{{NEXT_STEPS}}

I'd rather flag a clean rollback than push through a bad upgrade — that's the deal. If you have questions or want to talk through it, reply here or write to {{SUPPORT_EMAIL}}. I'm happy to get on a call.

— {{SENDER_NAME}}
Firmcraft
