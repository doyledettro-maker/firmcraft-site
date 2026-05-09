---
name: worldmax-lead-intake
description: Process a new inbound lead or sales inquiry for WorldMax — capture details, log to CRM, acknowledge the lead, notify sales, and schedule follow-up. Trigger whenever a new contact-form submission, sales email, or referral lands.
version: 0.1.0
metadata:
  hermes:
    tags: [worldmax, sales, crm]
    category: lead-management
    requires_toolsets: [email, crm, slack]
---

# WorldMax — Lead Intake

## When to Use

Hermes invokes this skill the first time WorldMax hears from a prospective customer or partner.

**Triggering events:**
- New submission to the WorldMax contact form (`/contact` on worldmax.com)
- Email to `sales@worldmax.com` from a sender not already in CRM
- Mary forwards an inquiry with "new lead" or "intake this"
- Manual: "log a new lead from <name>"

**Do NOT use this skill when:**
- The contact already exists in CRM → use `partner-communications` (existing partner) or open the existing CRM record
- The inquiry is about an existing order → use `order-tracking`
- The inquiry is about an unpaid invoice from us → use `invoice-followup`

## Inputs

Required (ask if missing):
- `contact_name`
- `company`
- `email` and/or `phone`
- `interest_area` — which WorldMax product line or reseller program
- `source` — where the lead came from (form, referral, trade show, cold inbound, etc.)

Optional:
- `region`
- `estimated_volume`
- `referrer` (person/partner who sent them)
- `notes` — any extra context from the inquiry

## Procedure

1. **Normalize the input.** Pull contact_name, company, email, phone, interest_area, and source from the source message. If the source is a contact-form payload, fields map 1:1; if it's an email, parse from headers and signature.
2. **Dedupe check.** Search CRM by email (primary) and company name (secondary). If a match exists, stop and hand off to `partner-communications` with a note that this person already exists.
3. **Create the CRM lead.** Required fields above. Tag with `source:<source>`, `intake-date:<today>`, and `interest:<area>`. (CRM MCP server TBD — for now, append a row to the `worldmax_leads` sheet or queue the create call.)
4. **Acknowledge the lead.** Send a short reply from `sales@worldmax.com` within 5 minutes:
   - Thanks them by first name
   - Confirms what they asked about
   - Sets expectation: a WorldMax rep will follow up within one business day
   - Signed by Mary (or the assigned AE if known)
5. **Notify sales internally.** Post a summary to `#worldmax-leads` in Slack:
   - Name, company, interest area, source
   - Link to the CRM record
   - Suggested next step (demo, sample, quote, intro call)
   - @-mention the AE who owns this region/product line; if unknown, @mention Mary
6. **Schedule follow-up.** If the lead's interest is concrete (asked for a quote, demo, or sample), create a calendar reminder for the assigned AE for the next business day at 10am CT. If the interest is exploratory, set a 3-business-day reminder instead.
7. **Confirm to Mary.** One-line summary of what was logged, acknowledged, and scheduled.

## Outputs

- New CRM lead record (or queued create)
- Acknowledgment email sent to lead
- Slack post in `#worldmax-leads`
- Calendar reminder for the AE
- Confirmation message to Mary

## Pitfalls

- **Auto-replies and bounces look like new leads.** Filter out senders ending in `noreply@`, `mailer-daemon`, `postmaster`, or with `Auto-Submitted: auto-replied` headers before creating a CRM record.
- **Form spam.** If the message body has > 3 URLs, no real name, or matches known spam patterns, do NOT create a CRM record or send an ack — flag to Mary instead.
- **Existing partners filling the contact form.** Always dedupe first. Creating duplicate CRM records is the most common intake failure.
- **Wrong AE assignment.** Region/product owner mapping lives in `playbooks/worldmax/_config/ae-routing.yaml` (TBD). If routing is ambiguous, default to Mary, do not guess.

## Verification

- CRM shows a new lead record with `intake-date = today` and a Hermes activity entry.
- The lead received an ack within 5 minutes (check sent folder).
- `#worldmax-leads` has a post linking to the CRM record.

## Example Interaction

> **Trigger:** Contact form submission — Sarah Chen at Northwind Distributors, asking about reseller pricing for the WX-200 line, came in from a LinkedIn ad.
>
> **Hermes:**
> 1. Checked CRM — no existing record for sarah.chen@northwind.com or Northwind Distributors.
> 2. Created CRM lead `LEAD-2412`, tagged `source:linkedin-ad`, `interest:wx-200-reseller`.
> 3. Sent ack to Sarah from sales@worldmax.com confirming we'll follow up by tomorrow.
> 4. Posted summary to `#worldmax-leads`, @mentioned Dave (WX-200 reseller AE).
> 5. Created calendar reminder for Dave: "Follow up with Sarah Chen / Northwind" tomorrow 10am CT.
>
> **To Mary:** "New lead logged: Sarah Chen / Northwind Distributors — WX-200 reseller interest from LinkedIn. Dave is on follow-up for tomorrow."

## Customization Notes

- CRM integration is currently a placeholder. When the CRM MCP server is wired up, replace step 3 with the actual create call and step 5's link with the real CRM URL pattern.
- Ack email template lives in `playbooks/worldmax/_templates/lead-ack.md` (create when first instantiating).
- Slack channel name is configurable — default `#worldmax-leads`.
