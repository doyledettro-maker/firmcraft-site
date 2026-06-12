import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET/PATCH /api/settings/employee-codes — manage the employee codes the
// Firmcraft Work mobile app signs in with (see /api/mobile/code-login). Codes
// live in each Clerk user's private_metadata.employee_code; this route is the
// admin panel's read/write surface for them.

const CODE_RE = /^\d{4,6}$/

interface CodeUser {
  id: string
  name: string
  email: string
  code: string | null
}

// Internal-admin only. Clerk's userId gate isn't enough on its own: the
// middleware lets authenticated TENANT users through to /api/* on their
// subdomain, and they must never see (or reassign) the whole roster's codes.
// Tenant requests always carry x-tenant-slug (set only by the middleware,
// stripped from inbound copies), so its presence means "not the admin host".
async function authorized(req: Request): Promise<boolean> {
  if (req.headers.get('x-tenant-slug')) return false
  try {
    const { userId } = await auth()
    return Boolean(userId)
  } catch {
    return false
  }
}

async function listUsers(): Promise<CodeUser[]> {
  const client = await clerkClient()
  const users: CodeUser[] = []
  for (let offset = 0; ; offset += 250) {
    const page = await client.users.getUserList({ limit: 250, offset })
    for (const u of page.data) {
      const meta = u.privateMetadata as Record<string, unknown>
      const code = typeof meta.employee_code === 'string' ? meta.employee_code : null
      const email =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
        u.emailAddresses[0]?.emailAddress ??
        ''
      users.push({
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || email || u.id,
        email,
        code,
      })
    }
    if (page.data.length < 250) break
  }
  users.sort((a, b) => a.name.localeCompare(b.name))
  return users
}

export async function GET(req: Request) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json({ users: await listUsers() })
  } catch (err) {
    console.error('[employee-codes] list failed', err)
    return NextResponse.json({ error: 'Failed to load users from Clerk' }, { status: 502 })
  }
}

export async function PATCH(req: Request) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userId = ''
  let code: string | null = null
  try {
    const body = (await req.json()) as { userId?: unknown; code?: unknown }
    if (typeof body.userId === 'string') userId = body.userId
    if (typeof body.code === 'string') code = body.code.trim()
    else if (body.code !== null) {
      return NextResponse.json({ error: 'code must be a string or null' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }
  if (code !== null && !CODE_RE.test(code)) {
    return NextResponse.json({ error: 'Code must be 4–6 digits' }, { status: 400 })
  }

  try {
    if (code !== null) {
      const taken = (await listUsers()).find((u) => u.code === code && u.id !== userId)
      if (taken) {
        return NextResponse.json(
          { error: `Code ${code} is already assigned to ${taken.name}` },
          { status: 409 },
        )
      }
    }

    const client = await clerkClient()
    // Clerk deep-merges metadata; a null value deletes the key.
    await client.users.updateUserMetadata(userId, {
      privateMetadata: { employee_code: code },
    })
    return NextResponse.json({ ok: true, userId, code })
  } catch (err) {
    console.error('[employee-codes] update failed', err)
    return NextResponse.json({ error: 'Failed to update code in Clerk' }, { status: 502 })
  }
}
