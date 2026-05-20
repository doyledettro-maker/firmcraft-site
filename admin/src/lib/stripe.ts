import Stripe from 'stripe'

const secret = process.env.STRIPE_SECRET_KEY

export function isStripeConfigured(): boolean {
  return Boolean(secret)
}

let cached: Stripe | null = null

export function getStripe(): Stripe {
  if (!secret) {
    throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY.')
  }
  if (!cached) {
    cached = new Stripe(secret, {
      // Pin a known API version so behavior is stable.
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    })
  }
  return cached
}
