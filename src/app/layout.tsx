import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Firmcraft — A capable second set of hands for your business',
  description:
    "Firmcraft is an AI operator for small professional-services firms — lives in your team chat, plugs into the tools you already use, runs playbooks on a schedule and on events. Flat monthly rate, up and running in five business days.",
  metadataBase: new URL('https://firmcraft.ai'),
  openGraph: {
    title: 'Firmcraft — A capable second set of hands for your business',
    description:
      'An AI operator for small firms. Lives in your team chat, runs the work, asks before it acts.',
    url: 'https://firmcraft.ai',
    siteName: 'Firmcraft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Firmcraft — A capable second set of hands for your business',
    description: 'An AI operator for small firms. Running by next Friday.',
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
      className={`${inter.variable} ${jakarta.variable} ${sourceSerif.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body suppressHydrationWarning className="antialiased">{children}</body>
    </html>
  )
}
