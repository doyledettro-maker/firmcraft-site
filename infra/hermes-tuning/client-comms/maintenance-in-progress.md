---
template: maintenance-in-progress
recommended_send: At MAINTENANCE_WINDOW start time
required_placeholders:
  - CLIENT_NAME
  - INSTANCE_NAME
  - START_TIME            # e.g. "9:00pm CT"
  - END_TIME              # Expected completion, e.g. "9:30pm CT"
  - SUPPORT_EMAIL
  - SENDER_NAME
---

Subject: Maintenance starting now — {{INSTANCE_NAME}}

Hi {{CLIENT_NAME}},

We're kicking off the {{INSTANCE_NAME}} upgrade now ({{START_TIME}}). Expected back online by **{{END_TIME}}**.

A maintenance banner is showing on your dashboard for the duration. If you try to use the agent during the window you may see a connection error — that's expected and harmless.

I'll send a short confirmation as soon as we're done.

If anything urgent comes up, reach me directly at {{SUPPORT_EMAIL}}.

— {{SENDER_NAME}}
Firmcraft
