/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#f97316',
        },
        slate: {
          900: '#0f172a',
          950: '#020617',
        }
      }
    },
  },
  plugins: [],
}
