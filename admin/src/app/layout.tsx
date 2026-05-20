import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
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
      className={`${inter.variable} ${jakarta.variable} ${sourceSerif.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
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
