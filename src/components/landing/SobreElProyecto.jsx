import { motion } from 'framer-motion';
import { Code2, Layers, Lightbulb, ExternalLink } from 'lucide-react';

const SobreElProyecto = () => {
  return (
    <section id="sobre-el-proyecto" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-2 mb-4">
            <Lightbulb size={16} className="text-indigo-600" />
            <span className="text-indigo-700 text-sm font-medium">Transparencia del proyecto</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-vocari-dark mb-4">
            Sobre el proyecto
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Este sitio web y la plataforma han sido desarrollados por <strong>Jaime Hernández</strong> como
            prototipo tecnológico y demostración de arquitectura de producto.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Code2 size={24} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-poppins font-bold text-vocari-dark mb-3">Prototipo técnico</h3>
            <p className="text-gray-600 leading-relaxed">
              Vocari es un prototipo funcional que demuestra cómo construir una plataforma completa de
              orientación vocacional: desde el test hasta los informes, dashboards y módulos de IA.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Layers size={24} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-poppins font-bold text-vocari-dark mb-3">Arquitectura de producto</h3>
            <p className="text-gray-600 leading-relaxed">
              Demuestra una arquitectura multi-tenant con roles (estudiante, orientador, apoderado, admin),
              integración con IA generativa y pipeline de datos reales del MINEDUC de Chile.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
              <Lightbulb size={24} className="text-amber-600" />
            </div>
            <h3 className="text-xl font-poppins font-bold text-vocari-dark mb-3">Exploración tecnológica</h3>
            <p className="text-gray-600 leading-relaxed">
              Construido para explorar tecnologías modernas: React 19, FastAPI, Supabase, Claude AI y
              algoritmos deterministas de orientación vocacional (método RIASEC).
            </p>
          </motion.div>
        </div>

        {/* Nota de transparencia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-4xl mx-auto text-center"
        >
          <p className="text-amber-800 font-medium mb-2">Nota de transparencia</p>
          <p className="text-amber-700 text-sm leading-relaxed">
            La plataforma se encuentra en fase de exploración técnica y se presenta únicamente como
            demostración funcional. No está operando comercialmente. Los datos de ejemplo son ficticios o
            provienen de fuentes públicas del MINEDUC.
          </p>
          <a
            href="https://github.com/devjaime/orienta-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-amber-800 hover:text-amber-900 font-medium text-sm underline hover:no-underline transition-colors"
          >
            <Code2 size={14} />
            Ver código y documentación técnica
            <ExternalLink size={12} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default SobreElProyecto;
