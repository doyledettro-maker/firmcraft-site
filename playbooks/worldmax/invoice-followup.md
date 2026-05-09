---
name: worldmax-invoice-followup
description: Manage WorldMax accounts receivable — track outstanding invoices, send escalating-tone payment reminders, flag overdue accounts, and generate aging reports. Trigger on schedule and when AR-related questions come in.
version: 0.1.0
metadata:
  hermes:
    tags: [worldmax, ar, finance]
    category: finance
    requires_toolsets: [accounting, email, slack]
---

# WorldMax — Invoice Follow-Up (AR)

## When to Use

**Triggering events:**
- Scheduled: every Tuesday and Friday 8am CT — sweep open invoices, send reminders due that day
- Scheduled: 1st business day of the month — full aging report
- Mary asks "what's outstanding" / "aging report" / "send reminders"
- Inbound question from a customer about an invoice we sent

**Do NOT use this skill when:**
- The customer is asking about an order's delivery → `order-tracking`
- The question is about commissions WE owe THEM → `commission-tracking`
- The lead/contact has never received an invoice → wrong skill entirely

## Inputs

- `as_of_date` — default today
- `customer_id` — for single-customer aging
- `invoice_id` — for single-invoice operations

## Procedure

### Tone ladder

Reminder tone escalates with days past due. Use the matching template each time:

| Bucket | Days past due | Tone | Template |
|--------|---------------|------|----------|
| Pre-due | −3 to 0 | Heads-up, friendly | `ar-predue` |
| Gentle | 1–14 | Polite reminder, assume oversight | `ar-gentle` |
| Firm | 15–30 | Direct, ask for ETA, offer to discuss | `ar-firm` |
| Escalation | 31–60 | Mary cc'd, references payment terms, requests immediate action | `ar-escalate` |
| Hold | 61+ | Account on credit hold, no new orders ship until current; legal/collections discussion needed | `ar-hold` |

Never skip a step. If an invoice has had no prior reminder and is already at day 35, send the Firm reminder, wait 5 business days, then Escalation — don't jump straight to Escalation just because the calendar says so.

### Subflow A — Scheduled reminder sweep (Tue/Fri 8am CT)

1. Pull all open invoices from accounting with their current age.
2. For each, determine the next reminder due using the ladder + the last-reminder timestamp on the invoice.
3. Group reminders by customer — never send a customer multiple invoice reminders in the same email; combine into one note covering all open invoices for that customer.
4. Render drafts.
5. **Auto-send threshold:** Pre-due and Gentle reminders auto-send. Firm and beyond require Mary's review before sending.
6. Stamp the invoice with `last_reminder_sent_at` and `last_reminder_tier`.

### Subflow B — Monthly aging report (1st business day)

1. Pull all open invoices as of EOM yesterday.
2. Bucket: Current (0–30), 31–60, 61–90, 90+.
3. By customer:
   - Total outstanding
   - Largest single invoice
   - Days since oldest invoice
   - Last payment received
4. Identify:
   - **Top 5 by exposure** — biggest balances regardless of age
   - **Risk list** — anything in 60+ or any customer with > 50% of balance in 31+
   - **New since last month** — first-time delinquencies
5. Hand to Mary; she shares with the bookkeeper after review.

### Subflow C — Inbound AR question

1. Identify the customer and invoice(s) from the message.
2. Look up:
   - Invoice status (open, partial, paid)
   - Payment instructions originally provided
   - Any payments posted since the invoice (in case of a misapplied payment)
   - Any disputes or adjustments on file
3. Reply at the right level — confirm the amount, the due date, the way to pay; offer to send a copy of the invoice if they need it; offer to discuss if they're flagging a problem.
4. If they're disputing the amount or saying they already paid, do NOT confirm or deny — pull payment records, escalate to Mary if anything's ambiguous.

### Subflow D — New overdue flag

When an invoice rolls into the 31+ bucket for the first time:
1. Post to `#worldmax-finance`: customer, invoice, amount, days past due.
2. Add to the credit-watch list.
3. Notify Mary — at this point, she may want to put a soft hold on new orders for that customer until paid.

## Outputs

- Reminder emails (auto-sent at lower tiers; drafts for review at higher tiers)
- Updated invoice metadata (last reminder timestamp + tier)
- Monthly aging report
- Slack notifications for new overdue flags
- Replies to AR inquiries

## Pitfalls

- **Misapplied payments make innocent customers look delinquent.** Always check for recent payments before sending any reminder. Apologize fast and loud if we got it wrong.
- **Don't send Friday-evening reminders.** Send Pre-due and Gentle in the morning; nothing AR-related goes out after 3pm CT or before 8am CT in the customer's timezone if known.
- **Combine per customer.** A customer with 4 open invoices should get ONE email referencing all 4, not four separate notes.
- **Holiday awareness.** Don't send reminders on customer-facing federal holidays. Push to the next business day.
- **Disputed invoices.** If an invoice is flagged "in dispute," it does NOT get reminders — it gets resolution. Keep a separate disputes track.
- **Tone discipline.** The Firm template is direct, not cold. The Escalate template is serious, not threatening. Never sarcastic, never passive-aggressive. These messages are read by accounts payable clerks who often had nothing to do with the delay.

## Verification

- For each sent reminder: invoice metadata updated, sent email logged in CRM under the customer.
- Monthly aging totals reconcile to the AR balance in accounting.
- No customer received duplicate reminders within a 7-day window.

## Example Interaction

> **Trigger:** Tuesday 8am sweep finds INV-4012 (BlueRiver Industries) at 18 days past due, no prior reminder sent because they were new.
>
> **Hermes:**
> 1. Checked for recent payments — none posted.
> 2. Confirmed BlueRiver has no other open invoices, so this is a single-invoice reminder.
> 3. Day 18 → Firm tier. But no prior reminder was sent, so I should NOT jump to Firm cold — first send Gentle, then Firm if no response in 5 business days.
> 4. Drafted Gentle reminder using `ar-gentle` template, personalized with BlueRiver's contact (Lee Park) and INV-4012 details ($3,200, original due Apr 28).
> 5. Auto-sent (Gentle is below the review threshold). Stamped invoice `last_reminder_sent_at: 2026-05-12 08:01 CT`, `last_reminder_tier: gentle`.
>
> **In the brief to Mary:** "INV-4012 BlueRiver $3,200 hit 18 days late with no prior reminder — sent Gentle this morning since we shouldn't skip the ladder. Will escalate to Firm next Tuesday if no payment."

## Customization Notes

- Templates live in `playbooks/worldmax/_templates/ar/` (create when first instantiating).
- Auto-send tier thresholds are configurable — Mary may want to start with everything in review-first mode for the first 2 weeks.
- Credit-hold thresholds and customer-specific terms live in the customer record in accounting.
