import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './methodology.css'

export const metadata: Metadata = {
  title: 'Methodology — Firmcraft',
  description:
    'Five phases inherited from ERP, re-tuned for AI: discovery, fit-gap, configure, train & eval, hypercare.',
}

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader current="methodology" />
      <main>
        {/* HERO */}
        <section className="page-hero" data-screen-label="01 Methodology hero">
          <div className="wrap">
            <div className="eyebrow">Methodology</div>
            <h1>
              Five phases. <em>Inherited from ERP. Re-tuned for AI.</em>
            </h1>
            <p className="lede">
              Most AI projects fail because they&apos;re run like software pilots. We run them like ERP implementations — discovery, fit-gap, configure, train, hypercare — because that&apos;s the playbook that&apos;s already known to work in the room AI has to fit into. The differences are in what gets measured.
            </p>
            <nav className="step-nav" aria-label="Methodology phases">
              <a href="#discovery"><span className="num">01</span><span className="name">Discovery</span></a>
              <a href="#fitgap"><span className="num">02</span><span className="name">Fit-gap</span></a>
              <a href="#configure"><span className="num">03</span><span className="name">Configure</span></a>
              <a href="#train"><span className="num">04</span><span className="name">Train & eval</span></a>
              <a href="#hypercare"><span className="num">05</span><span className="name">Hypercare</span></a>
            </nav>
          </div>
        </section>

        {/* STEP 01 — Discovery */}
        <section className="sec" id="discovery" data-screen-label="02 Discovery">
          <div className="wrap">
            <div className="step-block">
              <div className="step-info">
                <div className="ix"><span>Phase 01</span><span className="duration">· Week 1 of Assessment</span></div>
                <h2>Discovery. <em>The week where we stop assuming.</em></h2>
                <p className="intro">A round of 1:1 interviews with the people who actually do the work — finance, ops, IT, and whoever owns the chart of accounts. The output is a system inventory, a process map for every candidate workflow, and a list of the disagreements between what your software is supposed to do and what your team actually does.</p>
                <div className="what">
                  <div className="row"><div className="k">Inputs</div><div className="v">Org chart · ERP access · prior pilot post-mortems</div></div>
                  <div className="row"><div className="k">Activities</div><div className="v"><span className="pill">Interviews</span><span className="pill">Inventory</span><span className="pill">Process maps</span></div></div>
                  <div className="row"><div className="k">Output</div><div className="v">A landscape document. Not a deck — a working artifact the Build team references for the entire engagement.</div></div>
                  <div className="row"><div className="k">Owned by</div><div className="v">Firmcraft principal · with your CFO or COO as the lead sponsor</div></div>
                </div>
              </div>

              <div className="vis-side">
                <div className="vis-card">
                  <div className="head"><span className="ttl">Discovery schedule · <b>wk 1</b></span><span className="stamp">5 of 7 scheduled</span></div>
                  <div className="body">
                    <div className="interview-list">
                      <div className="iv"><div className="av">CF</div><div className="info"><div className="nm">CFO · J. Reyes</div><div className="role">Org thesis · funding · audit posture</div></div><span className="pill">Done</span></div>
                      <div className="iv"><div className="av">CO</div><div className="info"><div className="nm">Controller · R. Tanaka</div><div className="role">Close cadence · AP/AR pain · COA hygiene</div></div><span className="pill">Done</span></div>
                      <div className="iv"><div className="av">OP</div><div className="info"><div className="nm">Dir. Ops · M. Brennan</div><div className="role">Work order flow · field-to-ERP gaps</div></div><span className="pill">Done</span></div>
                      <div className="iv"><div className="av">IT</div><div className="info"><div className="nm">IT lead · S. Park</div><div className="role">Stack · access · sovereignty constraints</div></div><span className="pill sched">Thu</span></div>
                      <div className="iv"><div className="av">AP</div><div className="info"><div className="nm">AP team · A. Nguyen +2</div><div className="role">Invoice intake · coding patterns</div></div><span className="pill sched">Fri</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 02 — Fit-gap */}
        <section className="sec surface-2" id="fitgap" data-screen-label="03 Fit-gap">
          <div className="wrap">
            <div className="step-block alt">
              <div className="step-info">
                <div className="ix"><span>Phase 02</span><span className="duration">· Week 2 of Assessment</span></div>
                <h2>Fit-gap. <em>Where ERP discipline meets AI scope.</em></h2>
                <p className="intro">For every candidate workflow, three questions: does the existing system already do this (Fit), does it almost-but-not-quite (Gap), or is it a true greenfield (Missing). Only Gaps and Missings go forward into the scorecard. The Fits get a one-line &quot;don&apos;t build this&quot; — that answer alone usually pays for the Assessment.</p>
                <div className="what">
                  <div className="row"><div className="k">Inputs</div><div className="v">Discovery landscape · ERP capability matrix · sovereignty rules</div></div>
                  <div className="row"><div className="k">Activities</div><div className="v"><span className="pill">Capability matrix</span><span className="pill">Scoring</span><span className="pill">Sovereignty pass</span></div></div>
                  <div className="row"><div className="k">Output</div><div className="v">The scorecard. Every candidate use case, ranked, with a feasibility × ROI × sovereign-fit score and a Build / Defer / Don&apos;t decision.</div></div>
                  <div className="row"><div className="k">Owned by</div><div className="v">Firmcraft principal · review with CFO + IT lead</div></div>
                </div>
              </div>

              <div className="vis-side">
                <div className="vis-card">
                  <div className="head"><span className="ttl">Fit-gap scorecard · <b>wk 2</b></span><span className="stamp">18 candidates · 7 greenlit</span></div>
                  <div className="body">
                    <div className="gap-matrix">
                      <div className="row hd"><div>Use case</div><div className="cell">Fit</div><div className="cell">Gap</div><div className="cell">Missing</div></div>
                      <div className="row"><div className="nm">AP invoice triage<span className="sub">High ROI · on-prem</span></div><div className="cell"></div><div className="cell"><span className="dot gap"></span></div><div className="cell"></div></div>
                      <div className="row"><div className="nm">Work-order draft<span className="sub">High ROI · on-prem</span></div><div className="cell"></div><div className="cell"></div><div className="cell"><span className="dot miss"></span></div></div>
                      <div className="row"><div className="nm">Vendor master mgmt.<span className="sub">BC already covers</span></div><div className="cell"><span className="dot fit"></span></div><div className="cell"></div><div className="cell"></div></div>
                      <div className="row"><div className="nm">Voice agent (sched.)<span className="sub">Hybrid sovereign-fit</span></div><div className="cell"></div><div className="cell"></div><div className="cell"><span className="dot miss"></span></div></div>
                      <div className="row"><div className="nm">Month-end commentary<span className="sub">Defer · low feasibility</span></div><div className="cell"></div><div className="cell"><span className="dot gap"></span></div><div className="cell"></div></div>
                      <div className="row"><div className="nm">3-way match<span className="sub">BC handles natively</span></div><div className="cell"><span className="dot fit"></span></div><div className="cell"></div><div className="cell"></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 03 — Configure */}
        <section className="sec" id="configure" data-screen-label="04 Configure">
          <div className="wrap">
            <div className="step-block">
              <div className="step-info">
                <div className="ix"><span>Phase 03</span><span className="duration">· Weeks 1–10 of Build</span></div>
                <h2>Configure. <em>The Build, run like an implementation.</em></h2>
                <p className="intro">The Foundation goes in first — Hermes deployed, retrieval indexed, the messaging gateway wired, Langfuse observing. Then the vertical workflows stack on top, one at a time, each shipped to production behind a feature flag, each with its eval suite in place before traffic. The discipline is straight out of ERP go-lives.</p>
                <div className="what">
                  <div className="row"><div className="k">Inputs</div><div className="v">Scorecard · roadmap · vendor matrix · TCO model</div></div>
                  <div className="row"><div className="k">Activities</div><div className="v"><span className="pill">Foundation install</span><span className="pill">RAG indexing</span><span className="pill">Workflow build</span><span className="pill">Integration</span></div></div>
                  <div className="row"><div className="k">Output</div><div className="v">A running system, behind feature flags, with the eval suite green on each workflow before it sees a real user.</div></div>
                  <div className="row"><div className="k">Owned by</div><div className="v">Same principal as Discovery · with the Build team behind the scenes</div></div>
                </div>
              </div>

              <div className="vis-side">
                <div className="vis-card">
                  <div className="head"><span className="ttl">Workflow · <b>ap.triage.v3</b></span><span className="stamp">flag · canary · 5%</span></div>
                  <div className="body">
                    <div className="wf-graph">
                      <svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
                        {/* nodes */}
                        <g fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#334155">
                          {/* 1 */}
                          <rect x="6" y="20" width="92" height="38" rx="7" fill="#FFFFFF" stroke="#E2E8F0"/>
                          <text x="52" y="36" textAnchor="middle" fontSize="8" fill="#64748B" letterSpacing=".06em">TRIGGER</text>
                          <text x="52" y="51" textAnchor="middle" fill="#0F172A" fontFamily="Geist,sans-serif" fontWeight="500" fontSize="11">Email inbound</text>

                          {/* 2 */}
                          <rect x="134" y="20" width="92" height="38" rx="7" fill="#E0EAFE" stroke="#7DA7FF"/>
                          <text x="180" y="36" textAnchor="middle" fontSize="8" fill="#2C6BF0" letterSpacing=".06em">HERMES</text>
                          <text x="180" y="51" textAnchor="middle" fill="#0B2A8B" fontFamily="Geist,sans-serif" fontWeight="500" fontSize="11">Classify</text>

                          {/* 3 */}
                          <rect x="262" y="20" width="92" height="38" rx="7" fill="#FFFFFF" stroke="#E2E8F0"/>
                          <text x="308" y="36" textAnchor="middle" fontSize="8" fill="#64748B" letterSpacing=".06em">RAG</text>
                          <text x="308" y="51" textAnchor="middle" fill="#0F172A" fontFamily="Geist,sans-serif" fontWeight="500" fontSize="11">Vendor lookup</text>

                          {/* 4 */}
                          <rect x="6" y="92" width="92" height="38" rx="7" fill="#FFFFFF" stroke="#E2E8F0"/>
                          <text x="52" y="108" textAnchor="middle" fontSize="8" fill="#64748B" letterSpacing=".06em">TOOL</text>
                          <text x="52" y="123" textAnchor="middle" fill="#0F172A" fontFamily="Geist,sans-serif" fontWeight="500" fontSize="11">BC · code</text>

                          {/* 5 */}
                          <rect x="134" y="92" width="92" height="38" rx="7" fill="#FFE9DD" stroke="#FB7C50"/>
                          <text x="180" y="108" textAnchor="middle" fontSize="8" fill="#7A2D0E" letterSpacing=".06em">REVIEW</text>
                          <text x="180" y="123" textAnchor="middle" fill="#7A2D0E" fontFamily="Geist,sans-serif" fontWeight="500" fontSize="11">if &gt; $5k</text>

                          {/* 6 */}
                          <rect x="262" y="92" width="92" height="38" rx="7" fill="#FFFFFF" stroke="#E2E8F0"/>
                          <text x="308" y="108" textAnchor="middle" fontSize="8" fill="#64748B" letterSpacing=".06em">TOOL</text>
                          <text x="308" y="123" textAnchor="middle" fill="#0F172A" fontFamily="Geist,sans-serif" fontWeight="500" fontSize="11">BC · post</text>

                          {/* 7 */}
                          <rect x="134" y="164" width="92" height="38" rx="7" fill="#DCFCE7" stroke="#10B981"/>
                          <text x="180" y="180" textAnchor="middle" fontSize="8" fill="#065F46" letterSpacing=".06em">EMIT</text>
                          <text x="180" y="195" textAnchor="middle" fill="#065F46" fontFamily="Geist,sans-serif" fontWeight="500" fontSize="11">audit + notify</text>
                        </g>

                        {/* arrows */}
                        <g stroke="#94A3B8" strokeWidth="1.4" fill="none">
                          <path d="M98 39 L134 39" markerEnd="url(#ar)"/>
                          <path d="M226 39 L262 39" markerEnd="url(#ar)"/>
                          <path d="M308 58 L308 75 L52 75 L52 92" markerEnd="url(#ar)"/>
                          <path d="M98 111 L134 111" markerEnd="url(#ar)"/>
                          <path d="M226 111 L262 111" markerEnd="url(#ar)"/>
                          <path d="M308 130 L308 148 L180 148 L180 164" markerEnd="url(#ar)"/>
                        </g>
                        <defs>
                          <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                            <path d="M0 0 L10 5 L0 10 Z" fill="#94A3B8"/>
                          </marker>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 04 — Train & eval */}
        <section className="sec surface-2" id="train" data-screen-label="05 Train">
          <div className="wrap">
            <div className="step-block alt">
              <div className="step-info">
                <div className="ix"><span>Phase 04</span><span className="duration">· Weeks 8–12 of Build</span></div>
                <h2>Train & eval. <em>People and models, in that order.</em></h2>
                <p className="intro">Two parallel tracks. Your team learns the operator — what it can and can&apos;t do, how to handle reviews, where the audit log lives. Meanwhile the eval suite is locked in: a regression set for every workflow, scored on accuracy, latency, and cost, gating each release. We don&apos;t ship a workflow without it.</p>
                <div className="what">
                  <div className="row"><div className="k">Inputs</div><div className="v">Production workflows · golden test set from Discovery · audit requirements</div></div>
                  <div className="row"><div className="k">Activities</div><div className="v"><span className="pill">Team training</span><span className="pill">Eval harness</span><span className="pill">Regression set</span><span className="pill">Cost budget</span></div></div>
                  <div className="row"><div className="k">Output</div><div className="v">A scored, regression-gated system and a team that can run it without us being on every standup.</div></div>
                  <div className="row"><div className="k">Owned by</div><div className="v">Firmcraft principal + your AP or Ops lead as champion</div></div>
                </div>
              </div>

              <div className="vis-side">
                <div className="vis-card">
                  <div className="head"><span className="ttl">Eval run · <b>ap.triage · v3.2</b></span><span className="stamp">passed · 18 / 20</span></div>
                  <div className="body eval-card">
                    <div className="scores">
                      <div className="s"><div className="k">Accuracy</div><div className="v green">94<span className="unit">%</span></div></div>
                      <div className="s"><div className="k">p95 latency</div><div className="v">410<span className="unit">ms</span></div></div>
                      <div className="s"><div className="k">$ / run</div><div className="v amber">$0.018</div></div>
                    </div>
                    <div className="test-list">
                      <div className="test"><span className="nm">vendor.match.exact</span><span className="ms">312ms</span><span className="pill pass">pass</span></div>
                      <div className="test"><span className="nm">coa.code.lookup</span><span className="ms">288ms</span><span className="pill pass">pass</span></div>
                      <div className="test"><span className="nm">3way.match.partial</span><span className="ms">510ms</span><span className="pill warn">warn</span></div>
                      <div className="test"><span className="nm">duplicate.detect</span><span className="ms">204ms</span><span className="pill pass">pass</span></div>
                      <div className="test"><span className="nm">currency.convert</span><span className="ms">198ms</span><span className="pill pass">pass</span></div>
                      <div className="test"><span className="nm">approval.threshold</span><span className="ms">410ms</span><span className="pill pass">pass</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 05 — Hypercare */}
        <section className="sec" id="hypercare" data-screen-label="06 Hypercare">
          <div className="wrap">
            <div className="step-block">
              <div className="step-info">
                <div className="ix"><span>Phase 05</span><span className="duration">· First 90 days post-launch</span></div>
                <h2>Hypercare. <em>The first 90 days, run by us.</em></h2>
                <p className="intro">After cutover, we&apos;re on every standup for 30 days, on the channel for 90, and named owners on the runbook for the duration. Hypercare ends when the system has cleared an eval regression cycle without our intervention. After that, you&apos;re on an Operate retainer — or off our books entirely.</p>
                <div className="what">
                  <div className="row"><div className="k">Inputs</div><div className="v">Production system · runbook · eval & cost dashboards</div></div>
                  <div className="row"><div className="k">Activities</div><div className="v"><span className="pill">Daily standup</span><span className="pill">Runbook drills</span><span className="pill">Eval regressions</span><span className="pill">Incident review</span></div></div>
                  <div className="row"><div className="k">Output</div><div className="v">A handoff packet, a passing eval cycle, and a named on-call rotation — yours or ours, depending on which Operate tier you signed.</div></div>
                  <div className="row"><div className="k">Owned by</div><div className="v">Firmcraft principal · then handoff to retained AI lead</div></div>
                </div>
              </div>

              <div className="vis-side">
                <div className="vis-card">
                  <div className="head"><span className="ttl">Runbook · <b>day 14</b></span><span className="stamp">on-track</span></div>
                  <div className="body">
                    <div className="runbook">
                      <div className="rb live"><div className="chk"></div><div className="nm">Daily eval regression run<span className="sub">scheduled · 06:00 CT</span></div><span className="ts">live</span></div>
                      <div className="rb"><div className="chk"></div><div className="nm">Cost budget review<span className="sub">weekly · finance lead</span></div><span className="ts">Mon</span></div>
                      <div className="rb"><div className="chk"></div><div className="nm">Audit-log spot-check<span className="sub">5 random invoices · controller</span></div><span className="ts">d 12</span></div>
                      <div className="rb"><div className="chk"></div><div className="nm">Incident drill · vendor outage<span className="sub">runbook §3.2</span></div><span className="ts">d 10</span></div>
                      <div className="rb todo"><div className="chk"></div><div className="nm">Retrospective with CFO + ops lead<span className="sub">end of week 2</span></div><span className="ts">Fri</span></div>
                      <div className="rb todo"><div className="chk"></div><div className="nm">Eval regression — full suite<span className="sub">unattended · gates handoff</span></div><span className="ts">d 28</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE DON'T DO */}
        <section className="sec surface-2" data-screen-label="07 No">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">06 · Negative space</div>
                <h2>The methodology is <em className="em-italic">also what we won&apos;t do.</em></h2>
              </div>
              <p>Most of what makes an AI engagement go off the rails happens in the gaps between the steps above. So we name the disciplines we don&apos;t carry over from the rest of the consulting industry.</p>
            </div>
            <div className="nono-grid">
              <div className="nono"><div className="glyph">✕</div><h3>No 90-day &quot;discoveries.&quot;</h3><p>The Assessment is two to three weeks. If we need longer, scope is wrong — and the wrong scope kills a project faster than the wrong model.</p></div>
              <div className="nono"><div className="glyph">✕</div><h3>No demo-driven sales.</h3><p>We won&apos;t build a pretty PoC to win the room. The Assessment is the sales conversation, and it&apos;s billed.</p></div>
              <div className="nono"><div className="glyph">✕</div><h3>No quiet routing to frontier models.</h3><p>If a workflow leaves your walls for a frontier API, you&apos;ll know — it&apos;ll be in the architecture diagram, the contract, and the audit log.</p></div>
              <div className="nono"><div className="glyph">✕</div><h3>No account-handoffs.</h3><p>The principal who scoped your engagement is the one who&apos;s on the hypercare standup. We&apos;re sized around that constraint — not around scaling headcount.</p></div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="sec" style={{ borderBottom: 'none' }} data-screen-label="08 CTA">
          <div className="wrap">
            <div
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-line)',
                borderRadius: '22px',
                padding: '48px 56px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '32px',
                alignItems: 'center',
              }}
            >
              <div>
                <div className="eyebrow">Start here</div>
                <h2
                  style={{
                    margin: '10px 0 12px',
                    fontWeight: 600,
                    fontSize: 'clamp(24px,2.8vw,34px)',
                    letterSpacing: '-.02em',
                    lineHeight: 1.1,
                    maxWidth: '560px',
                  }}
                >
                  Five phases, run by the same person,{' '}
                  <em
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 500,
                      color: 'var(--color-signal)',
                      letterSpacing: '-.018em',
                    }}
                  >
                    from week one.
                  </em>
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: '14.5px',
                    color: 'var(--color-ink-2)',
                    lineHeight: 1.6,
                    maxWidth: '560px',
                  }}
                >
                  Start with the Assessment. Three weeks, fixed-fee, refundable against Build.
                </p>
              </div>
              <a className="btn primary lg" href="mailto:hello@firmcraft.ai?subject=Firmcraft%20Assessment">
                Book the call <span className="arr">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
