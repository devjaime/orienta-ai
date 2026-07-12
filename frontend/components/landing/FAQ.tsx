import { ChevronDown } from "lucide-react";
import { SITE_LINKS } from "@/lib/siteLinks";
import { refresh } from "@/lib/i18n/refresh";

const FAQ_ITEMS: Array<[string, string]> = [
  [refresh.faq.q1, refresh.faq.a1],
  [refresh.faq.q2, refresh.faq.a2],
  [refresh.faq.q3, refresh.faq.a3],
  [refresh.faq.q4, refresh.faq.a4],
  [refresh.faq.q5, refresh.faq.a5],
];

export default function FAQ() {
  return (
    <section className="aura-section">
      <div className="aura-container">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="aura-kicker">FAQ</span>
            <h2 className="aura-heading mt-5">{refresh.faq.title}</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQ_ITEMS.map(([question, answer]) => (
              <details key={question} className="group aura-glass overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 font-display font-semibold text-aura-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20 md:p-6">
                  {question}
                  <ChevronDown
                    size={20}
                    className="flex-none text-aura-primary transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-5 pb-5 leading-7 text-aura-muted md:px-6 md:pb-6">
                  {answer}
                </p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-aura-muted">
            {refresh.faq.contact}{" "}
            <a
              href={SITE_LINKS.email}
              className="font-semibold text-aura-primary hover:text-aura-violet"
            >
              hernandez.hs@gmail.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}