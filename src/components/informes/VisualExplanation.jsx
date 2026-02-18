import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, BarChart3, Star, GraduationCap, Target, Rocket } from 'lucide-react';

const DIMENSION_NAMES = {
  R: 'Realista', I: 'Investigador', A: 'Artístico',
  S: 'Social', E: 'Emprendedor', C: 'Convencional'
};

const DIMENSION_COLORS = {
  R: '#ef4444', I: '#3b82f6', A: '#a855f7',
  S: '#22c55e', E: '#f59e0b', C: '#6b7280'
};

const VisualExplanation = ({ data, testSnapshot }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const visualData = data || {};
  const puntajes = testSnapshot?.puntajes || {};
  const codigoHolland = testSnapshot?.codigo_holland || '';

  // Build slides from available data
  const slides = buildSlides(visualData, puntajes, codigoHolland);

  useEffect(() => {
    let interval;
    if (isPlaying && slides.length > 1) {
      interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsPlaying(false);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  if (slides.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40">
          La explicación visual aún no está disponible.
        </p>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className="space-y-6">
      {/* Slide Container */}
      <div className="relative bg-white/5 border border-white/20 rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="p-8 md:p-12"
          >
            {/* Slide Icon */}
            <div className="w-16 h-16 bg-orienta-blue/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <slide.icon size={32} className="text-orienta-blue" />
            </div>

            {/* Slide Title */}
            <h2 className="text-2xl md:text-3xl font-poppins font-bold text-white text-center mb-6">
              {slide.title}
            </h2>

            {/* Slide Content */}
            <div className="max-w-2xl mx-auto">
              {slide.render()}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide number */}
        <div className="absolute top-4 right-4 text-white/30 text-sm">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prevSlide}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentSlide
                  ? 'bg-orienta-blue w-6'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
        >
          <ChevronRight size={20} />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-full transition-colors text-white ${
            isPlaying ? 'bg-orienta-blue' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
    </div>
  );
};

function buildSlides(visualData, puntajes, codigoHolland) {
  const slides = [];

  // Slide 1: Resumen del perfil
  slides.push({
    icon: BarChart3,
    title: 'Tu Perfil Vocacional',
    render: () => (
      <div className="text-center">
        <div className="text-6xl font-mono font-bold text-orienta-blue mb-4">
          {codigoHolland || '---'}
        </div>
        <p className="text-white/80 text-lg mb-6">
          {visualData.resumen_perfil || `Tu código Holland ${codigoHolland} representa una combinación única de intereses y habilidades.`}
        </p>
        {/* Mini bar chart */}
        <div className="flex items-end justify-center gap-3 h-40">
          {Object.entries(puntajes).map(([dim, score]) => (
            <div key={dim} className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(score / 30) * 120}px` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="w-10 rounded-t-lg"
                style={{ backgroundColor: DIMENSION_COLORS[dim] || '#33B5E5' }}
              />
              <span className="text-white/60 text-xs">{dim}</span>
            </div>
          ))}
        </div>
      </div>
    )
  });

  // Slide 2: Fortalezas
  slides.push({
    icon: Star,
    title: 'Tus Fortalezas',
    render: () => {
      const fortalezas = visualData.fortalezas || getDefaultFortalezas(codigoHolland);
      return (
        <div className="space-y-4">
          {fortalezas.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="flex items-center gap-4 bg-white/5 rounded-xl p-4"
            >
              <div className="w-10 h-10 bg-orienta-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Star size={18} className="text-orienta-blue" />
              </div>
              <p className="text-white/80">{f}</p>
            </motion.div>
          ))}
        </div>
      );
    }
  });

  // Slide 3: Top 3 carreras
  slides.push({
    icon: GraduationCap,
    title: 'Carreras Recomendadas',
    render: () => {
      const carreras = visualData.top_carreras || ['Explorar carreras basadas en tu perfil'];
      return (
        <div className="space-y-4">
          {carreras.slice(0, 3).map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.2 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                i === 1 ? 'bg-gray-300/20 text-gray-300' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                <span className="font-bold text-lg">#{i + 1}</span>
              </div>
              <span className="text-white text-lg font-medium">{typeof c === 'string' ? c : c.nombre || c.name}</span>
            </motion.div>
          ))}
        </div>
      );
    }
  });

  // Slide 4: Mapa de intereses
  slides.push({
    icon: Target,
    title: 'Mapa de Intereses',
    render: () => (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(puntajes).map(([dim, score]) => {
          const percentage = Math.round((score / 30) * 100);
          return (
            <motion.div
              key={dim}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
            >
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={DIMENSION_COLORS[dim] || '#33B5E5'}
                    strokeWidth="3"
                    strokeDasharray={`${percentage}, 100`}
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${percentage}, 100` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                  {percentage}%
                </span>
              </div>
              <p className="text-white/60 text-sm">{DIMENSION_NAMES[dim] || dim}</p>
            </motion.div>
          );
        })}
      </div>
    )
  });

  // Slide 5: Siguiente paso
  slides.push({
    icon: Rocket,
    title: 'Tu Siguiente Paso',
    render: () => (
      <div className="text-center">
        <p className="text-white/80 text-lg leading-relaxed mb-6">
          {visualData.siguiente_paso || 'Con tu perfil vocacional definido, el siguiente paso es explorar en detalle las carreras recomendadas y conversar con un orientador para definir tu camino profesional.'}
        </p>
        <div className="bg-gradient-to-r from-orienta-blue/20 to-purple-500/20 border border-orienta-blue/30 rounded-xl p-6">
          <p className="text-white font-semibold text-lg mb-2">
            Tu futuro comienza hoy
          </p>
          <p className="text-white/60">
            Revisa el informe completo para obtener todos los detalles de tu análisis vocacional.
          </p>
        </div>
      </div>
    )
  });

  return slides;
}

function getDefaultFortalezas(codigo) {
  const defaults = {
    R: 'Habilidades prácticas y técnicas',
    I: 'Pensamiento analítico y curiosidad científica',
    A: 'Creatividad y expresión artística',
    S: 'Empatía y habilidades interpersonales',
    E: 'Liderazgo y capacidad de persuasión',
    C: 'Organización y atención al detalle'
  };

  return (codigo || '').split('').slice(0, 3).map(d => defaults[d] || 'Habilidad destacada');
}

export default VisualExplanation;
