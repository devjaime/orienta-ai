import { motion } from 'framer-motion';
import { ArrowDown, Compass, Brain, Heart } from 'lucide-react';

const Hero = () => {
  const scrollToNext = () => {
    document.getElementById('problema').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-orienta-dark relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-orienta-blue rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-orienta-blue rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-orienta-blue rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-poppins font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Brújula:
              <span className="block text-orienta-blue">Orientación Vocacional</span>
              <span className="block text-2xl md:text-3xl lg:text-4xl mt-4">con IA</span>
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Descubre tu camino con inteligencia y humanidad
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button className="btn-primary text-lg px-10 py-4">
                Explorar Plataforma
              </button>
              <button 
                onClick={scrollToNext}
                className="btn-secondary text-lg px-10 py-4 flex items-center justify-center gap-2"
              >
                Conoce Más
                <ArrowDown size={20} />
              </button>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap justify-center lg:justify-start gap-6 mt-12"
            >
              <div className="flex items-center gap-2 text-white/70">
                <Brain size={20} className="text-orienta-blue" />
                <span>IA Avanzada</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Heart size={20} className="text-orienta-blue" />
                <span>Enfoque Humano</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Compass size={20} className="text-orienta-blue" />
                <span>Orientación Personalizada</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative z-10">
              <svg
                viewBox="0 0 400 400"
                className="w-full h-auto max-w-md mx-auto"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background Circle */}
                <circle cx="200" cy="200" r="180" fill="url(#gradient1)" opacity="0.1" />
                
                {/* Compass Base */}
                <circle cx="200" cy="200" r="120" fill="#33B5E5" opacity="0.2" />
                <circle cx="200" cy="200" r="100" fill="#33B5E5" opacity="0.3" />
                
                {/* Compass Needle */}
                <g transform="rotate(45 200 200)">
                  <path d="M200 120 L220 200 L200 280 L180 200 Z" fill="#33B5E5" />
                  <path d="M200 120 L180 200 L200 280 L220 200 Z" fill="#0C1E3C" />
                </g>
                
                {/* Center Point */}
                <circle cx="200" cy="200" r="8" fill="#FFFFFF" />
                
                {/* Direction Labels */}
                <text x="200" y="80" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold">N</text>
                <text x="200" y="320" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold">S</text>
                <text x="80" y="200" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold">O</text>
                <text x="320" y="200" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold">E</text>
                
                {/* Floating Elements */}
                <circle cx="150" cy="150" r="4" fill="#33B5E5" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="250" cy="250" r="3" fill="#33B5E5" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="180" cy="280" r="5" fill="#33B5E5" opacity="0.5">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
                </circle>
                
                {/* Gradient Definitions */}
                <defs>
                  <radialGradient id="gradient1" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#33B5E5" />
                    <stop offset="100%" stopColor="#0C1E3C" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            
            {/* Floating Icons */}
            <motion.div
              className="absolute top-10 right-10 bg-white/10 backdrop-blur-sm rounded-full p-3"
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Brain size={24} className="text-orienta-blue" />
            </motion.div>
            
            <motion.div
              className="absolute bottom-10 left-10 bg-white/10 backdrop-blur-sm rounded-full p-3"
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Heart size={24} className="text-orienta-blue" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <button 
          onClick={scrollToNext}
          className="text-white/60 hover:text-orienta-blue transition-colors duration-300"
        >
          <ArrowDown size={24} />
        </button>
      </motion.div>
    </section>
  );
};

export default Hero; 