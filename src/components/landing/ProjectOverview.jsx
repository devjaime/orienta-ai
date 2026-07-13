import { motion as Motion } from 'framer-motion';
import { ArrowUpRight, Blocks, Code2, Database, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { SITE_LINKS } from '../../lib/siteLinks';
import { t, tx } from '../../lib/i18n/translations';

const ProjectOverview = () => {
  const { lang } = useLanguage();
  const cards = [
    { icon: Blocks, title: tx(t.refresh.project.card1Title, lang), description: tx(t.refresh.project.card1Description, lang) },
    { icon: Database, title: tx(t.refresh.project.card2Title, lang), description: tx(t.refresh.project.card2Description, lang) },
    { icon: ShieldCheck, title: tx(t.refresh.project.card3Title, lang), description: tx(t.refresh.project.card3Description, lang) },
  ];

  return (
    <section id="proyecto" className="aura-section bg-white/60">
      <div className="aura-container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="aura-kicker">{tx(t.refresh.project.kicker, lang)}</span>
          <h2 className="aura-heading mt-5">{tx(t.refresh.project.title, lang)}</h2>
          <p className="aura-copy mx-auto mt-5">{tx(t.refresh.project.subtitle, lang)}</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => (
            <Motion.article
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="aura-glass p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
                <card.icon size={22} />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-aura-ink">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-aura-muted">{card.description}</p>
            </Motion.article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {['React 19', 'Vite 7', 'Next.js', 'FastAPI', 'Supabase', 'RIASEC'].map((tech) => (
            <span key={tech} className="rounded-full border border-aura-primary/10 bg-white px-4 py-2 text-xs font-semibold text-aura-muted shadow-sm">
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-9 text-center">
          <a href={SITE_LINKS.repository} target="_blank" rel="noopener noreferrer" className="aura-button-ghost">
            <Code2 size={18} />
            {tx(t.refresh.project.cta, lang)}
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProjectOverview;
