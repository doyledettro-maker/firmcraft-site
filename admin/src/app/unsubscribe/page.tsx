import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { getContactByEmail } from '@/lib/db/contacts'
import { UnsubscribeRunner } from './UnsubscribeRunner'

export const metadata = {
  title: 'Unsubscribe · Firmcraft',
  description: 'Confirm removal from Firmcraft outreach emails.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type SearchParams = { id?: string | string[]; email?: string | string[] }

function pickFirst(value: string | string[] | undefined): string | null {
  if (!value) return null
  const v = Array.isArray(value) ? value[0] : value
  const trimmed = v?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : null
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  let contactId = pickFirst(searchParams.id)
  const email = pickFirst(searchParams.email)

  if (!contactId && email) {
    try {
      const found = await getContactByEmail(email)
      if (found) contactId = found.id
    } catch {
      // Best-effort lookup — fall through and show generic confirmation.
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="h-16 border-b border-line bg-paper/85 backdrop-blur flex items-center px-6">
        <Link href="https://firmcraft.ai" className="no-underline">
          <Logo />
        </Link>
      </header>

      <main className="flex-1 px-6 py-12 flex items-start">
        <div className="max-w-[520px] mx-auto w-full">
          <div className="mb-8">
            <div className="eyebrow">Email preferences</div>
            <h1 className="font-serif-warm text-[42px] leading-[1.05] tracking-[-0.02em] mt-1">
              You&apos;ve been <em className="text-accent italic">unsubscribed</em>
            </h1>
          </div>

          <div className="bg-paper-2 border border-line rounded-2xl px-6 py-6">
            <UnsubscribeRunner contactId={contactId} />
          </div>

          <div className="mt-8 text-[13px] text-muted leading-relaxed">
            Reached this page by mistake or have something to share? Email{' '}
            <a
              className="text-ink underline underline-offset-2"
              href="mailto:doyle@firmcraft.ai"
            >
              doyle@firmcraft.ai
            </a>
            .
          </div>
        </div>
      </main>

      <footer className="border-t border-line px-6 py-6 text-[12px] text-muted font-mono-warm">
        <div className="max-w-[520px] mx-auto flex justify-between">
          <span>firmcraft</span>
          <span>email preferences</span>
        </div>
      </footer>
    </div>
  )
}
