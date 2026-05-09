---
name: worldmax-order-tracking
description: Look up order status across WorldMax fulfillment systems, send proactive delay notifications, generate shipping/tracking updates for customers, and escalate stuck orders. Trigger when anyone asks "where is order X" or when an order crosses a delay threshold.
version: 0.1.0
metadata:
  hermes:
    tags: [worldmax, orders, fulfillment]
    category: operations
    requires_toolsets: [erp, email, slack]
---

# WorldMax — Order Tracking

## When to Use

**Triggering events:**
- Customer or partner emails asking about an order ("status of PO-####", "where is my shipment")
- Mary asks "what's the status of <order>" or "what's stuck right now"
- Scheduled sweep: every weekday at 9am and 3pm CT — scan for orders past expected ship date
- Order in the ERP transitions to a status of `delayed`, `backorder`, or `exception`

**Do NOT use this skill when:**
- The question is about a quote that hasn't become an order yet → `lead-intake` or `partner-communications`
- The question is about an unpaid invoice → `invoice-followup`
- The question is about commission for a closed order → `commission-tracking`

## Inputs

- `order_id` (PO number or WorldMax order ID) — required for single-order lookups
- For sweeps: no input — pulls from ERP

## Procedure

### Subflow A — Single-order lookup (reactive)

1. **Find the order.** Search the ERP by order_id. If multiple matches (rare — happens with cross-references), confirm which one.
2. **Pull the full picture:**
   - Order date, requested ship date, expected delivery
   - Line items + quantities
   - Current fulfillment status (received, picking, packed, shipped, delivered)
   - Shipping carrier + tracking number if shipped
   - Any holds (credit, inventory, address verification)
3. **Check for cross-system divergence.** If shipped, hit the carrier API for the latest tracking event — the ERP's "shipped" status can lag the actual delivery.
4. **Compose the answer at the right level of detail:**
   - Customer-facing: friendly, no internal jargon, includes tracking link if available
   - Internal (Mary or Slack): include any flags, holds, or risks
5. Send/post the answer.

### Subflow B — Scheduled delay sweep

1. Query the ERP for open orders where `expected_ship_date < today` and `status NOT IN (shipped, delivered, cancelled)`.
2. For each, classify:
   - **Hot** — past expected ship by 3+ business days OR customer has already inquired OR high-value
   - **Warm** — past expected ship by 1–2 business days
   - **Cold** — known backorder with future ETA already communicated
3. For Hot orders, draft a proactive notification to the customer:
   - Acknowledge the delay
   - State the new expected ship date (pull from ERP if updated; otherwise mark TBD and escalate)
   - Offer a contact for questions
   - Do NOT send without Mary's review on first instance per customer; subsequent updates on the same order can auto-send if Mary approved the first
4. For Warm orders, post a digest to `#worldmax-fulfillment` so the team is aware.
5. For Cold orders, no action — already tracked.

### Subflow C — Stuck order escalation

An order is "stuck" if:
- No ERP status change in 5+ business days while in `picking`, `packed`, or `pending shipment`, OR
- Carrier tracking shows no movement for 4+ business days after pickup, OR
- An ERP `exception` flag has been open > 24 hours

For each stuck order:
1. Pull the activity log to find when it last moved.
2. Identify the responsible owner (warehouse, carrier, credit, customer).
3. Post to `#worldmax-fulfillment` with the order, the stall point, and the suggested owner.
4. @mention Mary if the order is over $5k or the customer has already inquired.

## Outputs

- Status replies to customers/partners (logged to CRM)
- Internal Slack posts in `#worldmax-fulfillment`
- Proactive delay notifications
- Stuck-order escalations to Mary

## Pitfalls

- **ERP "shipped" ≠ actually moving.** Always cross-check the carrier when the ship was supposedly more than 24h ago and the customer is asking.
- **Tracking links rot.** Build the URL from the carrier + tracking number, don't cache old tracking URLs that may have expired.
- **Backorder ETAs change silently.** If you're quoting a date, pull it live; do not reuse a date from an earlier conversation.
- **Don't expose internal warehouse-bin or pick-list details to customers.** "In our fulfillment center, ready to ship" is the right level of detail externally.
- **Time zones.** All dates internal-facing are CT. Customer-facing dates should be in the customer's stated timezone if known, else CT with the timezone label.

## Verification

- Reply was sent and logged in CRM under the order/customer.
- For sweeps: a digest was posted (or "nothing to report" if clean — silence is ambiguous).
- For escalations: Mary acknowledged or the issue moved.

## Example Interaction

> **Trigger:** Email from Sam at MidStates: "Hey, any update on PO-7841? We were expecting it Tuesday."
>
> **Hermes:**
> 1. Looked up PO-7841 in ERP — status `packed`, expected ship Mon, no shipment confirmation yet (today is Wed).
> 2. Checked the activity log — last update was Mon at 4:30pm. No recent movement. This is now stuck.
> 3. Pulled the customer's order: 24× WX-200, $4,800 total.
> 4. Drafted reply to Sam: confirming we see his order, it's packed, we're checking with the warehouse on a ship date and will follow up by EOD.
> 5. Posted to `#worldmax-fulfillment`: "PO-7841 stuck in packed since Mon — Sam at MidStates inquiring. Need warehouse update by EOD." @mentioned the warehouse lead.
>
> **To Mary:** "PO-7841 (MidStates, $4.8k) is stuck in packed. Holding reply went to Sam, warehouse pinged. Will update once we have a ship date."

## Customization Notes

- ERP integration is currently a placeholder. Wire up the real ERP MCP/API in step 1 of each subflow.
- Carrier list and API mapping live in `playbooks/worldmax/_config/carriers.yaml` (TBD).
- Delay thresholds (Hot/Warm/Cold day counts, $-amount escalation trigger) are configurable per Mary's preference.
