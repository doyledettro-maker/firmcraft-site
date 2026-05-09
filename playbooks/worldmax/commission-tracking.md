---
name: worldmax-commission-tracking
description: Calculate sales commissions per deal and per partner, generate weekly/monthly commission reports, track and resolve disputes, and reconcile against payment records. Trigger on commission cycles, dispute inquiries, or report requests.
version: 0.1.0
metadata:
  hermes:
    tags: [worldmax, commissions, finance]
    category: finance
    requires_toolsets: [erp, accounting, email]
---

# WorldMax — Commission Tracking

## When to Use

**Triggering events:**
- Mary asks for "this week's commissions" or "monthly commission report"
- Scheduled: every Monday 7am CT (weekly partner-facing summary), 1st business day of the month (monthly close)
- Partner emails asking "what's my commission on order X" or disputing a calculated amount
- New payment posted in accounting that needs reconciling against commission ledger

**Do NOT use this skill when:**
- The question is about the order itself (status, delivery) → `order-tracking`
- The question is about an unpaid customer invoice → `invoice-followup`
- The question is about pricing or terms going forward → `partner-communications`

## Inputs

- `period` — date range for reports (default: prior calendar week or month)
- `partner_id` — for partner-specific calculations or disputes
- `order_id` — for single-deal lookups
- `dispute_details` — partner's claim, with their numbers

## Procedure

### Subflow A — Per-deal commission calculation

1. Pull the order from ERP: invoice total, line items, partner of record, close date, any discounts.
2. Look up the commission rate that applies:
   - Partner tier (Platinum / Gold / Silver / Standard)
   - Product line override (some lines have non-standard rates)
   - Promotional period overrides (e.g., Q1 push promotion)
3. Apply the rate to the **commissionable base** — net of returns, discounts, and shipping. Do NOT commission on shipping or tax.
4. Note any clawback conditions (return window, payment received, etc.).
5. Return the calculation with the rate, the base, the commission amount, and the rule references used.

### Subflow B — Weekly partner summary (Monday 7am CT)

1. Pull all orders that closed and were invoiced in the prior week.
2. Calculate commissions per the per-deal procedure.
3. Group by partner; produce one summary per active partner showing:
   - Orders closed (count + $)
   - Commissions earned (gross)
   - Pending (orders closed but invoice not yet paid → not payable yet)
   - Payable now (invoiced + paid + past clawback window)
4. Stage the summaries; send only after Mary's approval. Do not auto-send partner-facing financial numbers.

### Subflow C — Monthly close report (1st business day of month)

1. Run the per-deal calc across the closed month.
2. Produce an internal report:
   - Total commissions accrued (by partner, by product line)
   - Total commissions paid in the month
   - Outstanding commission liability at month end
   - Variance vs. prior month (call out anything ±15%)
   - Disputes opened/resolved/outstanding
3. Reconcile against accounting: `accrued + opening balance − paid = closing balance`. Flag any mismatch.
4. Hand to Mary; she shares with the bookkeeper.

### Subflow D — Dispute handling

1. Acknowledge the dispute within one business day. Do NOT confirm or deny the partner's number yet.
2. Re-run the calculation from scratch using current ERP and rate-card data.
3. Compare:
   - **Match** — explain our calculation step-by-step in the reply, attach the rule references; if the partner is still disputing after that, escalate to Mary.
   - **We were low** — confirm the corrected amount, queue an adjustment, send to Mary for approval before responding.
   - **Partner is reading the rate wrong** — show the rate-card excerpt that applies, walk through their order with their tier and the right rate.
4. Log the dispute, the resolution, and the time-to-resolve in the disputes ledger.

### Subflow E — Payment reconciliation

When a commission payment posts in accounting:
1. Match the payment to one or more commission entries in the ledger.
2. Mark those entries `paid` with the payment reference.
3. If the payment doesn't match any open entry, flag to Mary — do NOT silently absorb mystery payments.

## Outputs

- Per-deal calculation results
- Weekly partner summaries (drafts → sent after approval)
- Monthly close report
- Dispute responses + dispute ledger entries
- Updated commission ledger with paid status

## Pitfalls

- **Commissionable base, not gross.** The single most common error. Strip shipping, tax, returns, and discounts before applying the rate.
- **Tier changes mid-period.** A partner's tier is determined by the rule in effect on the order's close date, not today's tier. Always check the historical tier.
- **Clawback windows.** Don't mark "payable" until the return window has closed AND the customer invoice is paid. Premature payouts cause clawback chase later.
- **Currency.** If WorldMax operates in multiple currencies, lock the FX rate at order close, not at payout. Show the FX rate used.
- **Rounding.** Round at the line-item level then sum, or sum then round? Pick one (recommended: per-line at 2 decimal places, then sum) and apply consistently. Inconsistent rounding generates fake disputes.
- **Never share one partner's commission with another partner.** Even aggregates can be sensitive.

## Verification

- Spot-check 3 random calculations against a manual calc each week.
- Monthly reconciliation balances (accrued + opening − paid = closing).
- Dispute ledger: time-to-resolve is trending the right way.

## Example Interaction

> **Trigger:** Email from Dave at AppliedReseller: "I'm showing $312 commission on PO-7621 but you sent over $278. What's up?"
>
> **Hermes:**
> 1. Acknowledged within 30 minutes — "Got it Dave, let me re-run that one and come back to you today."
> 2. Pulled PO-7621: invoice total $5,200; shipping $180; one return line $620 (refunded).
> 3. Commissionable base = 5,200 − 180 − 620 = $4,400. AppliedReseller tier = Gold = 6.5%. Commission = $286.
> 4. Difference vs. our $278 is $8 — we missed the rate update from 6.3% → 6.5% effective Mar 1 on this order (closed Mar 4).
> 5. Difference vs. Dave's $312: he's calculating against the gross $5,200 × 6% — wrong base AND wrong rate.
> 6. Adjustment of $8 queued; full explanation drafted to Dave.
>
> **To Mary:** "Dispute on PO-7621. Our $278 should have been $286 (rate-card update missed). Dave's $312 is wrong on both base and rate. $8 adjustment ready, reply drafted explaining both legs. Approve?"

## Customization Notes

- Rate card lives in `playbooks/worldmax/_config/commission-rates.yaml` (TBD), with effective-date ranges.
- Clawback windows configurable per partner agreement.
- Reconciliation hooks into the accounting MCP server (TBD).
