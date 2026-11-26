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
    'Firmcraft advises business owners and executive teams on artificial intelligence and technology strategy, implements what the strategy requires, and manages it on an ongoing basis.',
  telephone: '+1-217-303-8319',
  email: 'hello@firmcraft.ai',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Springfield',
    addressRegion: 'IL',
    addressCountry: 'US',
  },
  areaServed: 'Worldwide',
  knowsAbout: [
    'AI advisory',
    'managed AI services',
    'AI infrastructure',
    'ERP integration',
    'ERP implementation',
    'workflow automation',
    'AI implementation for consulting firms',
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
    areaServed: opts.areaServed ?? 'Worldwide',
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

export const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${BASE}/about#doyle-dettro`,
  name: 'Doyle Dettro',
  url: `${BASE}/about`,
  image: `${BASE}/founder/doyle.jpg`,
  jobTitle: 'Founder and Principal, Firmcraft',
  worksFor: { '@id': ORG_ID },
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of Illinois' },
  hasOccupation: [
    { '@type': 'Occupation', name: 'Founder and Principal, Firmcraft' },
    { '@type': 'Occupation', name: 'Chief Technology Officer, AI-PSM' },
    { '@type': 'Occupation', name: 'Founder, Predictium' },
  ],
  affiliation: [
    { '@type': 'Organization', name: 'AI-PSM', url: 'https://ai-psm.com' },
    { '@type': 'Organization', name: 'Predictium' },
  ],
  knowsAbout: [
    'AI implementation',
    'agentic AI',
    'ERP implementation',
    'software project management',
    'solution architecture',
    'process safety software',
  ],
}
