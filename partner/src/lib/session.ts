import { cookies } from 'next/headers'
import { getPartnerBySlug, type Partner } from './mock-partners'
import { SESSION_COOKIE } from './session-constants'

export { SESSION_COOKIE }

/**
 * Mock partner credentials. Partners log in with a slug + access token.
 *
 * In production this is replaced by a real auth provider (probably Cognito
 * with a separate user pool from the admin app, or magic-link via Resend).
 * The important property is that the partner-portal session has its own
 * cookie name and signing key, so admin and partner cannot impersonate
 * each other even if they share a parent domain.
 */
export const PARTNER_CREDENTIALS: Record<string, string> = {
  'north-ridge': 'demo-northridge',
  lattice: 'demo-lattice',
  silvercreek: 'demo-silvercreek',
}

export function authenticate(slug: string, token: string): Partner | null {
  const expected = PARTNER_CREDENTIALS[slug]
  if (!expected || expected !== token) return null
  return getPartnerBySlug(slug) ?? null
}

/** Read the current partner from the session cookie, or null if not signed in. */
export function getSessionPartner(): Partner | null {
  const slug = cookies().get(SESSION_COOKIE)?.value
  if (!slug) return null
  return getPartnerBySlug(slug) ?? null
}
