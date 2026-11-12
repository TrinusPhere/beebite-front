/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Escala Honey Gold / Âmbar da identidade visual BeeBite
        // Remapeia 'orange' para que todos os componentes existentes adotem o tom Mel/Âmbar da marca
        orange: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        beebite: {
          charcoal: '#272B30',
          honey: '#F59E0B',
          gold: '#FBBF24',
          comb: '#FEF3C7',
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
