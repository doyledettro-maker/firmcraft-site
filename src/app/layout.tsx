import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Analytics } from '@/components/Analytics'
import { JsonLd } from '@/components/JsonLd'
import { ORG_JSONLD } from '@/lib/structured-data'
import '../styles/tokens.css'
import './globals.css'
import './marketing-shared.css'
import './ledger-theme.css'
import { ledgerFontVars } from './fonts'

const PITCH_TITLE = 'Firmcraft | AI for mid-size companies running an ERP'
const PITCH_SHARE =
  'AI designed, built and run inside your ERP and finance stack, from a measured baseline. Every engagement starts with a Diagnostic.'

export const metadata: Metadata = {
  title: {
    default: PITCH_TITLE,
    template: '%s | Firmcraft',
  },
  description:
    'Firmcraft designs, builds and runs AI inside the ERP and finance stack of mid-size companies, from a measured baseline. Led by a principal trained in public accounting with more than twenty years in ERP and finance systems.',
  metadataBase: new URL('https://firmcraft.ai'),
  openGraph: {
    title: PITCH_TITLE,
    description: PITCH_SHARE,
    url: 'https://firmcraft.ai',
    siteName: 'Firmcraft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: PITCH_TITLE,
    description: PITCH_SHARE,
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
      className={ledgerFontVars}
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
