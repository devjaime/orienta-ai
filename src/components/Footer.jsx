import { ArrowUpRight, Code2, Mail, Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { SITE_LINKS } from '../lib/siteLinks';
import { t, tx } from '../lib/i18n/translations';

const Footer = () => {
  const { lang } = useLanguage();

  return (
    <footer className="border-t border-aura-primary/10 bg-white">
      <div className="aura-container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aura-primary to-aura-violet font-display text-lg font-bold text-white">V</span>
            <span className="font-display text-xl font-bold text-aura-ink">Vocari</span>
          </Link>
          <p className="mt-5 max-w-md leading-7 text-aura-muted">{tx(t.refresh.footer.description, lang)}</p>
          <a href={SITE_LINKS.email} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-aura-primary hover:text-aura-violet">
            <Mail size={17} />
            hernandez.hs@gmail.com
          </a>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-aura-ink">{tx(t.refresh.footer.explore, lang)}</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-aura-muted">
            <Link to={SITE_LINKS.vocationalTest} className="hover:text-aura-primary">{tx(t.refresh.footer.test, lang)}</Link>
            <Link to={SITE_LINKS.futureLabor2030} className="hover:text-aura-primary">Futuro laboral 2030</Link>
            <a href={SITE_LINKS.careerTransition} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-aura-primary">
              {tx(t.refresh.footer.reconversion, lang)} <ArrowUpRight size={13} />
            </a>
            <a href={SITE_LINKS.skillGraph} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-aura-primary">
              Skill Graph <Route size={14} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-aura-ink">{tx(t.refresh.footer.project, lang)}</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-aura-muted">
            <a href={SITE_LINKS.repository} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-aura-primary">
              <Code2 size={15} /> {tx(t.refresh.footer.code, lang)}
            </a>
            <Link to="/privacidad" className="hover:text-aura-primary">{tx(t.refresh.footer.privacy, lang)}</Link>
            <Link to="/terminos" className="hover:text-aura-primary">{tx(t.refresh.footer.terms, lang)}</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-aura-primary/10">
        <div className="aura-container flex flex-col gap-2 py-6 text-xs text-aura-muted md:flex-row md:items-center md:justify-between">
          <p>{tx(t.refresh.footer.copyright, lang)}</p>
          <p>{tx(t.refresh.footer.transparency, lang)}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
