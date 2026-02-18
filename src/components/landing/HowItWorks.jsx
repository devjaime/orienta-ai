import { motion } from 'framer-motion';
import { CheckCircle, Download, FileCheck, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: FileCheck,
    title: "1. Responde el test",
    description: "15-20 minutos respondiendo preguntas sobre tus intereses, habilidades y preferencias.",
    color: "bg-blue-500"
  },
  {
    icon: Sparkles,
    title: "2. Obtén tus resultados",
    description: "Recibe tu perfil RIASEC y las 10 carreras más compatibles con tu perfil.",
    color: "bg-purple-500"
  },
  {
    icon: CheckCircle,
    title: "3. Compra tu informe",
    description: "Informe profesional PDF con datos reales de empleabilidad y revisión por orientador.",
    color: "bg-green-500"
  },
  {
    icon: Download,
    title: "4. Descarga y decide",
    description: "PDF descargable con guía completa para tomar la mejor decisión de carrera.",
    color: "bg-amber-500"
  }
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-vocari-dark mb-4">
            En solo 4 pasos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Del test al informe profesional en menos de 24 horas
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow text-center h-full">
                <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <step.icon size={28} className="text-white" />
                </div>
                <h3 className="font-bold text-vocari-dark mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <span className="text-gray-300 text-2xl">→</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 mb-4">
            🎯 <strong>1000+ estudiantes</strong> ya encontraron su camino
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
