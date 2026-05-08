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
        // Existing brand (home page legacy)
        brand: {
          bg: '#0A2540',
          cyan: '#00D4AA',
          volt: '#E8FF47',
        },
        // Firmcraft warm design system (design-spec)
        paper: '#FBF4EA',
        'paper-2': '#F4E9D6',
        ink: '#2D1F14',
        'ink-2': '#5A4533',
        muted: '#8A7560',
        accent: '#D97757',
        'accent-2': '#6B8E5A',
        'accent-3': '#3F7A8C',
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
        'cyan-glow': '0 0 40px rgba(0, 212, 170, 0.15)',
        'volt-glow': '0 0 40px rgba(232, 255, 71, 0.20)',
        'cyan-sm': '0 4px 20px rgba(0, 212, 170, 0.25)',
        'lift': '0 12px 22px -16px rgba(45, 31, 20, 0.18)',
        'lift-lg': '0 24px 48px -28px rgba(45, 31, 20, 0.22)',
      },
    },
  },
  plugins: [],
}

export default config
