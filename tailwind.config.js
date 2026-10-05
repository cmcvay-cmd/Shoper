/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        gold: { 400: '#facc15', 500: '#eab308', 600: '#ca8a04' },
      }
    },
  },
  plugins: [],
}