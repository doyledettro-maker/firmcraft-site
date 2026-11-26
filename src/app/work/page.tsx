import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { selectedWork } from '@/lib/selected-work'
import './work.css'

export const metadata: Metadata = {
  title: 'Selected Work',
  description:
    'Selected Firmcraft engagements and ventures: Rumble Bee Tree Service, a dental practice in Burlington, Illinois, the AI-PSM process safety platform, and Predictium.',
  alternates: { canonical: '/work' },
}

export default function WorkPage() {
  return (
    <>
      <SiteHeader current="work" />
      <main className="marketing-inner work-page">
        <section className="page-hero">
          <div className="wrap">
            <p className="eyebrow">Engagements and ventures</p>
            <h1>Selected work</h1>
            <p className="lede">
              The engagements and ventures below show how Firmcraft&apos;s approach applies in
              practice. The processes are mapped first, the systems are connected, and AI workflows
              are then built to carry the routine work.
            </p>
          </div>
        </section>

        {selectedWork.map((entry) => (
          <section className="sec" id={entry.id} key={entry.id}>
            <div className="wrap">
              <div className="pkg-head work-entry">
                <p className="eyebrow">{entry.kind}</p>
                <h2>{entry.title}</h2>
                {entry.place ? <p className="work-place">{entry.place}</p> : null}
                {entry.body.map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
                {entry.link ? (
                  <p>
                    <a href={entry.link.href} rel="noopener">
                      {entry.link.label}
                    </a>
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ))}

        <section className="sec" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="cta-end">
              <h2>Start a conversation</h2>
              <p>An initial conversation carries no cost and no obligation.</p>
              <Link className="btn navy lg" href="/contact">
                Contact Firmcraft
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
