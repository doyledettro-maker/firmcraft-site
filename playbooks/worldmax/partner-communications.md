---
name: worldmax-partner-communications
description: Manage outbound and inbound communication with WorldMax reseller partners — drafting updates, tracking commitments, generating performance summaries, and answering routine partner questions from templates.
version: 0.1.0
metadata:
  hermes:
    tags: [worldmax, partners, crm]
    category: partner-management
    requires_toolsets: [email, crm, slack]
---

# WorldMax — Partner Communications

## When to Use

This is the catch-all for routine reseller-partner interaction. Hermes uses it for both outbound (we have something to say) and inbound (a partner asks something) flows.

**Triggering events:**
- Mary says "send the partner update," "draft a note to <partner>," or "summarize how <partner> is doing"
- Inbound email from a known partner contact (must already exist in CRM as a partner)
- Recurring: monthly partner update on the 1st business day of the month
- Partner deadline coming due (from the commitments tracker)

**Do NOT use this skill when:**
- The sender is a brand-new contact → `lead-intake`
- The question is specifically about an order's status → `order-tracking`
- The question is about commission owed/paid → `commission-tracking`
- The question is about an invoice we sent them → `invoice-followup`

## Inputs

Depends on subflow. Hermes picks one of: announcement, inbound-reply, performance-summary, commitment-check.

- For announcements: `topic`, `audience` (all partners / a tier / a region / one partner), `key_points`, optional `call_to_action`
- For replies: `inbound_message`, `partner_id`
- For summaries: `partner_id` and `period` (default: trailing 30 days)
- For commitment checks: pulled from the commitments tracker

## Procedure

### Subflow A — Outbound announcement / partner update

1. Identify the audience. Pull the partner list from CRM with the right tier/region filter.
2. Draft the message in WorldMax's voice (warm, direct, no marketing fluff). Lead with the change or news; put context after. Keep it under 200 words for routine updates.
3. Include any partner-specific data when relevant — current quarter's volume, open orders, payout YTD.
4. Show the draft to Mary for approval. Do NOT send to partner audiences without explicit Mary approval.
5. After approval, send via the partner-comms email address; BCC `archive@worldmax.com`.
6. Log the send in CRM under each recipient's activity.

### Subflow B — Inbound partner reply

1. Identify the partner from the sender. If not in CRM as a partner, hand off to `lead-intake`.
2. Classify the question: routine (covered by templates) vs. non-routine.
3. **Routine** — pull the matching template from `playbooks/worldmax/_templates/partner/`, personalize it, draft the reply. Show Mary unless the template is flagged auto-send.
4. **Non-routine** — draft a holding reply ("Got your note, will come back to you by EOD with answers on X and Y"), send it, then escalate the underlying question to Mary with a one-paragraph summary.
5. Log the inbound + reply in CRM.

### Subflow C — Partner performance summary

1. Pull from CRM/orders for the period:
   - Order count and total $ volume
   - On-time delivery rate
   - Open orders and their status
   - Commission earned (cross-reference `commission-tracking`)
   - Any open issues, RMAs, or escalations
2. Render as a 1-page summary: numbers up top, narrative below.
3. Compare to prior period — call out anything ±20% or more.
4. Return to Mary; do not send directly to the partner unless Mary asks.

### Subflow D — Commitment / deadline check

1. Each Monday at 8am CT, scan the partner-commitments tracker for items due this week or overdue.
2. For overdue items, draft a polite nudge to the partner contact. Show Mary first.
3. For items due this week, post a heads-up to `#worldmax-partners` so the team is aware.

## Outputs

- Drafted or sent emails (logged in CRM)
- Slack posts when relevant
- Performance summary documents
- Updates to the partner-commitments tracker

## Pitfalls

- **Tone matters more here than in lead-intake.** Partners are existing relationships. Avoid templated-sounding openings ("I hope this finds you well"). Use the partner's name, reference real recent activity.
- **Do not send broadcast announcements without Mary's explicit OK** even if it looks routine. One bad blast erodes a lot of trust.
- **Commission and order data must be fresh.** If pulling from a stale snapshot, say so in the summary rather than presenting old numbers as current.
- **Confidentiality.** Never share one partner's volume or commission with another partner, even by implication ("our top partner did X this month").

## Verification

- Sent emails appear in `archive@worldmax.com` BCC archive.
- CRM activity log shows the touch under the right partner record.
- Performance summaries include the period and the data-pull timestamp.

## Example Interaction

> **Trigger:** Inbound email from Jen at MidStates Supply: "Hey, just wanted to check — when does the new Q2 reseller pricing kick in? And is the volume tier threshold the same?"
>
> **Hermes:**
> 1. Identified Jen as MidStates Supply partner contact (CRM `PART-0042`).
> 2. Classified: routine — covered by the `q2-pricing-faq` template.
> 3. Pulled the template, personalized with MidStates' current tier (Gold, threshold $40k/quarter — unchanged).
> 4. Draft reply ready for Mary's review confirming Q2 pricing starts April 1, tier thresholds unchanged, link to the updated price sheet.
>
> **To Mary:** "Reply drafted to Jen at MidStates re: Q2 pricing. Routine — used the q2-pricing-faq template. Approve to send?"

## Customization Notes

- Templates live in `playbooks/worldmax/_templates/partner/` (create as needed).
- Auto-send vs. review-first is a per-template flag — default to review-first until Mary explicitly approves a template for auto-send.
- Tier definitions and pricing live in `playbooks/worldmax/_config/partner-tiers.yaml` (TBD).
