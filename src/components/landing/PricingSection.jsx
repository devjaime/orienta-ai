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
      { icon: BarChart3, text: 'Análisis RIASEC detallado' },
      { icon: GraduationCap, text: 'Carreras recomendadas con datos reales MINEDUC' },
      { icon: UserCheck, text: 'Revisado por orientadores calificados' }
    ],
    cta: 'Obtener Informe',
    ctaStyle: 'bg-white/10 border border-orienta-blue text-orienta-blue hover:bg-orienta-blue hover:text-white'
  },
  {
    name: 'premium',
    displayName: 'Plan Premium',
    price: '14.990',
    highlighted: true,
    features: [
      { icon: FileText, text: 'Informe PDF completo' },
      { icon: BarChart3, text: 'Análisis RIASEC detallado' },
      { icon: GraduationCap, text: 'Carreras recomendadas con datos reales MINEDUC' },
      { icon: UserCheck, text: 'Revisado por orientadores calificados' },
      { icon: Presentation, text: 'Explicación visual personalizada' },
      { icon: Sparkles, text: 'Resumen ejecutivo animado' }
    ],
    cta: 'Obtener Informe Premium',
    ctaStyle: 'bg-orienta-blue text-white hover:bg-blue-400'
  }
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="informes" className="section-padding bg-orienta-dark">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-white mb-6">
            Informes Vocacionales Profesionales
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Basados en datos oficiales del MINEDUC, método científico RIASEC y revisados
            por orientadores calificados. La guía vocacional más completa de Chile.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-white/10 backdrop-blur-sm border-2 border-orienta-blue'
                  : 'bg-white/5 backdrop-blur-sm border border-white/20'
              }`}
            >
              {/* Badge Recomendado */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 bg-orienta-blue text-white text-sm font-semibold px-4 py-1 rounded-full">
                    <Star size={14} className="fill-current" />
                    Recomendado
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-2xl font-poppins font-bold text-white mb-2">
                {plan.displayName}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold text-orienta-blue">${plan.price}</span>
                <span className="text-white/60 text-sm">CLP</span>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orienta-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-orienta-blue" />
                    </div>
                    <span className="text-white/80">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => navigate('/informes')}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${plan.ctaStyle}`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center text-white/40 text-sm mt-8"
        >
          Primero completa el Test RIASEC gratuito para obtener tu informe personalizado.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
