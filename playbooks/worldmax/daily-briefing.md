---
name: worldmax-daily-briefing
description: Generate Mary's morning briefing for WorldMax — overnight leads, open-order status, partner activity, calendar prep, and yesterday's open action items. Runs every business day at 7:00 AM CT and on demand.
version: 0.1.0
metadata:
  hermes:
    tags: [worldmax, briefing, mary]
    category: executive-support
    requires_toolsets: [crm, erp, calendar, email, slack]
---

# WorldMax — Daily Briefing for Mary

## When to Use

**Triggering events:**
- Scheduled: weekdays at 7:00 AM CT
- Mary types "morning brief" / "what's the day look like" / "brief me"

**Do NOT use this skill when:**
- Mary asks about a specific item — go to the relevant skill (lead-intake, order-tracking, etc.) and answer narrowly. Don't dump the whole briefing.
- It's a weekend or holiday unless Mary explicitly asks.

## Inputs

None — pulls from CRM, ERP, calendar, and yesterday's action item ledger.

## Procedure

1. **Header.** Date, day of week, weather one-liner if available, and a one-sentence "shape of the day" (e.g., "Light meeting day, 2 partner check-ins, monthly close kicks off.").

2. **Overnight leads (since yesterday's brief).** From `lead-intake`:
   - Count + 1-line summary per lead
   - Highlight any high-value or strategic-fit leads
   - Note any that auto-replied or got stuck (no ack sent)

3. **Open orders status.** From `order-tracking`:
   - Total open orders + total $ in flight
   - Stuck orders with owner and stall point
   - Anything shipping today
   - Hot delays needing customer comms today

4. **Partner activity highlights.** From `partner-communications` and CRM activity log:
   - Inbound from any partner overnight
   - Any commitments / deadlines coming due this week (from the commitments tracker)
   - Notable partner wins or concerns

5. **Calendar prep.** For each meeting today:
   - Time, attendees, topic
   - Relevant context: last interaction, open items, recent orders/commissions if it's a partner
   - Suggested 1-line agenda if there isn't one
   - Flag double-bookings or missing agendas

6. **Action items from yesterday.** From the action-item ledger:
   - Items still open from yesterday with owner
   - Anything that slipped past its due date
   - Quick win suggestions (items that can close in <10 min today)

7. **One-thing-to-watch.** A single most-important callout — the thing Mary should not let the day end without addressing.

8. **Format.** Plain text or markdown, optimized for skim — Mary reads this on her phone over coffee. Bold the section headers, use bullets, no walls of prose. Total length target: under one screen on a phone.

9. **Delivery.** Send via email to Mary at 7:00 AM CT and post a condensed version to her DM in Slack.

## Outputs

- Email to Mary (full briefing)
- Slack DM (condensed version, top 3 things)
- Any updates to the action-item ledger as items resolve through the day

## Pitfalls

- **Don't pad.** A short, accurate brief is far more valuable than a comprehensive one. If a section has nothing meaningful, write "Nothing notable" — don't manufacture filler.
- **Don't surface the same item every day forever.** Items that have lingered in the brief for 3+ days are signaling a process problem, not a daily task — call that out as a pattern, don't just re-list.
- **Privacy.** Mary's calendar may include personal entries. Do not surface non-WorldMax personal events in the briefing.
- **Stale data.** All numbers should pull live at brief generation time; never reuse yesterday's snapshot.
- **Time zones.** All times in the brief are CT unless explicitly labeled.

## Verification

- Email sent before 7:05 AM CT on weekdays.
- Slack DM posted with the same generation timestamp.
- Yesterday's "one thing to watch" was either resolved or appears in today's brief with an explanation.

## Example Output

> **Friday, May 16 — light meeting day, monthly close starts**
>
> **Overnight leads (2)**
> - Sarah Chen / Northwind Distributors — WX-200 reseller, LinkedIn ad. Dave on follow-up at 10am.
> - Mike Reynolds / unknown company — vague form submission, may be spam. Held for your review.
>
> **Orders**
> - 47 open / $186k in flight
> - **Stuck:** PO-7841 (MidStates, $4.8k) packed since Mon, warehouse pinged
> - Shipping today: 6 orders / $22k
> - Hot delay: PO-7903 (AppliedReseller) needs a customer note — draft ready
>
> **Partners**
> - Jen at MidStates asked about Q2 pricing, reply drafted
> - **Due this week:** Q2 co-marketing commitment from Pinnacle (due Wed)
>
> **Calendar**
> - 9:30 — 1:1 with Dave (no agenda; suggest: WX-200 pipeline + LinkedIn lead)
> - 11:00 — Pinnacle quarterly review (last touch: Apr 28; YTD volume +18%)
> - 2:00 — Bookkeeper / monthly close kickoff
>
> **Open from yesterday**
> - PO-7841 stall (rolled forward — 2nd day)
> - Sign Q2 price sheet revision (your sig, 30 sec)
>
> **One thing to watch:** PO-7841 has been in the brief two days. If warehouse can't move it today, escalate to Tom directly.

## Customization Notes

- Send time is configurable per Mary's preference.
- Section ordering and what counts as "highlight" vs. "noise" should be tuned over the first 2 weeks based on Mary's feedback.
- The Slack condensed version is currently top-3-by-impact; could become top-N once we see what Mary actually opens.
