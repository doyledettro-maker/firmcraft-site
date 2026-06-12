/**
 * Renders a schema.org JSON-LD block. Server-component-safe.
 * Pass a single schema object or use multiple <JsonLd> instances per page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output of our own literals; escape `<` to keep any
      // string content from terminating the script element early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
