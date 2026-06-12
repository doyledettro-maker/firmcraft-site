/**
 * schema.org JSON-LD builders. The Organization block is rendered once in the
 * root layout; pages add Service / FAQPage / Person blocks on top and
 * reference the org via @id.
 */

const BASE = 'https://firmcraft.ai'
export const ORG_ID = `${BASE}/#organization`

export const ORG_JSONLD = {
  '@context': 'https://schema.org',
  // ProfessionalService subclasses LocalBusiness and Organization.
  '@type': 'ProfessionalService',
  '@id': ORG_ID,
  name: 'Firmcraft',
  url: BASE,
  logo: `${BASE}/opengraph-image`,
  description:
    'Firmcraft is an AI consulting firm for small and mid-sized businesses. AI readiness assessments, fixed-fee AI implementation, ERP integration (Microsoft Business Central, NetSuite, Acumatica), managed AI operations, and Firmcraft Operator — a managed AI employee that works in Slack or Microsoft Teams.',
  slogan: 'Sovereign by default',
  telephone: '+1-217-303-8319',
  email: 'hello@firmcraft.ai',
  priceRange: '$399/mo – $60,000+',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Springfield',
    addressRegion: 'IL',
    addressCountry: 'US',
  },
  areaServed: [
    {
      '@type': 'City',
      name: 'Springfield',
      containedInPlace: { '@type': 'State', name: 'Illinois' },
    },
    {
      '@type': 'City',
      name: 'Houston',
      containedInPlace: { '@type': 'State', name: 'Texas' },
    },
    { '@type': 'Country', name: 'United States' },
  ],
  knowsAbout: [
    'AI consulting for small business',
    'AI implementation',
    'managed AI services',
    'AI agents',
    'ERP integration',
    'Microsoft Dynamics 365 Business Central',
    'NetSuite',
    'AI receptionist',
    'workflow automation',
  ],
  sameAs: [
    'https://www.linkedin.com/company/firmcraft-ai/',
    // Add as created: Clutch profile, Google Business Profile, Crunchbase, Wikidata.
  ],
}

export function serviceJsonLd(opts: {
  name: string
  description: string
  url: string
  serviceType: string
  areaServed?: string
  offers?: { price: string; priceCurrency?: string; description?: string }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    url: `${BASE}${opts.url}`,
    serviceType: opts.serviceType,
    provider: { '@id': ORG_ID },
    areaServed: opts.areaServed ?? 'United States',
    ...(opts.offers
      ? {
          offers: opts.offers.map((o) => ({
            '@type': 'Offer',
            price: o.price,
            priceCurrency: o.priceCurrency ?? 'USD',
            ...(o.description ? { description: o.description } : {}),
          })),
        }
      : {}),
  }
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }
}
