import Link from 'next/link'
import { Button } from '@/components/ui'
import { Logo } from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="max-w-[460px] text-center">
        <Logo />
        <h1 className="font-sans font-semibold text-[42px] tracking-[-0.02em] mt-6 leading-[1.05]">
          That page doesn&rsquo;t <em className="text-signal not-italic">exist</em>.
        </h1>
        <p className="text-ink-2 mt-3">
          The link is wrong or the tenant has been removed.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/"><Button>Back to dashboard</Button></Link>
        </div>
      </div>
    </div>
  )
}
