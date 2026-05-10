'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Label } from '@/components/ui'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/'
  const [slug, setSlug] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim().toLowerCase(), token: token.trim() }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Login failed')
      }
      router.push(next)
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="eyebrow">Partner portal</div>
      <h1 className="font-serif-warm text-[32px] tracking-[-0.02em] mt-1 mb-2">
        Sign <em className="text-accent italic">in</em>
      </h1>
      <p className="text-ink-2 text-[14px] leading-relaxed mb-6">
        Use the partner slug and access token Firmcraft provided to you.
        Lost your credentials? Email{' '}
        <a className="text-ink hover:underline" href="mailto:partners@firmcraft.ai">
          partners@firmcraft.ai
        </a>
        .
      </p>
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <Label htmlFor="slug">Partner slug</Label>
          <Input
            id="slug"
            autoFocus
            autoComplete="username"
            placeholder="north-ridge"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="token">Access token</Label>
          <Input
            id="token"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
        {error ? (
          <div className="text-[13px] text-[#A23B1F] bg-[#F4D8CC]/40 border border-[#A23B1F]/20 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="text-[11.5px] text-muted font-mono-warm mt-5">
        Demo creds: north-ridge / demo-northridge
      </p>
    </>
  )
}
