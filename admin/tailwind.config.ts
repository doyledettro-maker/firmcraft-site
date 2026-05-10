import type { Config } from 'tailwindcss'

/**
 * admin.firmcraft.ai — dark "backstage" theme.
 *
 * The token names mirror the marketing site (paper / ink / accent / sage),
 * but the paper↔ink relationship is inverted so the same component classes
 * (`bg-paper`, `text-ink`, `bg-paper-2`) automatically render as a dark UI.
 * Brand accent (terracotta) carries through unchanged.
 */
const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#14110D',
        'paper-2': '#1F1A12',
        ink: '#F4ECDD',
        'ink-2': '#C9BBA4',
        muted: '#8A7560',
        line: 'rgba(244, 236, 221, 0.10)',
        'line-2': 'rgba(244, 236, 221, 0.22)',
        accent: '#D97757',
        'accent-2': '#8FB17C',
        'accent-3': '#5DA6BA',
        hi: '#3A2D1E',
        // Status palette tuned for dark backgrounds.
        'status-up': '#7FB870',
        'status-warn': '#E8B255',
        'status-down': '#E8704F',
        danger: '#E8704F',
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
