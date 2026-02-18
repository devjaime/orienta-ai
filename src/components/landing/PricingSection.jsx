import { motion } from 'framer-motion';
import { Check, Star, FileText, BarChart3, GraduationCap, UserCheck, Presentation, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'esencial',
    displayName: 'Plan Esencial',
    priceUSD: '12',
    priceCLP: '10.990',
    priceSubtitle: '~$12 USD',
    highlighted: false,
    features: [
      { icon: FileText, text: 'Informe PDF completo de 10+ páginas' },
      { icon: BarChart3, text: 'Análisis RIASEC detallado con gráficos' },
      { icon: GraduationCap, text: '10 carreras recomendadas (datos MINEDUC 2025)' },
      { icon: UserCheck, text: 'Revisión por orientador certificado' }
    ],
    guarantee: 'Garantía: Revisión ilimitada hasta que quedes satisfecho',
    cta: 'Comprar Ahora - $12 USD',
    ctaStyle: 'bg-vocari-primary/10 border border-vocari-primary text-vocari-primary hover:bg-vocari-primary hover:text-white'
  },
  {
    name: 'premium',
    displayName: 'Plan Premium',
    priceUSD: '20',
    priceCLP: '14.990',
    priceSubtitle: '~$20 USD',
    highlighted: true,
    features: [
      { icon: FileText, text: 'Informe PDF completo de 15+ páginas' },
      { icon: BarChart3, text: 'Análisis RIASEC con visuales interactivas' },
      { icon: GraduationCap, text: '20 carreras recomendadas + proyección laboral' },
      { icon: UserCheck, text: 'Revisión prioritaria por orientador' },
      { icon: Presentation, text: 'Video-explicación personalizada (15 min)' },
      { icon: Sparkles, text: 'Resumen ejecutivo en video animado' }
    ],
    guarantee: 'Incluye sesión de seguimiento de 30 min gratis',
    cta: 'Comprar Premium - $20 USD',
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

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-black text-vocari-primary">${plan.priceUSD}</span>
                <span className="text-gray-400 text-lg">USD</span>
              </div>
              <span className="text-gray-400 text-sm mb-6 block">{plan.priceSubtitle}</span>

              <ul className="space-y-4 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-vocari-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-vocari-primary" />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {/* Garantía */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                <p className="text-green-700 text-sm text-center font-medium">
                  ✅ {plan.guarantee}
                </p>
              </div>

              <button
                onClick={() => window.open(plan.name === 'premium' ? 'https://www.paypal.com/ncp/payment/4CB6YZZS7G5VQ' : 'https://www.paypal.com/ncp/payment/DCEGNNL4FVNHA', '_blank')}
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

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-vocari-primary">1000+</span>
            <span className="text-gray-500 text-sm">Estudiantes</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-vocari-primary">50+</span>
            <span className="text-gray-500 text-sm">Orientadores</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-vocari-primary">4.8</span>
            <span className="text-gray-500 text-sm">⭐⭐⭐⭐⭐ Valoración</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-vocari-primary">100%</span>
            <span className="text-gray-500 text-sm">Datos MINEDUC</span>
          </div>
        </div>

        {/* Payment methods */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm mb-3">Pagos seguros con</p>
          <div className="flex justify-center items-center gap-4">
            <span className="text-2xl">💳</span>
            <span className="font-bold text-gray-600">PayPal</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">Tu dinero está protegido</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
