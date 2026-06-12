import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/mobile/code-login — employee-code sign-in for the Firmcraft Work
// mobile app (see firmcraft-mobile/docs/employee-code-login.md).
//
// Body { code: "1001" } → finds the Clerk user whose
// private_metadata.employee_code matches and returns a 60-second single-use
// sign-in token. The app exchanges it with signIn.create({ strategy:
// 'ticket' }), so no password ever transits this route and a stolen response
// is useless after a minute. Public in middleware; the gates here are the
// throttle below plus the fact that a valid code yields only a token that
// Clerk itself still has to validate.

const CODE_RE = /^\d{4,6}$/
const TOKEN_TTL_SECONDS = 60
// Success and failure take at least this long, so response time doesn't
// reveal whether a guessed code exists.
const MIN_RESPONSE_MS = 400

// Sliding-window throttle. In-memory, so it's per serverless instance and
// resets on cold start — best-effort, not a hard guarantee. Good enough while
// the code space (4–6 digits) only has a handful of live codes; the durable
// per-code lockout table is the documented v2 upgrade.
const WINDOW_MS = 60_000
const MAX_PER_IP = 8
const MAX_GLOBAL = 30
const attemptsByIp = new Map<string, number[]>()
let globalAttempts: number[] = []

function throttled(ip: string): boolean {
  const now = Date.now()
  globalAttempts = globalAttempts.filter((t) => now - t < WINDOW_MS)
  const forIp = (attemptsByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (globalAttempts.length >= MAX_GLOBAL || forIp.length >= MAX_PER_IP) return true
  globalAttempts.push(now)
  forIp.push(now)
  attemptsByIp.set(ip, forIp)
  // Don't let the map grow unboundedly across a long-lived instance.
  if (attemptsByIp.size > 1000) attemptsByIp.clear()
  return false
}

async function findUserIdByCode(code: string): Promise<string | null> {
  const client = await clerkClient()
  // Backend API can't filter on metadata, so scan. One request covers the
  // first 250 users; paginate beyond that. Swap to a lookup table if the
  // roster ever makes this slow.
  for (let offset = 0; ; offset += 250) {
    const page = await client.users.getUserList({ limit: 250, offset })
    const match = page.data.find(
      (u) => (u.privateMetadata as Record<string, unknown>).employee_code === code,
    )
    if (match) return match.id
    if (page.data.length < 250) return null
  }
}

export async function POST(req: Request) {
  const started = Date.now()
  const respond = async (body: object, status: number) => {
    const elapsed = Date.now() - started
    if (elapsed < MIN_RESPONSE_MS) {
      await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed))
    }
    return NextResponse.json(body, {
      status,
      headers: { 'cache-control': 'no-store, max-age=0' },
    })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (throttled(ip)) {
    return respond({ error: 'Too many attempts. Wait a minute and try again.' }, 429)
  }

  let code = ''
  try {
    const body = (await req.json()) as { code?: unknown }
    if (typeof body.code === 'string') code = body.code.trim()
  } catch {
    // fall through — malformed body gets the same generic 401 as a bad code
  }

  try {
    const userId = CODE_RE.test(code) ? await findUserIdByCode(code) : null
    if (!userId) {
      console.warn(`[code-login] rejected attempt from ${ip}`)
      return respond({ error: 'Code not recognized' }, 401)
    }

    const client = await clerkClient()
    const token = await client.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: TOKEN_TTL_SECONDS,
    })
    console.log(`[code-login] issued sign-in token for ${userId}`)
    return respond({ token: token.token }, 200)
  } catch (err) {
    console.error('[code-login] error', err)
    return respond({ error: 'Sign-in is unavailable right now. Try again shortly.' }, 503)
  }
}
