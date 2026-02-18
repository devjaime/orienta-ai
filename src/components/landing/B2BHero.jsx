import { School, ArrowRight } from 'lucide-react';

const B2BHero = () => {
  return (
    <section className="min-h-[80vh] flex items-center bg-gradient-to-b from-teal-50 via-white to-vocari-bg relative overflow-hidden pt-20">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-vocari-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="w-20 h-20 bg-vocari-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8"
          >
            <School size={40} className="text-vocari-primary" />
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-poppins font-bold text-vocari-dark mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
          >
            Orientacion vocacional
            <span className="block text-vocari-primary">para tu colegio</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }}
          >
            Plataforma completa para orientadores y colegios. Test vocacional RIASEC,
            dashboard de seguimiento, importacion masiva de estudiantes y codigos de activacion.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="mailto:hola@vocari.com?subject=Demo Vocari para Colegio"
              className="bg-vocari-primary text-white px-10 py-4 rounded-2xl font-semibold hover:bg-teal-700 transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-2 text-lg"
            >
              Solicitar Demo
              <ArrowRight size={20} />
            </a>
            <a
              href="/"
              className="text-gray-600 hover:text-vocari-dark px-6 py-4 font-medium transition-colors text-center"
            >
              Volver al inicio
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default B2BHero;
