import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { SITE_LINKS } from '../lib/siteLinks';
import { t, tx } from '../lib/i18n/translations';

export default function FAQ() {
  const { lang } = useLanguage();
  const faqs = [
    [tx(t.refresh.faq.q1, lang), tx(t.refresh.faq.a1, lang)],
    [tx(t.refresh.faq.q2, lang), tx(t.refresh.faq.a2, lang)],
    [tx(t.refresh.faq.q3, lang), tx(t.refresh.faq.a3, lang)],
    [tx(t.refresh.faq.q4, lang), tx(t.refresh.faq.a4, lang)],
    [tx(t.refresh.faq.q5, lang), tx(t.refresh.faq.a5, lang)],
  ];

  return (
    <section className="aura-section">
      <div className="aura-container">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="aura-kicker">FAQ</span>
            <h2 className="aura-heading mt-5">{tx(t.refresh.faq.title, lang)}</h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group aura-glass overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 font-display font-semibold text-aura-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20 md:p-6">
                  {question}
                  <ChevronDown size={20} className="flex-none text-aura-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 leading-7 text-aura-muted md:px-6 md:pb-6">{answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-aura-muted">
            {tx(t.refresh.faq.contact, lang)}{' '}
            <a href={SITE_LINKS.email} className="font-semibold text-aura-primary hover:text-aura-violet">hernandez.hs@gmail.com</a>
          </p>
        </div>
      </div>
    </section>
  );
}
