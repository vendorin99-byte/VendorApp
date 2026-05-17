import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B5BDB',
        'primary-dark': '#2F4AC5',
      },
    },
  },
  plugins: [],
} satisfies Config
