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
        brand: {
          bg: '#0A2540',
          cyan: '#00D4AA',
          volt: '#E8FF47',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
      },
      boxShadow: {
        'cyan-glow': '0 0 40px rgba(0, 212, 170, 0.15)',
        'volt-glow': '0 0 40px rgba(232, 255, 71, 0.20)',
        'cyan-sm': '0 4px 20px rgba(0, 212, 170, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
