import { motion } from 'framer-motion';
import { Check, Star, FileText, BarChart3, GraduationCap, UserCheck, Presentation, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'esencial',
    displayName: 'Plan Esencial',
    price: '10.990',
    highlighted: false,
    features: [
      { icon: FileText, text: 'Informe PDF completo' },
      { icon: BarChart3, text: 'Analisis RIASEC detallado' },
      { icon: GraduationCap, text: 'Carreras recomendadas con datos reales MINEDUC' },
      { icon: UserCheck, text: 'Revisado por orientadores calificados' }
    ],
    cta: 'Obtener Informe',
    ctaStyle: 'bg-vocari-primary/10 border border-vocari-primary text-vocari-primary hover:bg-vocari-primary hover:text-white'
  },
  {
    name: 'premium',
    displayName: 'Plan Premium',
    price: '14.990',
    highlighted: true,
    features: [
      { icon: FileText, text: 'Informe PDF completo' },
      { icon: BarChart3, text: 'Analisis RIASEC detallado' },
      { icon: GraduationCap, text: 'Carreras recomendadas con datos reales MINEDUC' },
      { icon: UserCheck, text: 'Revisado por orientadores calificados' },
      { icon: Presentation, text: 'Explicacion visual personalizada' },
      { icon: Sparkles, text: 'Resumen ejecutivo animado' }
    ],
    cta: 'Obtener Informe Premium',
    ctaStyle: 'bg-vocari-primary text-white hover:bg-vocari-light'
  }
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="informes" className="section-padding bg-vocari-bg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-vocari-dark mb-6">
            Informes Vocacionales Profesionales
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Basados en datos oficiales del MINEDUC, metodo cientifico RIASEC y revisados
            por orientadores calificados. La guia vocacional mas completa de Chile.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className={`relative rounded-2xl p-8 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 ${
                plan.highlighted
                  ? 'border-2 border-vocari-primary'
                  : 'border border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 bg-vocari-primary text-white text-sm font-semibold px-4 py-1 rounded-full">
                    <Star size={14} className="fill-current" />
                    Recomendado
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-poppins font-bold text-vocari-dark mb-2">
                {plan.displayName}
              </h3>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold text-vocari-primary">${plan.price}</span>
                <span className="text-gray-500 text-sm">CLP</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-vocari-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-vocari-primary" />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/informes')}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${plan.ctaStyle}`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center text-gray-400 text-sm mt-8"
        >
          Primero completa el Test RIASEC gratuito para obtener tu informe personalizado.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
