import { motion } from 'framer-motion';
import { Monitor, Server, Database, Puzzle, Users, ArrowRight, Code2, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { t, tx } from '../../lib/i18n/translations';

const ArquitecturaSistema = () => {
  const { lang } = useLanguage();
  const layers = [
    {
      icon: Monitor,
      title: tx(t.arch.frontend, lang),
      color: 'blue',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      items: [
        'React 19 + Vite 7',
        'Tailwind CSS 3 + Framer Motion',
        'React Router v6 (rutas protegidas por rol)',
        'Lazy loading para módulos pesados',
        'Next.js (app de orientación — app.vocari.cl)'
      ]
    },
    {
      icon: Server,
      title: tx(t.arch.backend, lang),
      color: 'purple',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      items: [
        'FastAPI (Python) — API REST',
        'Algoritmo RIASEC determinista',
        'Motor de recomendación de carreras',
        'Pipeline de datos MINEDUC (scripts Node.js)',
        'Automatización de followups (D0/D7/D21)'
      ]
    },
    {
      icon: Database,
      title: tx(t.arch.database, lang),
      color: 'green',
      bg: 'bg-green-50',
      border: 'border-green-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      items: [
        'Supabase (PostgreSQL)',
        'Row Level Security (RLS) por rol',
        'Arquitectura multi-tenant (colegios)',
        'Auth con Google OAuth',
        'Storage para PDFs e informes'
      ]
    },
    {
      icon: Puzzle,
      title: tx(t.arch.external, lang),
      color: 'orange',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      items: [
        'Anthropic Claude API (IA generativa)',
        'Datos MINEDUC 2025 (matrículas y egresados)',
        'Vercel (hosting frontend)',
        'Railway / Render (hosting backend)',
        'Google OAuth (autenticación)'
      ]
    }
  ];

  const flujo = [
    { label: tx(t.arch.flow1l, lang), sub: tx(t.arch.flow1s, lang) },
    { label: tx(t.arch.flow2l, lang), sub: tx(t.arch.flow2s, lang) },
    { label: tx(t.arch.flow3l, lang), sub: tx(t.arch.flow3s, lang) },
    { label: tx(t.arch.flow4l, lang), sub: tx(t.arch.flow4s, lang) },
    { label: tx(t.arch.flow5l, lang), sub: tx(t.arch.flow5s, lang) }
  ];

  return (
    <section id="arquitectura" className="section-padding bg-vocari-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 mb-4">
            <Code2 size={16} className="text-gray-600" />
            <span className="text-gray-700 text-sm font-medium">{tx(t.arch.badge, lang)}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-vocari-dark mb-4">
            {tx(t.arch.title, lang)}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {tx(t.arch.subtitle, lang)}
          </p>
        </motion.div>

        {/* Capas */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {layers.map((layer, index) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-2xl p-6 border ${layer.bg} ${layer.border}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${layer.iconBg} rounded-xl flex items-center justify-center`}>
                  <layer.icon size={20} className={layer.iconColor} />
                </div>
                <h3 className="text-lg font-poppins font-bold text-vocari-dark">{layer.title}</h3>
              </div>
              <ul className="space-y-2">
                {layer.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${layer.iconBg.replace('50', '400')}`}></span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Flujo de usuarios */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-poppins font-bold text-vocari-dark">{tx(t.arch.flowTitle, lang)}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {flujo.map((paso, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 bg-vocari-bg rounded-xl px-4 py-3">
                    <span className="w-6 h-6 bg-vocari-primary text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-vocari-dark">{paso.label}</p>
                      <p className="text-xs text-gray-500">{paso.sub}</p>
                    </div>
                  </div>
                </div>
                {index < flujo.length - 1 && (
                  <ArrowRight size={16} className="text-gray-300 flex-shrink-0 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Enlace al repo */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <a
            href="https://github.com/devjaime/orienta-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-vocari-primary hover:text-vocari-light font-medium transition-colors text-sm underline hover:no-underline"
          >
            <Code2 size={16} />
            {tx(t.arch.repoLink, lang)}
            <ExternalLink size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ArquitecturaSistema;
