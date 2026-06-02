import type { Config } from 'tailwindcss'

/**
 * admin.firmcraft.ai — dark "console" theme.
 *
 * Built on the Firmcraft dark-console palette: a cool navy base (#0B1220),
 * signal-blue (#2C6BF0) primary accent, and operator-orange (#FB7C50)
 * secondary accent. Token names (paper / ink / accent) mirror the marketing
 * site so the same component classes (`bg-paper`, `text-ink`, `bg-paper-2`)
 * render a professional dark dashboard.
 */
const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#0B1220',
        'paper-2': '#1E293B',
        ink: '#F1F5F9',
        'ink-2': '#CBD5E1',
        muted: '#94A3B8',
        line: 'rgba(148, 163, 184, 0.12)',
        'line-2': 'rgba(148, 163, 184, 0.24)',
        accent: '#2C6BF0',
        'accent-2': '#FB7C50',
        'accent-3': '#38BDF8',
        hi: '#16233B',
        // Status palette — semantic, shifted to cooler tones for the navy base.
        'status-up': '#34D399',
        'status-warn': '#FBBF24',
        'status-down': '#F87171',
        danger: '#F87171',
      },
      fontFamily: {
        sans: ['Geist', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
      },
      boxShadow: {
        lift: '0 12px 22px -16px rgba(0, 0, 0, 0.55)',
        'lift-lg': '0 24px 48px -28px rgba(0, 0, 0, 0.65)',
      },
    },
  },
  plugins: [],
}

export default config
