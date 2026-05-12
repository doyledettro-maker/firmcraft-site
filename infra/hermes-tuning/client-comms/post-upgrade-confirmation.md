---
template: post-upgrade-confirmation
recommended_send: Within 15 minutes of upgrade completion
required_placeholders:
  - CLIENT_NAME
  - INSTANCE_NAME
  - VERSION_TO            # New running version
  - COMPLETION_TIME       # e.g. "9:22pm CT"
  - NEW_FEATURES          # 2-4 bullets, plain language, framed as benefits not changelog dumps
  - CLIENT_ACTION         # Optional — set to "None — you're all set." if nothing required
  - SUPPORT_EMAIL
  - SENDER_NAME
---

Subject: All done — {{INSTANCE_NAME}} is back up

Hi {{CLIENT_NAME}},

{{INSTANCE_NAME}} is back online as of {{COMPLETION_TIME}}, now running version {{VERSION_TO}}. Everything checked out:

- Your tuned config came through untouched
- Containers came up healthy on the first try
- The dashboard banner has switched to "upgrade complete" — it'll fade away on its own in a few days

What's new for you:

{{NEW_FEATURES}}

Anything you need to do:

{{CLIENT_ACTION}}

If you notice anything odd over the next day or two — slower responses, missing skills, banner stuck on screen — let me know and we'll dig in. Quietest path to reach us is {{SUPPORT_EMAIL}}.

Thanks for the window.

— {{SENDER_NAME}}
Firmcraft
