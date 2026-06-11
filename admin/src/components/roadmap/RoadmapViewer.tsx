'use client'

import { useMemo, useState, useRef, useEffect, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import GithubSlugger from 'github-slugger'
import { Search, FileText, ChevronRight, List, X, Link2, AlignLeft } from 'lucide-react'
import { DOCS, DOC_GROUPS, type DocMeta } from '@/lib/docs-data'

interface Heading {
  depth: number
  text: string
  slug: string
}

// Pull h1–h3 headings out of raw markdown, skipping fenced code blocks.
function extractHeadings(content: string): Heading[] {
  const slugger = new GithubSlugger()
  const out: Heading[] = []
  let inFence = false
  for (const raw of content.split('\n')) {
    const line = raw.trimEnd()
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^(#{1,3})\s+(.*)$/.exec(line)
    if (!m) continue
    const text = m[2]
      .replace(/[*_`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .trim()
    if (!text) continue
    out.push({ depth: m[1].length, text, slug: slugger.slug(text) })
  }
  return out
}

// Count case-insensitive occurrences of a query in a doc body.
function countMatches(content: string, q: string): number {
  if (!q) return 0
  const lower = content.toLowerCase()
  const needle = q.toLowerCase()
  let count = 0
  let i = lower.indexOf(needle)
  while (i !== -1 && count < 999) {
    count++
    i = lower.indexOf(needle, i + needle.length)
  }
  return count
}

const HEADING_OFFSET = 'scroll-mt-24'

function AnchorHeading({
  level,
  id,
  children,
  className,
}: {
  level: 1 | 2 | 3 | 4
  id?: string
  children: ReactNode
  className: string
}) {
  const Tag = (`h${level}`) as 'h1'
  return (
    <Tag id={id} className={`group relative ${HEADING_OFFSET} ${className}`}>
      {id && (
        <a
          href={`#${id}`}
          aria-label="Link to this section"
          className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted hover:text-accent transition-opacity"
        >
          <Link2 className="w-4 h-4" />
        </a>
      )}
      {children}
    </Tag>
  )
}

const markdownComponents = {
  h1: ({ id, children }: any) => (
    <AnchorHeading level={1} id={id} className="font-sans font-semibold text-[30px] leading-tight tracking-[-0.02em] text-ink mt-10 mb-4 first:mt-0">
      {children}
    </AnchorHeading>
  ),
  h2: ({ id, children }: any) => (
    <AnchorHeading level={2} id={id} className="font-sans font-semibold text-[23px] leading-tight tracking-[-0.01em] text-ink mt-9 mb-3 pb-2 border-b border-line">
      {children}
    </AnchorHeading>
  ),
  h3: ({ id, children }: any) => (
    <AnchorHeading level={3} id={id} className="text-[17px] font-semibold text-ink mt-7 mb-2">
      {children}
    </AnchorHeading>
  ),
  h4: ({ id, children }: any) => (
    <AnchorHeading level={4} id={id} className="text-[15px] font-semibold text-ink-2 mt-5 mb-2 uppercase tracking-wide">
      {children}
    </AnchorHeading>
  ),
  p: ({ children }: any) => <p className="text-[15px] leading-[1.7] text-ink-2 my-4">{children}</p>,
  a: ({ href, children }: any) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
      className="text-accent-3 underline decoration-accent-3/40 underline-offset-2 hover:decoration-accent-3"
    >
      {children}
    </a>
  ),
  ul: ({ children }: any) => <ul className="list-disc pl-6 my-4 space-y-1.5 text-[15px] leading-[1.7] text-ink-2 marker:text-muted">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 my-4 space-y-1.5 text-[15px] leading-[1.7] text-ink-2 marker:text-muted">{children}</ol>,
  li: ({ children }: any) => <li className="pl-1">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-accent/50 bg-paper-2/40 pl-4 pr-3 py-1 my-4 rounded-r text-ink-2 italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-8 border-line" />,
  code: ({ inline, className, children }: any) => {
    if (inline) {
      return <code className="font-mono text-[13px] bg-paper-2 text-accent-3 px-1.5 py-0.5 rounded border border-line">{children}</code>
    }
    return <code className={`font-mono text-[13px] leading-[1.6] ${className || ''}`}>{children}</code>
  },
  pre: ({ children }: any) => (
    <pre className="bg-console-2 border border-line rounded-xl p-4 my-5 overflow-x-auto text-ink-2">{children}</pre>
  ),
  table: ({ children }: any) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-[14px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-paper-2">{children}</thead>,
  th: ({ children }: any) => <th className="text-left font-semibold text-ink px-3 py-2 border-b border-line">{children}</th>,
  td: ({ children }: any) => <td className="text-ink-2 px-3 py-2 border-b border-line align-top">{children}</td>,
  img: ({ src, alt }: any) => <img src={src} alt={alt} className="max-w-full rounded-lg my-4 border border-line" />,
}

export function RoadmapViewer() {
  const [activeId, setActiveId] = useState<string>(DOCS[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [treeOpen, setTreeOpen] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const active: DocMeta | undefined = useMemo(
    () => DOCS.find((d) => d.id === activeId) ?? DOCS[0],
    [activeId],
  )

  const headings = useMemo(() => (active ? extractHeadings(active.content) : []), [active])

  // Search index: per-doc match counts for the current query.
  const matches = useMemo(() => {
    const q = query.trim()
    if (!q) return null
    const map = new Map<string, number>()
    for (const d of DOCS) {
      const c = countMatches(d.content, q) + countMatches(d.title, q)
      if (c > 0) map.set(d.id, c)
    }
    return map
  }, [query])

  // Scroll content back to top when switching docs.
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
  }, [activeId])

  const selectDoc = (id: string) => {
    setActiveId(id)
    setTreeOpen(false)
    setTocOpen(false)
  }

  const visibleGroups = DOC_GROUPS.map((group) => {
    const docs = DOCS.filter((d) => d.group === group).filter((d) => !matches || matches.has(d.id))
    return { group, docs }
  }).filter((g) => g.docs.length > 0)

  const tree = (
    <nav className="space-y-5">
      {visibleGroups.length === 0 && (
        <p className="text-[13px] text-muted px-1">No documents match “{query}”.</p>
      )}
      {visibleGroups.map(({ group, docs }) => (
        <div key={group}>
          <div className="eyebrow mb-2 px-1">{group}</div>
          <div className="space-y-0.5">
            {docs.map((d) => {
              const isActive = d.id === active?.id
              const hits = matches?.get(d.id)
              return (
                <button
                  key={d.id}
                  onClick={() => selectDoc(d.id)}
                  className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13.5px] transition-colors ${
                    isActive
                      ? 'bg-paper-2 text-ink font-medium border-l-2 border-accent pl-[8px]'
                      : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 flex-none text-muted" />
                  <span className="flex-1 truncate">{d.title}</span>
                  {hits != null && (
                    <span className="flex-none text-[11px] font-mono text-accent-3 bg-accent/10 rounded px-1.5 py-0.5">
                      {hits}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  const toc = headings.length > 0 && (
    <div className="space-y-1">
      <div className="eyebrow mb-2 flex items-center gap-1.5">
        <List className="w-3.5 h-3.5" /> On this page
      </div>
      {headings.map((h, i) => (
        <a
          key={`${h.slug}-${i}`}
          href={`#${h.slug}`}
          onClick={() => setTocOpen(false)}
          className={`block text-[13px] leading-snug text-ink-2 hover:text-accent-3 transition-colors py-0.5 ${
            h.depth === 1 ? 'font-medium text-ink' : h.depth === 3 ? 'pl-5 text-muted' : 'pl-2.5'
          }`}
        >
          {h.text}
        </a>
      ))}
    </div>
  )

  return (
    <div className="flex gap-6 items-start">
      {/* Left: document tree (desktop) */}
      <aside className="hidden lg:block w-[260px] flex-none sticky top-[88px] self-start max-h-[calc(100vh-104px)] overflow-y-auto pr-1">
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all docs…"
            className="w-full bg-paper-2 border border-line-2 rounded-lg pl-9 pr-8 py-2 text-[13.5px] text-ink placeholder:text-muted focus:outline-none focus:border-accent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {tree}
      </aside>

      {/* Mobile controls */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40 flex gap-2">
        <button
          onClick={() => setTreeOpen(true)}
          className="flex items-center gap-2 bg-accent text-white rounded-full shadow-lift-lg px-4 py-2.5 text-[13px] font-medium"
        >
          <FileText className="w-4 h-4" /> Docs
        </button>
        {headings.length > 0 && (
          <button
            onClick={() => setTocOpen(true)}
            className="flex items-center gap-2 bg-paper-2 border border-line-2 text-ink rounded-full shadow-lift px-4 py-2.5 text-[13px] font-medium"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile drawers */}
      {treeOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTreeOpen(false)} aria-hidden />
          <div className="relative ml-auto w-[300px] max-w-[85vw] h-full bg-console-2 border-l border-line p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="eyebrow">Documents</span>
              <button onClick={() => setTreeOpen(false)} className="text-ink-2 hover:text-ink" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all docs…"
                className="w-full bg-paper-2 border border-line-2 rounded-lg pl-9 pr-3 py-2 text-[13.5px] text-ink placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
            {tree}
          </div>
        </div>
      )}
      {tocOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTocOpen(false)} aria-hidden />
          <div className="relative ml-auto w-[300px] max-w-[85vw] h-full bg-console-2 border-l border-line p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="eyebrow">On this page</span>
              <button onClick={() => setTocOpen(false)} className="text-ink-2 hover:text-ink" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            {toc}
          </div>
        </div>
      )}

      {/* Center: rendered document */}
      <article ref={contentRef} className="flex-1 min-w-0">
        {active && (
          <div className="rounded-2xl border border-line bg-paper-2/30 px-5 md:px-8 py-6 md:py-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted font-mono mb-1">
              <span className="text-accent-3">{active.group}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{active.title}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted font-mono mb-6">
              <span>{active.wordCount.toLocaleString()} words</span>
              <span>·</span>
              <span>{active.lineCount.toLocaleString()} lines</span>
              <span>·</span>
              <span>~{Math.max(1, Math.round(active.wordCount / 220))} min read</span>
            </div>
            <div className="max-w-[820px]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug]}
                components={markdownComponents}
              >
                {active.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </article>

      {/* Right: table of contents (desktop) */}
      {headings.length > 0 && (
        <aside className="hidden xl:block w-[220px] flex-none sticky top-[88px] self-start max-h-[calc(100vh-104px)] overflow-y-auto">
          {toc}
        </aside>
      )}
    </div>
  )
}
