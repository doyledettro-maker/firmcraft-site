'use client'

import { useEffect, useState } from 'react'

type Props = {
  contactId: string | null
}

type Status = 'pending' | 'ok' | 'not_found' | 'error'

export function UnsubscribeRunner({ contactId }: Props) {
  const [status, setStatus] = useState<Status>('pending')

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!contactId) {
        if (!cancelled) setStatus('not_found')
        return
      }

      try {
        const res = await fetch(`/api/outreach/unsubscribe/${encodeURIComponent(contactId)}`, {
          method: 'GET',
          cache: 'no-store',
        })
        if (cancelled) return
        if (!res.ok) {
          setStatus('error')
          return
        }
        const json = (await res.json()) as { ok?: boolean; found?: boolean }
        if (!json.ok) {
          setStatus('error')
        } else if (json.found === false) {
          setStatus('not_found')
        } else {
          setStatus('ok')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [contactId])

  if (status === 'pending') {
    return (
      <p className="text-[13px] text-muted font-mono uppercase tracking-[0.12em]">
        Processing your request…
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p className="text-[14px] text-ink-2 leading-relaxed">
        Something went wrong recording your request. Reply{' '}
        <strong>unsubscribe</strong> to any email from us and we&apos;ll remove you
        manually.
      </p>
    )
  }

  if (status === 'not_found') {
    return (
      <p className="text-[14px] text-ink-2 leading-relaxed">
        We couldn&apos;t locate a matching record, but we&apos;ve taken your request
        seriously. Reply <strong>unsubscribe</strong> to any email from us if you
        continue to hear from us.
      </p>
    )
  }

  return (
    <p className="text-[14px] text-ink-2 leading-relaxed">
      Your email address has been removed from our outreach list. You won&apos;t
      receive any further messages from Firmcraft.
    </p>
  )
}
