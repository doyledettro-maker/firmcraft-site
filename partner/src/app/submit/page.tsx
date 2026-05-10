import { redirect } from 'next/navigation'
import { PartnerShell } from '@/components/PartnerShell'
import { getSessionPartner } from '@/lib/session'
import { SubmitClientForm } from './SubmitClientForm'

export const metadata = { title: 'Submit client · Firmcraft Partners' }

export default async function SubmitPage() {
  const partner = await getSessionPartner()
  if (!partner) redirect('/login')

  return (
    <PartnerShell partnerName={partner.name}>
      <div className="mb-7">
        <div className="eyebrow">New referral</div>
        <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
          Submit a <em className="text-accent italic">client</em>
        </h1>
        <p className="text-ink-2 mt-2 max-w-[640px]">
          Fill in what you know. Firmcraft will pick it up from the
          submissions queue, follow up with the client to fill any gaps,
          and stand up the tenant. You&rsquo;ll see them in your client
          list once they&rsquo;re activated.
        </p>
      </div>

      <SubmitClientForm partnerName={partner.name} />
    </PartnerShell>
  )
}
