import type { Metadata } from 'next'
import { JetBrains_Mono, Source_Serif_4 } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
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
  title: 'Firmcraft — AI implementation, integration, and enablement for SMBs',
  description:
    'Firmcraft is an AI consulting firm for finance- and operations-driven SMBs running ERPs. Assessment, implementation, managed operations, and fractional advisory. Sovereign by default.',
  metadataBase: new URL('https://firmcraft.ai'),
  openGraph: {
    title: 'Firmcraft — AI implementation, integration, and enablement for SMBs',
    description:
      'Big consulting firms won\'t touch you. Frontier labs don\'t care. We do the work in between.',
    url: 'https://firmcraft.ai',
    siteName: 'Firmcraft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Firmcraft — AI implementation, integration, and enablement for SMBs',
    description:
      'An AI consulting firm for finance- and operations-driven SMBs. Sovereign by default.',
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
      <body suppressHydrationWarning className="antialiased">{children}</body>
    </html>
  )
}
