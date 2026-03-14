import { useLanguage } from '../lib/i18n/LanguageContext';
import { t, tx } from '../lib/i18n/translations';

export default function FAQ() {
  const { lang } = useLanguage();
  const faqs = [
    { question: tx(t.faq.q1q, lang), answer: tx(t.faq.q1a, lang) },
    { question: tx(t.faq.q2q, lang), answer: tx(t.faq.q2a, lang) },
    { question: tx(t.faq.q3q, lang), answer: tx(t.faq.q3a, lang) },
    { question: tx(t.faq.q4q, lang), answer: tx(t.faq.q4a, lang) },
    { question: tx(t.faq.q5q, lang), answer: tx(t.faq.q5a, lang) },
    { question: tx(t.faq.q6q, lang), answer: tx(t.faq.q6a, lang) },
  ];

  return (
    <section className="py-16 bg-vocari-bg">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-poppins font-bold text-vocari-dark text-center mb-8">
          {tx(t.faq.title, lang)}
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details 
              key={index}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm open:shadow-md transition-shadow"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-vocari-dark list-none">
                {faq.question}
                <span className="text-vocari-primary transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="px-5 pb-5 text-gray-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {tx(t.faq.otherQ, lang)}{' '}
            <a
              href="mailto:hernandez.hs@gmail.com"
              className="text-vocari-primary hover:underline font-medium"
            >
              {tx(t.faq.chatUs, lang)}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
