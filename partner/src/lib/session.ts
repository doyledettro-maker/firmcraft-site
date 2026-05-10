import { auth, currentUser } from '@clerk/nextjs/server'
import { getPartnerBySlug, mockPartners, type Partner } from './mock-partners'

/**
 * Map a Clerk user to a Firmcraft partner record.
 *
 * Production wiring: each Clerk user has `publicMetadata.partnerSlug` set to
 * the slug of the partner they represent (set via Clerk dashboard or the
 * admin app once that lands).
 *
 * Demo fallback: if no slug is on the user, look up by email against the
 * mock partner contact emails; if still no match, fall back to the first
 * mock partner so the demo book of business renders.
 */
export async function getSessionPartner(): Promise<Partner | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user) return null

  const metaSlug = (user.publicMetadata?.partnerSlug as string | undefined) ?? undefined
  if (metaSlug) {
    const p = getPartnerBySlug(metaSlug)
    if (p) return p
  }

  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase()
  if (email) {
    const match = mockPartners.find((p) => p.contactEmail.toLowerCase() === email)
    if (match) return match
  }

  return mockPartners[0] ?? null
}
