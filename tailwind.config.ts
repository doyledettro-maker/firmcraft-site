import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy navy/cyan (early hero, kept for non-marketing pages if any)
        brand: {
          bg: '#0A2540',
          cyan: '#00D4AA',
          volt: '#E8FF47',
        },

        // ── Firmcraft operator identity ─────────────────────────────────
        // Surfaces
        paper: '#F7F8FB',
        'paper-2': '#EEF2F7',
        surface: '#FFFFFF',
        console: '#0F172A',

        // Ink
        ink: '#0F172A',
        'ink-2': '#334155',
        muted: '#64748B',

        // Accents
        signal: '#2C6BF0',
        'signal-ink': '#1E4FBC',
        orange: '#FB7C50',
        positive: '#10B981',

        // Legacy aliases — accent now maps to signal blue, accent-2 to
        // operator orange, accent-3 to positive emerald. Keeps existing
        // utility-class usage working.
        accent: '#2C6BF0',
        'accent-2': '#FB7C50',
        'accent-3': '#10B981',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Geist', 'system-ui', 'sans-serif'],
        display: ['var(--font-geist-sans)', 'Geist', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Source Serif 4', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
      },
      boxShadow: {
        'cyan-glow': '0 0 40px rgba(0, 212, 170, 0.15)',
        'volt-glow': '0 0 40px rgba(232, 255, 71, 0.20)',
        'cyan-sm': '0 4px 20px rgba(0, 212, 170, 0.25)',
        'signal-glow': '0 0 40px rgba(44, 107, 240, 0.18)',
        lift: '0 12px 22px -16px rgba(15, 23, 42, 0.18)',
        'lift-lg': '0 24px 48px -28px rgba(15, 23, 42, 0.22)',
      },
    },
  },
  plugins: [],
}

export default config
