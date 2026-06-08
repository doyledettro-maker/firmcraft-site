import type { MetadataRoute } from 'next'

const BASE = 'https://firmcraft.ai'

const ROUTES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/services', priority: 0.9 },
  { path: '/managed-ai', priority: 0.9 },
  { path: '/pricing', priority: 0.9 },
  { path: '/methodology', priority: 0.9 },
  { path: '/about', priority: 0.8 },
  { path: '/houston', priority: 0.85 },
  { path: '/playbooks', priority: 0.7 },
  { path: '/integrations', priority: 0.7 },
  { path: '/security', priority: 0.7 },
  { path: '/support', priority: 0.6 },
  { path: '/get-started', priority: 0.8 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return ROUTES.map(({ path, priority }) => ({
    url: `${BASE}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency: 'monthly',
    priority,
  }))
}
