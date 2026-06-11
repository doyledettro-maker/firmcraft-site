import type { Config } from 'tailwindcss'

/**
 * admin.firmcraft.ai — Operator visual identity (dark console binding).
 *
 * Every color is wired to a CSS custom property from src/styles/tokens.css
 * (the design-handoff source of truth). The <html> element carries
 * data-theme="dark", so surface/paper/ink rebind to the console family
 * (#0B1220 ground, #11192B raised) with signal blue (#2C6BF0) as the
 * primary action and operator orange (#FB7C50) as the warm accent.
 *
 * Legacy names (paper / ink / accent / status-*) are kept as aliases so the
 * existing component classes keep rendering; they use `rgb(var(--rgb-*))`
 * so Tailwind alpha modifiers (bg-accent/10) continue to work.
 */
const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',

        // Console (dark surface family)
        console: 'var(--color-console)',
        'console-2': 'rgb(var(--rgb-console-2) / <alpha-value>)',
        'console-3': 'rgb(var(--rgb-console-3) / <alpha-value>)',

        // Text
        inverse: 'var(--color-inverse)',
        'inverse-2': 'var(--color-inverse-2)',

        // Borders
        line: 'var(--color-line)',
        'line-2': 'var(--color-line-strong)',
        'line-strong': 'var(--color-line-strong)',
        'line-console': 'var(--color-line-console)',

        // Brand — Signal (primary action)
        signal: {
          DEFAULT: 'rgb(var(--rgb-signal) / <alpha-value>)',
          hover: 'var(--color-signal-hover)',
          soft: 'var(--color-signal-soft)',
          ink: 'var(--color-signal-ink)',
        },

        // Brand — Operator (secondary accent, warm bridge)
        operator: {
          DEFAULT: 'rgb(var(--rgb-operator) / <alpha-value>)',
          soft: 'var(--color-operator-soft)',
          ink: 'var(--color-operator-ink)',
        },

        // Semantic
        ok: { DEFAULT: 'var(--color-ok)', soft: 'var(--color-ok-soft)' },
        warn: { DEFAULT: 'var(--color-warn)', soft: 'var(--color-warn-soft)' },
        err: { DEFAULT: 'var(--color-err)', soft: 'var(--color-err-soft)' },

        // Legacy aliases — alpha-capable, pinned to the dark binding.
        paper: 'rgb(var(--rgb-paper) / <alpha-value>)',
        'paper-2': 'rgb(var(--rgb-paper-2) / <alpha-value>)',
        ink: 'rgb(var(--rgb-ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--rgb-ink-2) / <alpha-value>)',
        muted: 'rgb(var(--rgb-muted) / <alpha-value>)',
        accent: 'rgb(var(--rgb-signal) / <alpha-value>)',
        'accent-2': 'rgb(var(--rgb-operator) / <alpha-value>)',
        'accent-3': 'rgb(var(--rgb-signal) / <alpha-value>)',
        hi: 'var(--color-console-3)',
        // Status palette — console-legible variants of ok/warn/err.
        'status-up': 'rgb(var(--rgb-status-up) / <alpha-value>)',
        'status-warn': 'rgb(var(--rgb-status-warn) / <alpha-value>)',
        'status-down': 'rgb(var(--rgb-status-down) / <alpha-value>)',
        danger: 'rgb(var(--rgb-status-down) / <alpha-value>)',
      },

      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        display: ['var(--font-display)'],
      },

      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        pill: 'var(--radius-pill)',
      },

      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        'lift-lg': 'var(--shadow-console)',
        console: 'var(--shadow-console)',
        focus: 'var(--focus-ring)',
      },

      letterSpacing: {
        tightest: '-0.028em',
        tighter: '-0.024em',
        tight: '-0.018em',
        eyebrow: '0.14em',
      },
    },
  },
  plugins: [],
}

export default config
