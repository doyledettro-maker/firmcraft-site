import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-[420px] text-center">
        <div className="eyebrow">404</div>
        <h1 className="font-serif-warm text-[40px] tracking-[-0.02em] mt-2">
          Page <em className="text-accent italic">not found</em>
        </h1>
        <p className="text-ink-2 mt-3">That page doesn&rsquo;t exist in the partner portal.</p>
        <Link className="text-ink underline underline-offset-4 mt-4 inline-block" href="/">
          Back to overview
        </Link>
      </div>
    </main>
  )
}
