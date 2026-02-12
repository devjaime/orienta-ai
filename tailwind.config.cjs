/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vocari': {
          'primary': '#4F46E5',    // Indigo - educativo, confiable
          'accent': '#F59E0B',     // Amber - energetico, juvenil
          'bg': '#FAFAF9',         // Stone-50 - fondo calido
          'b2b': '#0D9488',        // Teal - flujo institucional
          'dark': '#1E1B4B',       // Indigo-950 - textos/acentos oscuros
        },
        'riasec': {
          'R': '#EF4444',          // Rojo - Realista
          'I': '#3B82F6',          // Azul - Investigador
          'A': '#8B5CF6',          // Violeta - Artistico
          'S': '#10B981',          // Esmeralda - Social
          'E': '#F59E0B',          // Ambar - Emprendedor
          'C': '#4F46E5',          // Indigo - Convencional
        },
        // Mantener colores legacy para compatibilidad gradual
        'orienta': {
          'dark': '#0C1E3C',
          'blue': '#33B5E5',
          'light': '#F5F7FA',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'slide-in': 'slideIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
