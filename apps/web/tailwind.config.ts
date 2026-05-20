import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#3B5BDB',
        'primary-dark': '#2F4AC5',
        dark: '#0D0D1A',
        'dark-card': '#1A1A2E',
        'dark-border': '#2A2A4A',
      },
    },
  },
  plugins: [],
} satisfies Config
