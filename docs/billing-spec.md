# Firmcraft Billing Model

## Subscription Tiers (monthly, billed in advance)

| Tier | Monthly | Setup Fee | Included AI Usage |
|------|---------|-----------|-------------------|
| Spark | $399/mo | $1,000 | $100 at cost |
| Flow | $799/mo | $2,000 | $200 at cost |
| Forge | $1,499/mo | $3,500 | $300 at cost |

## AI Usage Billing

- **Included allowance**: Tracked at actual provider cost (Anthropic, OpenAI, etc.). No markup. When a client burns through their dollar allowance in raw model cost, it's used up.
- **Overages**: Billed at 1.2x actual provider cost (20% service fee). Added to next month's invoice (monthly in arrears).
- **Rate card**: Published on client dashboard showing per-model token costs at provider rates. Overages noted as carrying a 20% service fee.

### Example Rate Card (at provider cost, overages at 1.2x)

| Model | Input/1M tokens (included) | Output/1M tokens (included) | Input/1M (overage) | Output/1M (overage) |
|-------|---------------------------|----------------------------|--------------------|--------------------|
| Claude Haiku 4.5 | $1.00 | $5.00 | $1.20 | $6.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 | $3.60 | $18.00 |
| Claude Opus 4.6 | $15.00 | $75.00 | $18.00 | $90.00 |

(Verify exact Anthropic pricing when implementing)

## Usage Alerts

| Usage Level | Action |
|------------|--------|
| 70% of included allowance | Friendly notice |
| 90% | Warning notice |
| 100% | Overage begins, notify client |
| 125% | Notify again |
| Client-defined cap | Pause agent or downgrade to cheaper model |

## Billing Flow

1. Month start: Client pays subscription (Spark/Flow/Forge) in advance
2. During month: LiteLLM tracks per-model token usage per client API key
3. Month end: Calculate total usage at provider cost. If over included allowance, compute overage at 1.2x
4. Next invoice: Subscription renewal + overage line item from prior month

## Discounts

- Manual discounts via Stripe Coupons (e.g., "WorldMax Early Partner - 50% off subscription")
- Can discount subscription, setup fee, or both independently
- Token usage is always at actual cost — no discount on provider costs

## Stripe Products & Prices (LIVE, account `acct_1TCWscLXdXYXWihB`)

Created 2026-05-10. All objects are in live mode.

### Subscription tiers (recurring monthly, `usage_type=licensed`)

| Tier | Product ID | Price ID | Amount |
|------|-----------|----------|--------|
| Spark | `prod_UUYyPYzuLZHr0u` | `price_1TVZr1LXdXYXWihBG8dPgMkT` | $399.00/mo |
| Flow  | `prod_UUYy7gXpO1uLOu` | `price_1TVZr1LXdXYXWihB5zfjEcra` | $799.00/mo |
| Forge | `prod_UUYy6lyWYf9uNx` | `price_1TVZr1LXdXYXWihBm3V6HCiE` | $1,499.00/mo |

### Setup fees (one-time, all under product `prod_UUYzGwa6Y5CVec` "Firmcraft Setup Fee")

| Tier | Price ID | Amount |
|------|----------|--------|
| Spark | `price_1TVZrLLXdXYXWihBK3CzhA0a` | $1,000 |
| Flow  | `price_1TVZrMLXdXYXWihBXTHmr7q6` | $2,000 |
| Forge | `price_1TVZrMLXdXYXWihBIzoqueeY` | $3,500 |

### AI usage overage (metered, monthly in arrears)

- **Product**: `prod_UUYz378qtzhFwI` "Firmcraft AI Usage Overage"
- **Price**: `price_1TVZsJLXdXYXWihBAH3MS36R` — `$0.01` per reported unit (`usage_type=metered`, `aggregate=sum`, `interval=month`)
- **Billing Meter**: `mtr_61UexpVZFVM09DFUa41LXdXYXWihBNnk`
- **Meter event name**: `firmcraft_ai_overage_cents`
- **Reporting unit**: integer USD-cents of overage cost, *already inclusive of the 1.2x service multiplier*. The aggregator must (a) compute provider-cost overage in USD, (b) multiply by 1.2, (c) convert to cents, (d) round to integer, (e) post one meter event per period with `value=<cents>` and `stripe_customer_id=<cus_…>`.

### Reporting overage usage

```
POST https://api.stripe.com/v1/billing/meter_events
  event_name=firmcraft_ai_overage_cents
  payload[stripe_customer_id]=cus_XXXX
  payload[value]=<integer cents at 1.2x>
  identifier=<idempotency-string>   # optional but recommended
```

Stripe attaches the resulting charges to whichever active subscription on the customer carries `price_1TVZsJLXdXYXWihBAH3MS36R`. To bill a customer for overage, include that price as a line item on their subscription (alongside their tier subscription price).

## Infrastructure

- LiteLLM proxy handles model routing and usage tracking per API key
- Langfuse for detailed observability and per-request logging
- Daily usage aggregation service polls LiteLLM, updates client balances
- Client dashboard shows real-time usage, remaining allowance, projected cost
- Admin dashboard shows all clients, margins, usage patterns
