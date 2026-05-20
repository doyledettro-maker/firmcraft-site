/**
 * Stripe webhook handler — keeps Supabase `clients` and `invoices` in sync with
 * Stripe state. Verifies signatures with STRIPE_WEBHOOK_SECRET. Returns 200 on
 * success so Stripe doesn't retry; returns 400 for signature/parse failures.
 *
 * Subscribed events (configured at endpoint registration):
 *   customer.subscription.created / .updated / .deleted
 *   invoice.paid / .payment_failed / .finalized / .voided
 *   payment_method.attached
 */
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export const runtime = 'nodejs'
// Stripe webhooks need the raw body for signature verification, so the route
// must not be statically optimized.
export const dynamic = 'force-dynamic'

const SUB_STATUS_TO_CLIENT_STATUS: Record<
  Stripe.Subscription.Status,
  'active' | 'onboarding' | 'suspended'
> = {
  active: 'active',
  trialing: 'active',
  incomplete: 'onboarding',
  incomplete_expired: 'onboarding',
  past_due: 'onboarding',
  unpaid: 'onboarding',
  paused: 'suspended',
  canceled: 'suspended',
}

const ALLOWED_INVOICE_STATUS = new Set([
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible',
])

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) {
    return NextResponse.json(
      { error: 'Missing signature header or webhook secret' },
      { status: 400 },
    )
  }

  const rawBody = await req.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    await handleEvent(event)
  } catch (err) {
    // Log + still 200 so Stripe doesn't endlessly retry — we'll see it in logs
    // and can replay manually. (For first-iteration simplicity. Move to 500
    // once we've got an alerting story.)
    console.error('[stripe-webhook] handler failed', {
      eventId: event.id,
      type: event.type,
      error: err instanceof Error ? err.message : err,
    })
  }

  return NextResponse.json({ received: true, type: event.type })
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await syncSubscription(event.data.object as Stripe.Subscription)
      break
    }
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'invoice.finalized':
    case 'invoice.voided': {
      await upsertInvoice(event.data.object as Stripe.Invoice)
      break
    }
    case 'payment_method.attached': {
      // Informational only — log to console for now.
      const pm = event.data.object as Stripe.PaymentMethod
      console.log('[stripe-webhook] payment_method.attached', {
        customer: pm.customer,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
      })
      break
    }
    default:
      // Not subscribed to this event type — ignore.
      break
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const db = getSupabaseAdmin()
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  const item = sub.items.data[0]
  const unitAmount = item?.price?.unit_amount ?? 0
  const monthlyPrice = unitAmount / 100

  const clientStatus = SUB_STATUS_TO_CLIENT_STATUS[sub.status] ?? 'onboarding'

  const update: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    status: clientStatus,
  }
  // Only overwrite price when the sub is in a billable state — otherwise we'd
  // wipe out an admin-set custom price during an `incomplete` window.
  if (sub.status === 'active' || sub.status === 'trialing') {
    update.monthly_price = monthlyPrice
  }

  const { error } = await db
    .from('clients')
    .update(update)
    .eq('stripe_customer_id', customerId)

  if (error) throw new Error(`syncSubscription update failed: ${error.message}`)
}

async function upsertInvoice(inv: Stripe.Invoice) {
  const db = getSupabaseAdmin()
  const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id
  if (!customerId) return

  // Resolve client_id from customer_id.
  const { data: client, error: lookupErr } = await db
    .from('clients')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .is('deleted_at', null)
    .maybeSingle()

  if (lookupErr) throw new Error(`upsertInvoice client lookup failed: ${lookupErr.message}`)
  if (!client) {
    // Customer exists in Stripe but not yet in our DB. Skip silently — admins
    // will seed the client row through onboarding.
    return
  }

  const status = ALLOWED_INVOICE_STATUS.has(inv.status ?? '') ? inv.status : 'open'
  const paidAt = inv.status_transitions?.paid_at
    ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
    : null

  const row = {
    client_id: client.id,
    stripe_invoice_id: inv.id,
    amount: (inv.amount_due ?? 0) / 100,
    status,
    period_start: inv.period_start
      ? new Date(inv.period_start * 1000).toISOString().slice(0, 10)
      : null,
    period_end: inv.period_end
      ? new Date(inv.period_end * 1000).toISOString().slice(0, 10)
      : null,
    paid_at: paidAt,
  }

  const { error } = await db
    .from('invoices')
    .upsert(row, { onConflict: 'stripe_invoice_id' })

  if (error) throw new Error(`upsertInvoice upsert failed: ${error.message}`)
}

// Health probe — Stripe pings GET when configuring; respond 200 so the endpoint
// shows as reachable in the dashboard.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'stripe-webhook' })
}
