/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#141414',
          700: '#1f1f1f',
          600: '#2a2a2a',
          500: '#3a3a3a',
        },
        gold: {
          300: '#f5d76e',
          400: '#e5c158',
          500: '#d4af37',
          600: '#c9a961',
          700: '#a8893f',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}