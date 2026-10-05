import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { HeroVideo } from '@/components/HeroVideo'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './home.css'

export const metadata: Metadata = {
  title: 'Firmcraft — AI Advisory and Managed Services',
  description:
    'Firmcraft advises business owners and executive teams on artificial intelligence and technology strategy, implements what the strategy requires, and manages it on an ongoing basis.',
  alternates: { canonical: '/' },
}

const serviceLines = [
  {
    eyebrow: 'Advisory',
    title: 'Advisory',
    image: '/media/service-advisory.jpg',
    alt: 'Professionals seated around a table reviewing business materials together.',
    href: '/advisory',
    body:
      'Establishing what is currently running, what it costs, and what it actually does. Determining what should be kept, replaced, built, or left alone. Owning the artificial intelligence and technology roadmap at the executive level, so that decisions are made deliberately rather than accumulated by default.',
  },
  {
    eyebrow: 'Managed services',
    title: 'Managed AI services',
    image: '/media/service-managed.jpg',
    alt: 'Close view of people reviewing documents and figures at a work table.',
    href: '/advisory',
    body:
      "Operating the resulting capability over time. Monitoring, evaluation, tuning, retiring what has become obsolete, and introducing what has genuinely improved. The objective is that a client's capability keeps pace with the field rather than freezing at the point of implementation.",
  },
  {
    eyebrow: 'Infrastructure',
    title: 'Infrastructure',
    image: '/media/service-infrastructure.jpg',
    alt: 'A clean modern office interior with people working in the background.',
    href: '/sovereignty',
    body:
      "The technical foundation beneath both, with data sovereignty as the default position. Determining where client data resides, what runs inside the client's own environment, and what may reasonably be sent elsewhere.",
  },
]

const distinctions = [
  {
    title: 'Business process, industry, and systems depth',
    body:
      'Firmcraft is led by an advisor with more than two decades in enterprise software and digital transformation. That work has spanned business process design, solution architecture, and implementation for organizations across a wide range of industries, from owner-led businesses to large enterprises, around the world. The same advisor designs the process, understands the systems it runs on, and builds and operates the artificial intelligence that supports it.',
  },
  {
    title: 'Commercial literacy',
    body:
      'An early career in public accounting and at early-stage companies, including one through its initial public offering, means engagements are led by someone who can assess whether a proposed project produces measurable financial value, and discuss that assessment with an owner, controller, or chief financial officer in their own terms.',
  },
  {
    title: 'Independence',
    body:
      'Firmcraft does not resell software and does not take vendor margin. Where the appropriate answer is a system the client already owns, or no new system at all, that is the recommendation.',
  },
  {
    title: 'An established implementation method',
    body:
      "Firmcraft's approach is adapted from enterprise systems implementation rather than from software piloting. Each process is redesigned before any part of it is automated, and its current performance is measured before anything is built, so that results can be compared against a known starting point.",
  },
  {
    title: 'Continuity',
    body:
      'The person who scopes an engagement leads the implementation and remains through ongoing support. Engagements are not passed to a delivery team.',
  },
]

const fit = [
  ['Scale', 'Established operating business of any size'],
  [
    'Systems',
    'A system of record in place, or actively replatforming — an ERP, a dealer or practice management system, or equivalent',
  ],
  [
    'Organizational lead',
    'Owner, chief executive, chief financial officer, chief operating officer, or other senior leader',
  ],
  ['Typical situation', 'Manual process load, constrained headcount, audit and control exposure'],
  ['AI maturity', 'Isolated pilots without broader adoption, or no formal program'],
]

export default function HomePage() {
  return (
    <>
      <SiteHeader current="home" />

      <main className="marketing marketing-home">
        <section className="home-hero">
          <HeroVideo />
          <div className="wrap">
            <div className="hero-grid">
              <div className="lhs">
                <h1>AI advisory and managed services</h1>
                <p className="lede">
                  Firmcraft advises business owners and executive teams on artificial intelligence
                  and technology strategy, implements what that strategy requires, and manages the
                  result on an ongoing basis. The practice brings together business process,
                  industry, and enterprise systems experience with hands-on technical
                  implementation.
                </p>
                <div className="hero-ctas">
                  <Link className="btn brass lg" href="/contact">
                    Contact Firmcraft
                  </Link>
                  <Link className="btn outline-inverse lg" href="/how-we-work">
                    How we work
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="m-section problem-section reveal-section">
          <div className="wrap">
            <div className="problem-grid">
              <div className="problem-heading">
                <h2>The problem most organizations have with AI</h2>
              </div>
              <div className="prose-block">
                <p>
                  In most organizations, artificial intelligence arrived from the bottom up.
                  Individual employees adopted individual tools. Subscriptions accumulated without a
                  central view of cost or exposure, few of those tools connect to the systems the
                  business actually runs on, and no one owns the overall result.
                </p>
                <p>
                  Most of that artificial intelligence has been applied to processes as they already
                  exist. In a typical business process, the time spent doing the work is small
                  compared with the time spent waiting between steps, for documents, for approvals,
                  or for a reply from another team. Making each step faster leaves that waiting in
                  place, which is why many initiatives produce satisfied users and little measurable
                  change in how the organization performs.
                </p>
                <p>
                  The pace of change compounds the difficulty. A decision that was reasonable
                  eighteen months ago may no longer be, and few organizations have someone on staff
                  whose job is to track that.
                </p>
                <p>
                  Firms that specialize in artificial intelligence often lack working familiarity
                  with the financial and operational systems a business depends on, and firms that
                  know those systems rarely build and operate artificial intelligence themselves.
                </p>
                <p className="statement">Firmcraft was established to do both.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="m-section services-section reveal-section">
          <div className="wrap">
            <div className="m-section-head">
              <div>
                <h2>What Firmcraft does</h2>
              </div>
              <p>
                Implementation runs through all three areas below. Firmcraft builds what the advice
                calls for, integrates it with the systems already in place, and trains the people
                who will use it.
              </p>
            </div>
            <div className="service-grid">
              {serviceLines.map((line) => (
                <article className="service-card" key={line.title}>
                  <Image
                    src={line.image}
                    alt={line.alt}
                    width={1200}
                    height={900}
                    sizes="(min-width: 980px) 31vw, 100vw"
                    unoptimized
                  />
                  <div className="service-body">
                    <p className="eyebrow">{line.eyebrow}</p>
                    <h3>{line.title}</h3>
                    <p>{line.body}</p>
                    <Link href={line.href}>Learn more</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="m-section distinctions-section reveal-section">
          <div className="wrap">
            <div className="m-section-head">
              <div>
                <h2>What distinguishes Firmcraft</h2>
              </div>
            </div>
            <div className="distinction-grid">
              {distinctions.map((item, index) => (
                <article className="diff" key={item.title}>
                  <span className="num">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="m-section fit-section reveal-section">
          <div className="wrap">
            <div className="m-section-head">
              <div>
                <h2>Who Firmcraft works with</h2>
              </div>
              <p>
                Firmcraft works with organizations where the owner, the chief executive, or senior
                leadership drives the technology agenda, from owner-led businesses to the executive
                teams of larger enterprises.
              </p>
            </div>
            <div className="icp-spec">
              {fit.map(([label, value]) => (
                <div className="r" key={label}>
                  <span className="k">{label}</span>
                  <span className="v">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="m-section closing-section reveal-section">
          <div className="wrap">
            <div className="final-cta">
              <div>
                <h2>Start a conversation</h2>
                <p>
                  An initial conversation carries no cost and no obligation. If artificial
                  intelligence is not the right investment for the problem you are describing,
                  Firmcraft will say so.
                </p>
                <div className="hero-ctas">
                  <Link className="btn navy lg" href="/contact">
                    Contact Firmcraft
                  </Link>
                </div>
              </div>
              <figure className="founder-mini">
                <Image
                  src="/founder/doyle.jpg"
                  alt="Doyle Dettro"
                  width={320}
                  height={400}
                  sizes="180px"
                  unoptimized
                />
                <figcaption>Doyle Dettro, Founder and Principal</figcaption>
              </figure>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
