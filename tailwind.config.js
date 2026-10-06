/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fbf8f1',
          100: '#f5edd8',
          200: '#ead9b0',
          300: '#dbc07e',
          400: '#cfa45a',
          500: '#c08b3f',
          600: '#a86f34',
          700: '#8a552e',
          800: '#71452b',
          900: '#5d3a26',
        },
        dark: {
          900: '#0a0a0a',
          850: '#111111',
          800: '#161616',
          750: '#1c1c1c',
          700: '#242424',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-sm': '0 0 0 1px rgba(192, 139, 63, 0.3)',
        'gold': '0 0 20px -5px rgba(192, 139, 63, 0.35)',
        'gold-lg': '0 0 40px -10px rgba(192, 139, 63, 0.4)',
      }
    },
  },
  plugins: [],
}

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
      // ... rest of your config
    },
  },
  plugins: [],
}
