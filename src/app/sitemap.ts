import type { MetadataRoute } from 'next'

const BASE = 'https://firmcraft.ai'

// lastModified must reflect real content changes — search engines ignore the
// field entirely once it's provably wrong (e.g. "today" on every fetch).
// Bump a route's date when its content meaningfully changes.
const ROUTES: { path: string; priority: number; lastModified: string }[] = [
  { path: '/', priority: 1, lastModified: '2026-09-19' },
  { path: '/advisory', priority: 0.9, lastModified: '2026-09-19' },
  { path: '/how-we-work', priority: 0.9, lastModified: '2026-09-19' },
  { path: '/sovereignty', priority: 0.8, lastModified: '2026-09-19' },
  { path: '/for-small-business', priority: 0.8, lastModified: '2026-09-19' },
  { path: '/about', priority: 0.8, lastModified: '2026-09-19' },
  { path: '/contact', priority: 0.6, lastModified: '2026-09-19' },
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
