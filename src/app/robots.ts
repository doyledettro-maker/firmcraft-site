import type { MetadataRoute } from 'next'

// AI retrieval + training crawlers we explicitly welcome. For a services firm
// the site content IS the marketing — being known to the models is the point.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Bingbot',
  'Applebot-Extended',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Form plumbing and token-gated onboarding — no crawl value.
        disallow: ['/api/', '/get-started'],
      },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: 'https://firmcraft.ai/sitemap.xml',
  }
}
