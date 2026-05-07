import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Firmcraft — AI Operators for Professional Services Firms',
  description:
    "Firmcraft deploys a dedicated AI operator into your firm's Slack — connected to your tools, working alongside your people from day one. Flat monthly rate. Everything included.",
  metadataBase: new URL('https://firmcraft.ai'),
  openGraph: {
    title: 'Firmcraft — AI Operators for Professional Services Firms',
    description:
      'Your firm. An AI operator. Running by next week. Flat monthly rate, all integrations included.',
    url: 'https://firmcraft.ai',
    siteName: 'Firmcraft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Firmcraft — AI Operators for Professional Services Firms',
    description: 'Your firm. An AI operator. Running by next week.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="bg-[#0A2540] text-white antialiased">{children}</body>
    </html>
  )
}
