import type { Metadata } from 'next'
import { JetBrains_Mono, Source_Serif_4 } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { ClerkProvider } from '@clerk/nextjs'
import '../styles/tokens.css'
import './globals.css'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

// Wordmark only — never used in body copy or UI labels.
const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  style: 'italic',
  weight: '500',
})

export const metadata: Metadata = {
  title: 'Firmcraft Admin',
  description: 'Internal admin dashboard and client onboarding for Firmcraft.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const html = (
    <html
      lang="en"
      data-theme="dark"
      className={`${GeistSans.variable} ${mono.variable} ${serif.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  )

  // Local dev / build without Clerk keys: render without the provider.
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return html

  return (
    <ClerkProvider signInUrl="/login" signInFallbackRedirectUrl="/">
      {html}
    </ClerkProvider>
  )
}
