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
        // Surfaces
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        paper: 'var(--color-paper)',

        // Console (dark surface family)
        console: 'var(--color-console)',
        'console-2': 'var(--color-console-2)',
        'console-3': 'var(--color-console-3)',

        // Text
        ink: 'var(--color-ink)',
        'ink-2': 'var(--color-ink-2)',
        muted: 'var(--color-muted)',
        inverse: 'var(--color-inverse)',
        'inverse-2': 'var(--color-inverse-2)',

        // Borders
        line: 'var(--color-line)',
        'line-strong': 'var(--color-line-strong)',

        // Brand — Signal (primary)
        signal: {
          DEFAULT: 'var(--color-signal)',
          hover: 'var(--color-signal-hover)',
          soft: 'var(--color-signal-soft)',
          ink: 'var(--color-signal-ink)',
        },

        // Brand — Operator (secondary accent, warm bridge)
        operator: {
          DEFAULT: 'var(--color-operator)',
          soft: 'var(--color-operator-soft)',
          ink: 'var(--color-operator-ink)',
        },

        // Semantic
        ok: { DEFAULT: 'var(--color-ok)', soft: 'var(--color-ok-soft)' },
        warn: { DEFAULT: 'var(--color-warn)', soft: 'var(--color-warn-soft)' },
        err: { DEFAULT: 'var(--color-err)', soft: 'var(--color-err-soft)' },

        // Legacy aliases (keep for inline references)
        accent: 'var(--color-signal)',
        'accent-2': 'var(--color-ok)',
        'accent-3': 'var(--color-signal)',
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
