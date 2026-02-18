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
          'primary': '#0B1A33',   // Navy - confiable e institucional
          'light': '#12264F',     // Navy claro - apoyo
          'accent': '#D4AF37',    // Dorado - premium, acciones importantes
          'bg': '#FFFFFF',        // Blanco
          'bg-warm': '#F4F1E8',   // Blanco cálido para secciones
          'dark': '#0B1A33',       // Navy para textos
          'light-text': '#FFFFFF', // Texto blanco para botones navy
          'dark-text': '#0B1A33',  // Texto navy para botones dorados
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
