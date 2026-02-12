import { motion } from 'framer-motion';
import { ClipboardCheck, UserCircle, GraduationCap } from 'lucide-react';

const steps = [
  {
    icon: ClipboardCheck,
    number: '01',
    title: 'Responde el Test',
    description: '30 preguntas basadas en el metodo cientifico RIASEC. Sin registro, gratuito y en menos de 10 minutos.',
    color: 'bg-vocari-primary'
  },
  {
    icon: UserCircle,
    number: '02',
    title: 'Conoce tu Perfil',
    description: 'Descubre tus fortalezas, intereses y tipo de personalidad vocacional con un analisis detallado.',
    color: 'bg-vocari-accent'
  },
  {
    icon: GraduationCap,
    number: '03',
    title: 'Explora Carreras',
    description: 'Recibe recomendaciones de carreras basadas en datos reales de matricula, empleo y saturacion del MINEDUC.',
    color: 'bg-emerald-500'
  }
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-vocari-dark mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tres pasos simples para descubrir tu vocacion
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mb-6`}>
                <step.icon size={28} className="text-white" />
              </div>

              <span className="text-5xl font-poppins font-bold text-gray-100 absolute top-6 right-8">
                {step.number}
              </span>

              <h3 className="text-xl font-poppins font-semibold text-vocari-dark mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
