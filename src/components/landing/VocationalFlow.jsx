import { motion as Motion } from 'framer-motion';
import { ArrowRight, BarChart3, ClipboardCheck, Database, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { SITE_LINKS } from '../../lib/siteLinks';
import { t, tx } from '../../lib/i18n/translations';

const VocationalFlow = () => {
  const { lang } = useLanguage();
  const steps = [
    { icon: ClipboardCheck, title: tx(t.refresh.flow.step1Title, lang), description: tx(t.refresh.flow.step1Description, lang) },
    { icon: Database, title: tx(t.refresh.flow.step2Title, lang), description: tx(t.refresh.flow.step2Description, lang) },
    { icon: FileText, title: tx(t.refresh.flow.step3Title, lang), description: tx(t.refresh.flow.step3Description, lang) },
  ];

  return (
    <section id="como-funciona" className="aura-section relative overflow-hidden">
      <div className="aura-orb -left-40 top-20 h-96 w-96 bg-aura-teal/10" />
      <div className="aura-container relative">
        <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28">
            <span className="aura-kicker">{tx(t.refresh.flow.kicker, lang)}</span>
            <h2 className="aura-heading mt-5">{tx(t.refresh.flow.title, lang)}</h2>
            <p className="aura-copy mt-5">{tx(t.refresh.flow.subtitle, lang)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="aura-button-primary" to={SITE_LINKS.vocationalTest}>
                {tx(t.refresh.flow.primaryCta, lang)}
                <ArrowRight size={18} />
              </Link>
              <Link className="aura-button-ghost" to={SITE_LINKS.sampleReport}>
                <BarChart3 size={18} />
                {tx(t.refresh.flow.secondaryCta, lang)}
              </Link>
            </div>
          </div>

          <div className="relative space-y-4">
            <div className="absolute bottom-12 left-7 top-12 w-px bg-gradient-to-b from-aura-primary via-aura-violet to-aura-teal" />
            {steps.map((step, index) => (
              <Motion.article
                key={step.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="aura-glass relative flex gap-5 p-6 md:p-7"
              >
                <div className="relative z-10 flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-white text-aura-primary shadow-lg shadow-aura-primary/10">
                  <step.icon size={25} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-aura-primary/70">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-aura-ink">{step.title}</h3>
                  <p className="mt-2 leading-7 text-aura-muted">{step.description}</p>
                </div>
              </Motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VocationalFlow;
