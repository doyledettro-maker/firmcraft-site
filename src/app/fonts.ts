import localFont from 'next/font/local'

// Ledger fonts, loaded once for the whole site. Bundled (latin subset, SIL Open
// Font License) rather than fetched from Google at build time, which failed
// intermittently on Next 14.
export const ledgerDisplay = localFont({
  src: '../assets/fonts/ledger/SchibstedGrotesk-latin-var.woff2',
  weight: '400 900',
  variable: '--font-fl-display',
  display: 'swap',
})
export const ledgerBody = localFont({
  src: '../assets/fonts/ledger/IBMPlexSans-latin-var.woff2',
  weight: '100 700',
  variable: '--font-fl-body',
  display: 'swap',
})
export const ledgerMono = localFont({
  src: [
    { path: '../assets/fonts/ledger/IBMPlexMono-latin-400.woff2', weight: '400' },
    { path: '../assets/fonts/ledger/IBMPlexMono-latin-500.woff2', weight: '500' },
  ],
  variable: '--font-fl-mono',
  display: 'swap',
})

export const ledgerFontVars = `${ledgerDisplay.variable} ${ledgerBody.variable} ${ledgerMono.variable}`
