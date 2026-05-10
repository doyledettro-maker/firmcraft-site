import { NextResponse } from 'next/server'
import { authenticate, SESSION_COOKIE } from '@/lib/session'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const slug = typeof body?.slug === 'string' ? body.slug : ''
  const token = typeof body?.token === 'string' ? body.token : ''

  const partner = authenticate(slug, token)
  if (!partner) {
    return NextResponse.json({ error: 'Invalid slug or token.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, partner: { slug: partner.slug, name: partner.name } })
  res.cookies.set(SESSION_COOKIE, partner.slug, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12h
  })
  return res
}
