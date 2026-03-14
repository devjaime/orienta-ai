import { Check, FileText, BarChart3, GraduationCap, UserCheck, Presentation, Sparkles, Play, Code2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { t, tx } from '../../lib/i18n/translations';

const PricingSection = () => {
  const { lang } = useLanguage();
  const demoFeatures = [
    { icon: FileText, text: tx(t.pricing.f1, lang) },
    { icon: BarChart3, text: tx(t.pricing.f2, lang) },
    { icon: GraduationCap, text: tx(t.pricing.f3, lang) },
    { icon: UserCheck, text: tx(t.pricing.f4, lang) },
    { icon: Presentation, text: tx(t.pricing.f5, lang) },
    { icon: Sparkles, text: tx(t.pricing.f6, lang) }
  ];

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
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-4">
            <Code2 size={16} className="text-blue-600" />
            <span className="text-blue-700 text-sm font-medium">{tx(t.pricing.badge, lang)}</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-vocari-dark mb-6">
            {tx(t.pricing.title, lang)}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {tx(t.pricing.subtitle, lang)}
          </p>
        </motion.div>

        {/* Demo Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative rounded-2xl p-8 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border-2 border-vocari-primary">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1 bg-vocari-primary text-white text-sm font-semibold px-4 py-1 rounded-full">
                <Play size={14} className="fill-current" />
                {tx(t.pricing.demoBadge, lang)}
              </span>
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl font-black text-vocari-primary mb-1">{tx(t.pricing.free, lang)}</div>
              <span className="text-gray-400 text-sm block">{tx(t.pricing.freeNote, lang)}</span>
            </div>

            <ul className="space-y-4 mb-8">
              {demoFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-vocari-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-vocari-primary" />
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </li>
              ))}
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-blue-700 text-sm text-center font-medium">
                {tx(t.pricing.disclaimer, lang)}
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/test"
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 bg-vocari-primary text-white hover:bg-vocari-light flex items-center justify-center gap-2"
              >
                <Play size={18} />
                {tx(t.pricing.cta, lang)}
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Código fuente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <a
            href="https://github.com/devjaime/orienta-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-vocari-primary hover:text-vocari-light font-medium transition-colors underline hover:no-underline"
          >
            <Code2 size={18} />
            {tx(t.pricing.repoLink, lang)}
            <ExternalLink size={14} />
          </a>
        </motion.div>

        {/* Tech badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-vocari-primary">React 19</span>
            <span className="text-gray-500 text-sm">{tx(t.pricing.techFE, lang)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-vocari-primary">FastAPI</span>
            <span className="text-gray-500 text-sm">{tx(t.pricing.techBE, lang)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-vocari-primary">Supabase</span>
            <span className="text-gray-500 text-sm">{tx(t.pricing.techDB, lang)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-vocari-primary">Claude AI</span>
            <span className="text-gray-500 text-sm">{tx(t.pricing.techAI, lang)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
