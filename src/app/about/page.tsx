import type { Metadata } from 'next'
import Image from 'next/image'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './about.css'

export const metadata: Metadata = {
  title: 'About — Firmcraft',
  description:
    "Founder, thesis, and the sovereign AI story. CPA + ERP consultant + AI builder building one of the first AI consulting firms native to the post-ChatGPT era.",
}

export default function AboutPage() {
  return (
    <>
      <SiteHeader current="about" />
      <main>
        {/* HERO */}
        <section className="about-hero" data-screen-label="01 About hero">
          <div className="wrap">
            <div className="about-hero-grid">
              <div>
                <div className="eyebrow">About Firmcraft</div>
                <h1>
                  The firm we wished existed when we were inside the{' '}
                  <em>controller&apos;s office.</em>
                </h1>
                <p className="lede">
                  Firmcraft was started by a CPA who became an ERP consultant who became an AI
                  builder — in that order. The differentiator isn&apos;t the technology. It&apos;s
                  the path through the technology that someone who&apos;s been on the other side of
                  the table can see.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a
                    className="btn primary"
                    href="/contact"
                  >
                    Talk to Doyle <span className="arr">→</span>
                  </a>
                  <a className="btn ghost" href="/methodology">
                    How we work
                  </a>
                </div>
              </div>
              <div className="founder-card">
                <div className="founder-photo">
                  <Image
                    src="/founder/doyle.jpg"
                    alt="Doyle Dettro"
                    fill
                    sizes="(max-width: 980px) 100vw, 480px"
                    priority
                    className="founder-img"
                  />
                </div>
                <div className="founder-info">
                  <div className="nm">
                    Doyle Dettro <span className="role">Founder · Principal</span>
                  </div>
                  <div className="creds">
                    <span className="c">CPA</span>
                    <span className="c">MS BC Consultant</span>
                    <span className="c">ERP Implementation</span>
                    <span className="c">Claude Code</span>
                    <span className="c">Bayesian · Monte Carlo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THESIS */}
        <section className="sec" data-screen-label="02 Thesis">
          <div className="wrap">
            <div className="thesis">
              <div className="thesis-l">
                <div className="eyebrow">01 · The thesis</div>
                <h2>
                  Process fluency, <em>not technology novelty.</em>
                </h2>
                <p>
                  The reason AI projects fail at SMBs isn&apos;t the model. It&apos;s that the
                  person scoping the work has never closed a month, never sat in a fit-gap, and
                  doesn&apos;t know what a chart of accounts smells like when it&apos;s been
                  mishandled for four years.
                </p>
                <p>
                  <em>Firmcraft is a firm built around the inverse.</em> The principal is a CPA who
                  spent the last seven years inside Microsoft Business Central engagements at one
                  of the larger Dynamics partners — and the last two building eval harnesses, Monte
                  Carlo simulations, and Bayesian models on his own time.
                </p>
                <p>
                  That&apos;s the shape of the engagement. We sit across from your controller,
                  debate revenue-recognition treatment, then go build the LLM eval harness. Same
                  person, same day. That&apos;s not a slogan — it&apos;s the operating constraint.
                </p>
              </div>
              <aside className="pull-quote">
                <div className="q-mark">&quot;</div>
                <blockquote>
                  The reason small firms fall behind on AI{' '}
                  <span>isn&apos;t the tooling.</span> It&apos;s that nobody on staff has the time
                  to wire it up and run it. <span>Firmcraft is that person — on retainer.</span>
                </blockquote>
                <div className="attr">— Doyle Dettro · Founder</div>
              </aside>
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="sec surface-2" data-screen-label="03 Timeline">
          <div className="wrap">
            <div className="block-head" style={{ marginBottom: 32 }}>
              <div className="eyebrow">02 · The path here</div>
              <h2
                style={{
                  fontWeight: 600,
                  fontSize: 'clamp(26px,3vw,38px)',
                  letterSpacing: '-.022em',
                  lineHeight: 1.05,
                  margin: '8px 0 0',
                  textWrap: 'balance',
                }}
              >
                Four pivots.{' '}
                <em
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontWeight: 500,
                    color: 'var(--color-signal)',
                    letterSpacing: '-.018em',
                  }}
                >
                  One throughline.
                </em>
              </h2>
            </div>

            <div className="timeline">
              <div className="tl-cell">
                <span className="yr">2016 – 2019</span>
                <span className="ph">Phase 01</span>
                <h4>CPA · Big-4 audit</h4>
                <p>
                  Audit and assurance. Where the obsession with reconciled numbers and process
                  traceability got installed.
                </p>
              </div>
              <div className="tl-cell">
                <span className="yr">2019 – 2022</span>
                <span className="ph">Phase 02</span>
                <h4>Industry controller</h4>
                <p>
                  Mid-market manufacturing. Owned the close, the audit, the ERP rollout. Where the
                  empathy got installed.
                </p>
              </div>
              <div className="tl-cell">
                <span className="yr">2022 – Present</span>
                <span className="ph">Phase 03</span>
                <h4>ERP Consulting</h4>
                <p>
                  Microsoft Business Central implementations across field service, manufacturing,
                  and operations. Day job. Where the process-first reflex got sharpened on real
                  engagements.
                </p>
              </div>
              <div className="tl-cell">
                <span className="yr">2024 – Present</span>
                <span className="ph">Phase 04</span>
                <h4>Builder · Hermes / Firmcraft</h4>
                <p>
                  Claude Code, eval harnesses, Monte Carlo, Bayesian inference. Built Hermes. Then
                  built the firm around it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRINCIPLES */}
        <section className="sec" data-screen-label="04 Principles">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">03 · Operating principles</div>
                <h2>
                  Four things <em className="em-italic">we won&apos;t trade.</em>
                </h2>
              </div>
              <p>
                These aren&apos;t values for the careers page. They&apos;re decisions that come up
                in every Build engagement, and they have to be defensible in front of a CFO, an
                auditor, or a procurement team. So we publish them.
              </p>
            </div>

            <div className="principles">
              <div className="principle">
                <div className="ix">i.</div>
                <h3>Process before tool.</h3>
                <p>
                  We map the workflow before we pick the vendor. Half our Assessments end with us
                  telling the buyer they don&apos;t need an AI — they need three Power Automate
                  flows and a clean COA. That answer is part of the deliverable.
                </p>
              </div>
              <div className="principle">
                <div className="ix">ii.</div>
                <h3>Sovereign by default.</h3>
                <p>
                  The default is Hermes, in your walls. We&apos;ll route to a frontier model when
                  it&apos;s the right tool and the data-handling terms are clean. We won&apos;t
                  quietly route there because it&apos;s faster for us to build.
                </p>
              </div>
              <div className="principle">
                <div className="ix">iii.</div>
                <h3>Fixed-fee where it matters.</h3>
                <p>
                  Build engagements are fixed-fee with dated delivery. The hourly work is reserved
                  for genuine out-of-scope and change requests, logged and approved before
                  it&apos;s billed. No buffer-burn at the end of a sprint.
                </p>
              </div>
              <div className="principle">
                <div className="ix">iv.</div>
                <h3>One engineer, one engagement.</h3>
                <p>
                  The person who scoped your Assessment is the one who runs your Build, who shows
                  up on the standup six months in. We don&apos;t do account-handoffs. The whole
                  firm is sized around that constraint.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HERMES */}
        <section className="sec surface-2" data-screen-label="05 Hermes">
          <div className="wrap">
            <div className="hermes-block">
              <div>
                <div className="eyebrow">04 · The substrate</div>
                <h2>
                  Hermes. <em>The open-source LLM foundation Firmcraft is built on.</em>
                </h2>
                <p>
                  Hermes is the open-source LLM, retrieval pipeline, and observability layer we
                  deploy in every Build engagement. It runs in your VPC or on-prem. We maintain it,
                  you own it. If we disappear tomorrow, your operator keeps running.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a className="btn console-ghost" href="#">
                    Read the Hermes overview →
                  </a>
                </div>
              </div>
              <div className="hermes-spec">
                <div className="r">
                  <span className="k">License</span>
                  <span className="v">
                    Open-source<span className="sub">Apache 2.0 · no per-seat fees</span>
                  </span>
                </div>
                <div className="r">
                  <span className="k">Deploy</span>
                  <span className="v">
                    VPC or on-prem<span className="sub">Customer-controlled</span>
                  </span>
                </div>
                <div className="r">
                  <span className="k">Stack</span>
                  <span className="v">
                    Retrieval · gateway · evals<span className="sub">Langfuse-observed</span>
                  </span>
                </div>
                <div className="r">
                  <span className="k">Data path</span>
                  <span className="v">
                    Never leaves your walls
                    <span className="sub">Contractual, not aspirational</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PARTNERS */}
        <section className="sec" data-screen-label="06 Partners">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">05 · Partner ecosystem</div>
                <h2>
                  The vendors <em className="em-italic">in our standard kit.</em>
                </h2>
              </div>
              <p>
                The Assessment ends with a vendor matrix tuned to your engagement. These are the
                partners we know best — where we have working integrations, eval harnesses, and a
                phone number we can call if something breaks at 11pm.
              </p>
            </div>

            <div className="partners">
              <div className="partner-block">
                <h4>ERP &amp; Platform</h4>
                <div className="logos">
                  <div className="logo">Microsoft BC</div>
                  <div className="logo">NetSuite</div>
                  <div className="logo">Acumatica</div>
                  <div className="logo">Sage</div>
                </div>
              </div>
              <div className="partner-block">
                <h4>AI &amp; Workflow</h4>
                <div className="logos">
                  <div className="logo">Hermes</div>
                  <div className="logo">n8n</div>
                  <div className="logo">Langfuse</div>
                  <div className="logo">Claude Code</div>
                </div>
              </div>
              <div className="partner-block">
                <h4>Finance Automation</h4>
                <div className="logos">
                  <div className="logo">Vic.ai</div>
                  <div className="logo">Stampli</div>
                  <div className="logo">Ramp</div>
                  <div className="logo">Bill</div>
                </div>
              </div>
              <div className="partner-block">
                <h4>Voice &amp; Support</h4>
                <div className="logos">
                  <div className="logo">Retell</div>
                  <div className="logo">Vapi</div>
                  <div className="logo">Fin · Intercom</div>
                  <div className="logo">Zendesk</div>
                </div>
              </div>
              <div className="partner-block">
                <h4>Productivity</h4>
                <div className="logos">
                  <div className="logo">Microsoft 365</div>
                  <div className="logo">Google W&apos;space</div>
                  <div className="logo">DocuSign</div>
                  <div className="logo">Slack · Teams</div>
                </div>
              </div>
              <div className="partner-block">
                <h4>Data &amp; Infra</h4>
                <div className="logos">
                  <div className="logo">Snowflake</div>
                  <div className="logo">Fivetran</div>
                  <div className="logo">Azure</div>
                  <div className="logo">AWS</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SKILLCALIBRATE */}
        <section className="sec" style={{ borderBottom: 'none' }} data-screen-label="07 SkillCalibrate">
          <div className="wrap">
            <div className="sc-block">
              <div>
                <div className="eyebrow">06 · Adjacent practice</div>
                <h3>
                  The workforce training arm: <em>SkillCalibrate.</em>
                </h3>
                <p>
                  Where Firmcraft installs AI into the operating layer of an SMB, SkillCalibrate
                  trains the people working alongside it. Same shop, same standards. If your
                  engagement needs people-side enablement, that&apos;s where it goes.
                </p>
              </div>
              <a className="lk" href="https://skillcalibrate.com" rel="noopener">
                skillcalibrate.com ↗
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
