import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { fadeUp, scaleIn } from '../lib/animations';

const Hero = ({ onStartTest }) => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-amber-50/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-vocari-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-vocari-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="text-center lg:text-left"
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-poppins font-bold text-vocari-dark mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
            >
              Descubre la carrera
              <span className="block text-vocari-primary">que te hara feliz</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }}
            >
              Test vocacional basado en ciencia, datos reales del MINEDUC y orientacion
              profesional. Gratuito y en menos de 10 minutos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button
                onClick={onStartTest}
                className="btn-primary text-lg px-10 py-4 inline-flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                Descubre tu Vocacion
              </button>

              <a
                href="/colegios"
                className="text-vocari-primary hover:text-vocari-light text-base px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                Para colegios
                <ArrowRight size={18} />
              </a>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.8 }}
              className="flex flex-wrap justify-center lg:justify-start gap-6 mt-10 text-sm text-gray-500"
            >
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Test gratuito
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-vocari-primary rounded-full"></div>
                Metodo RIASEC
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-vocari-accent rounded-full"></div>
                Datos MINEDUC
              </span>
            </motion.div>
          </motion.div>

          {/* Illustration */}
          <motion.div
            {...scaleIn}
            className="relative hidden lg:block"
          >
            <div className="relative z-10">
              <svg
                viewBox="0 0 400 400"
                className="w-full h-auto max-w-md mx-auto"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="200" cy="200" r="180" fill="url(#gradient1)" opacity="0.08" />
                <circle cx="200" cy="200" r="120" fill="#0B1A33" opacity="0.12" />
                <circle cx="200" cy="200" r="100" fill="#0B1A33" opacity="0.18" />

                <g transform="rotate(45 200 200)">
                  <path d="M200 120 L220 200 L200 280 L180 200 Z" fill="#0B1A33" />
                  <path d="M200 120 L180 200 L200 280 L220 200 Z" fill="#0B1A33" />
                </g>

                <circle cx="200" cy="200" r="8" fill="#FFFFFF" />

                <text x="200" y="80" textAnchor="middle" fill="#0B1A33" fontSize="16" fontWeight="bold">N</text>
                <text x="200" y="330" textAnchor="middle" fill="#0B1A33" fontSize="16" fontWeight="bold">S</text>
                <text x="75" y="205" textAnchor="middle" fill="#0B1A33" fontSize="16" fontWeight="bold">O</text>
                <text x="325" y="205" textAnchor="middle" fill="#0B1A33" fontSize="16" fontWeight="bold">E</text>

                <circle cx="150" cy="150" r="4" fill="#D4AF37" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="250" cy="250" r="3" fill="#0B1A33" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="280" cy="140" r="5" fill="#D4AF37" opacity="0.5">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
                </circle>

                <defs>
                  <radialGradient id="gradient1" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#0B1A33" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </radialGradient>
                </defs>
              </svg>
            </div>

            <motion.div
              className="absolute top-10 right-10 bg-white shadow-lg rounded-2xl p-3"
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Compass size={24} className="text-vocari-primary" />
            </motion.div>

            <motion.div
              className="absolute bottom-16 left-10 bg-white shadow-lg rounded-2xl p-3"
              animate={{ y: [8, -8, 8] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Sparkles size={24} className="text-vocari-accent" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
