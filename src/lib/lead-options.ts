/**
 * Options for the optional self-reported fields on the contact form.
 * Kept separate from leads.ts so the client form can import them without
 * pulling in server-only dependencies.
 */
export const REFERRAL_OPTIONS = [
  'An AI assistant such as ChatGPT or Claude',
  'A search engine',
  'A recommendation from someone',
  'LinkedIn',
  'An event',
  'Other',
] as const

export const ON_BEHALF_OPTIONS = ['My own organization', 'A client of my firm'] as const
