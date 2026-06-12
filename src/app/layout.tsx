import type { Metadata } from 'next'
import { Suspense } from 'react'
import { JetBrains_Mono, Source_Serif_4 } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { Analytics } from '@/components/Analytics'
import { JsonLd } from '@/components/JsonLd'
import { ORG_JSONLD } from '@/lib/structured-data'
import '../styles/tokens.css'
import './globals.css'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  style: 'italic',
  weight: '500',
})

export const metadata: Metadata = {
  title: {
    default: 'Firmcraft — AI Consulting & Managed AI for Small Business',
    template: '%s | Firmcraft',
  },
  description:
    'Firmcraft is an AI consulting firm for small and mid-sized businesses. Fixed-fee AI assessments, implementation, ERP integration, and a managed AI employee from $399/mo. Sovereign by default.',
  metadataBase: new URL('https://firmcraft.ai'),
  openGraph: {
    title: 'Firmcraft — AI Consulting & Managed AI for Small Business',
    description:
      'Big consulting firms won\'t touch you. Frontier labs don\'t care. We do the work in between.',
    url: 'https://firmcraft.ai',
    siteName: 'Firmcraft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Firmcraft — AI Consulting & Managed AI for Small Business',
    description:
      'An AI consulting firm for small and mid-sized businesses. Sovereign by default.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${mono.variable} ${serif.variable}`}
    >
      <body suppressHydrationWarning className="antialiased">
        <JsonLd data={ORG_JSONLD} />
        {children}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
