import type { Metadata } from 'next'
import { Suspense } from 'react'
import { JetBrains_Mono, Source_Serif_4 } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { Analytics } from '@/components/Analytics'
import { JsonLd } from '@/components/JsonLd'
import { ORG_JSONLD } from '@/lib/structured-data'
import '../styles/tokens.css'
import './globals.css'
import './marketing-shared.css'

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
    default: 'Firmcraft — AI Advisory and Managed Services',
    template: '%s | Firmcraft',
  },
  description:
    'Firmcraft advises business owners and executive teams on artificial intelligence and technology strategy, implements what the strategy requires, and manages it on an ongoing basis.',
  metadataBase: new URL('https://firmcraft.ai'),
  openGraph: {
    title: 'Firmcraft — AI Advisory and Managed Services',
    description:
      'Advisory, managed services, and infrastructure for organizations adopting artificial intelligence.',
    url: 'https://firmcraft.ai',
    siteName: 'Firmcraft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Firmcraft — AI Advisory and Managed Services',
    description:
      'Advisory, managed services, and infrastructure for organizations adopting artificial intelligence.',
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
