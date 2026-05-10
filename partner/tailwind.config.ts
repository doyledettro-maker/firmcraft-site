import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FBF4EA',
        'paper-2': '#F4E9D6',
        ink: '#2D1F14',
        'ink-2': '#5A4533',
        muted: '#8A7560',
        line: 'rgba(45, 31, 20, 0.12)',
        'line-2': 'rgba(45, 31, 20, 0.22)',
        // Partner portal flips the warm palette to green: sage-as-primary
        // (the brand's #6B8E5A) and a deeper forest for money emphasis.
        // Marketing site and admin keep terracotta.
        accent: '#6B8E5A',
        'accent-2': '#3D5A2C',
        'accent-3': '#3F7A8C',
        'money': '#2F4A22',
        'money-soft': '#E5EFDC',
        hi: '#F2D9A7',
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
        lift: '0 12px 22px -16px rgba(45, 31, 20, 0.18)',
        'lift-lg': '0 24px 48px -28px rgba(45, 31, 20, 0.22)',
      },
    },
  },
  plugins: [],
}

export default config
