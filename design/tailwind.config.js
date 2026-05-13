/**
 * Firmcraft — Operator visual identity Tailwind extensions.
 *
 * Reference snippet. The live config lives at /tailwind.config.ts and merges
 * these values. Edit both together when changing palette / type scale.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
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
        signal: {
          DEFAULT: '#2C6BF0',
          ink: '#1E4FBC',
        },
        orange: '#FB7C50',
        positive: '#10B981',

        // Legacy aliases — keep utility classes working during the refresh.
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
      boxShadow: {
        lift: '0 12px 22px -16px rgba(15, 23, 42, 0.18)',
        'lift-lg': '0 24px 48px -28px rgba(15, 23, 42, 0.22)',
        'signal-glow': '0 0 40px rgba(44, 107, 240, 0.18)',
      },
    },
  },
}
