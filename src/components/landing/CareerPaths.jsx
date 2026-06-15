import { motion as Motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, GraduationCap, Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { SITE_LINKS } from '../../lib/siteLinks';
import { t, tx } from '../../lib/i18n/translations';

const CareerPaths = () => {
  const { lang } = useLanguage();

  const paths = [
    {
      icon: GraduationCap,
      eyebrow: tx(t.refresh.paths.studentEyebrow, lang),
      title: tx(t.refresh.paths.studentTitle, lang),
      description: tx(t.refresh.paths.studentDescription, lang),
      details: [
        tx(t.refresh.paths.studentDetail1, lang),
        tx(t.refresh.paths.studentDetail2, lang),
        tx(t.refresh.paths.studentDetail3, lang),
      ],
      action: (
        <Link className="aura-button-primary" to={SITE_LINKS.vocationalTest}>
          {tx(t.refresh.paths.studentCta, lang)}
          <ArrowRight size={18} />
        </Link>
      ),
      accent: 'from-aura-primary/15 to-aura-teal/10',
      iconClass: 'bg-aura-primary text-white',
    },
    {
      icon: BrainCircuit,
      eyebrow: tx(t.refresh.paths.professionalEyebrow, lang),
      title: tx(t.refresh.paths.professionalTitle, lang),
      description: tx(t.refresh.paths.professionalDescription, lang),
      details: [
        tx(t.refresh.paths.professionalDetail1, lang),
        tx(t.refresh.paths.professionalDetail2, lang),
        tx(t.refresh.paths.professionalDetail3, lang),
      ],
      action: (
        <a className="aura-button-secondary" href="#skill-graph">
          {tx(t.refresh.paths.professionalCta, lang)}
          <Route size={18} />
        </a>
      ),
      accent: 'from-aura-violet/15 to-aura-teal/10',
      iconClass: 'bg-gradient-to-br from-aura-violet to-aura-teal text-white',
    },
  ];

  return (
    <section id="caminos" className="aura-section bg-white/50">
      <div className="aura-container">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="aura-kicker">{tx(t.refresh.paths.kicker, lang)}</span>
          <h2 className="aura-heading mt-5">{tx(t.refresh.paths.title, lang)}</h2>
          <p className="aura-copy mx-auto mt-5">{tx(t.refresh.paths.subtitle, lang)}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {paths.map((path, index) => (
            <Motion.article
              key={path.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={`aura-glass group relative overflow-hidden p-7 md:p-9 bg-gradient-to-br ${path.accent}`}
            >
              <div className="relative z-10">
                <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${path.iconClass}`}>
                  <path.icon size={26} />
                </div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-aura-primary">
                  {path.eyebrow}
                </p>
                <h3 className="font-display text-3xl font-bold tracking-tight text-aura-ink">
                  {path.title}
                </h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-aura-muted">
                  {path.description}
                </p>
                <ul className="my-7 space-y-3">
                  {path.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-3 text-sm text-aura-ink/80">
                      <span className="h-2 w-2 rounded-full bg-gradient-to-r from-aura-primary to-aura-teal" />
                      {detail}
                    </li>
                  ))}
                </ul>
                {path.action}
              </div>
            </Motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CareerPaths;
