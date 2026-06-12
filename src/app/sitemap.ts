import type { MetadataRoute } from 'next'

const BASE = 'https://firmcraft.ai'

// lastModified must reflect real content changes — search engines ignore the
// field entirely once it's provably wrong (e.g. "today" on every fetch).
// Bump a route's date when its content meaningfully changes.
const ROUTES: { path: string; priority: number; lastModified: string }[] = [
  { path: '/', priority: 1, lastModified: '2026-06-12' },
  { path: '/services', priority: 0.9, lastModified: '2026-06-12' },
  { path: '/managed-ai', priority: 0.9, lastModified: '2026-06-12' },
  { path: '/pricing', priority: 0.9, lastModified: '2026-06-12' },
  { path: '/methodology', priority: 0.9, lastModified: '2026-05-20' },
  { path: '/about', priority: 0.8, lastModified: '2026-06-12' },
  { path: '/houston', priority: 0.85, lastModified: '2026-06-12' },
  { path: '/playbooks', priority: 0.7, lastModified: '2026-06-12' },
  { path: '/integrations', priority: 0.7, lastModified: '2026-06-12' },
  { path: '/security', priority: 0.7, lastModified: '2026-06-12' },
  { path: '/support', priority: 0.6, lastModified: '2026-05-20' },
  { path: '/contact', priority: 0.6, lastModified: '2026-05-20' },
  { path: '/privacy', priority: 0.3, lastModified: '2026-06-12' },
  { path: '/terms', priority: 0.3, lastModified: '2026-06-12' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, priority, lastModified }) => ({
    url: `${BASE}${path === '/' ? '' : path}`,
    lastModified: new Date(lastModified),
    changeFrequency: 'monthly',
    priority,
  }))
}
