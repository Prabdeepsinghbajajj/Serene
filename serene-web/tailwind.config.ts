import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* shadcn semantic tokens */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        /* Serene brand palette */
        cream: {
          DEFAULT: '#F5F0E8',
          2: '#EDE5D4',
          50: '#FDFBF7',
          100: '#F9F5EE',
          200: '#F0E9DA',
        },
        sage: {
          50: '#EEF5EB',
          100: '#E8EFE4',
          200: '#C9DBC2',
          300: '#8ABD80',
          400: '#87AA7E',
          500: '#4E7A44',
          600: '#4E7A44',
          700: '#2F5027',
          800: '#2C4827',
        },
        slate: {
          warm: '#4A4A45',
          muted: '#7A7A74',
          hint: '#ADADAA',
        },
        sky: {
          soft: '#EAF2F8',
          mid: '#A8C8E0',
          deep: '#4A8AB5',
        },
        amber: {
          warm: '#F2A65A',
          glow: '#E8845A',
          accent: '#D4883A',
        },
        'bg-primary': '#1A1A18',
        'bg-secondary': '#222220',
      },
      fontFamily: {
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      fontSize: {
        /* enforce 16px minimum body text per bible §6 */
        body: ['1rem', { lineHeight: '1.7' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        'screen-pad': '2rem', /* minimum screen padding per bible §6 */
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
