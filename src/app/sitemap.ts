import type { MetadataRoute } from 'next'

const BASE = 'https://firmcraft.ai'

const ROUTES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/how-it-works', priority: 0.9 },
  { path: '/capabilities', priority: 0.9 },
  { path: '/pricing', priority: 0.9 },
  { path: '/playbooks', priority: 0.8 },
  { path: '/integrations', priority: 0.8 },
  { path: '/security', priority: 0.8 },
  { path: '/support', priority: 0.7 },
  { path: '/get-started', priority: 0.9 },
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
