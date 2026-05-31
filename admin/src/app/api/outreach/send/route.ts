import { NextResponse } from 'next/server'
import {
  getProspect,
  getProspects,
  updateProspect,
  type Prospect,
} from '@/lib/db/prospects'
import { sendProspectEmail, type SendResult } from '@/lib/outreach'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type SendBody = {
  prospectId?: string
  prospectIds?: string[]
  sendAllQueued?: boolean
}

/**
 * Send one or more prospect emails through Resend.
 * Body shapes:
 *   { prospectId: "<uuid>" }
 *   { prospectIds: ["<uuid>", "<uuid>"] }
 *   { sendAllQueued: true }   // picks up every prospect in `queued` status
 */
export async function POST(req: Request) {
  let body: SendBody
  try {
    body = (await req.json()) as SendBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  let targets: Prospect[] = []
  try {
    if (body.prospectId) {
      const p = await getProspect(body.prospectId)
      if (!p) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
      targets = [p]
    } else if (Array.isArray(body.prospectIds) && body.prospectIds.length > 0) {
      const all = await getProspects()
      const wanted = new Set(body.prospectIds)
      targets = all.filter((p) => wanted.has(p.id))
    } else if (body.sendAllQueued) {
      const all = await getProspects()
      targets = all.filter((p) => p.status === 'queued')
    } else {
      return NextResponse.json({ error: 'Specify prospectId, prospectIds, or sendAllQueued' }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  if (targets.length === 0) {
    return NextResponse.json({ sent: 0, results: [] })
  }

  const results: SendResult[] = []
  for (const prospect of targets) {
    const result = await sendProspectEmail(prospect)
    results.push(result)
    try {
      if (result.ok) {
        await updateProspect(prospect.id, {
          status: 'sent',
          resendMessageId: result.messageId ?? null,
          sentAt: new Date().toISOString(),
        })
      }
    } catch (err) {
      result.error = `Send succeeded but DB update failed: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  })
}
