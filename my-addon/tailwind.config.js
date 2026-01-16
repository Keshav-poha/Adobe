/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,tsx,ts,jsx,js}",
  ],
  theme: {
    extend: {
      colors: {
        'adobe-dark': '#222222',
        'adobe-yellow': '#FFD500',
      },
    },
  },
  plugins: [],
}
