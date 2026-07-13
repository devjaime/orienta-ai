import { AnimatePresence, motion as Motion } from 'framer-motion';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser, signOut } from '../lib/supabase';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { SITE_LINKS } from '../lib/siteLinks';
import { t, tx } from '../lib/i18n/translations';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const { pathname } = useLocation();
  const { lang, toggle } = useLanguage();
  const homePrefix = pathname === '/' ? '' : '/';

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const { getUserProfile } = await import('../lib/supabase');
        const profile = await getUserProfile();
        setUserRole(profile?.role || 'user');
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const dashboardRoute = userRole === 'estudiante'
    ? '/dashboard'
    : userRole === 'orientador'
      ? '/orientador'
      : '/admin';

  const navItems = [
    { label: tx(t.refresh.header.paths, lang), href: `${homePrefix}#caminos` },
    { label: tx(t.refresh.header.how, lang), href: `${homePrefix}#como-funciona` },
    { label: 'Skill Graph', href: `${homePrefix}#skill-graph` },
    { label: 'Blog 2030', href: SITE_LINKS.futureLabor2030 },
    { label: tx(t.refresh.header.project, lang), href: `${homePrefix}#proyecto` },
  ];

  return (
    <Motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/50 bg-white/75 backdrop-blur-2xl"
    >
      <div className="aura-container flex h-[4.5rem] items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aura-primary to-aura-violet font-display text-lg font-bold text-white shadow-lg shadow-aura-primary/20">V</span>
          <span className="font-display text-xl font-bold tracking-tight text-aura-ink">Vocari</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label={tx(t.refresh.header.navigationLabel, lang)}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-aura-muted transition hover:text-aura-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20">
              {item.label}
            </a>
          ))}
          <a href={SITE_LINKS.repository} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-aura-muted transition hover:text-aura-primary">
            {tx(t.refresh.header.code, lang)}
            <ExternalLink size={13} />
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggle} className="rounded-lg px-3 py-2 text-sm font-semibold text-aura-muted transition hover:bg-aura-primary/5 hover:text-aura-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20" aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a español'}>
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link to={dashboardRoute} className="aura-button-secondary !px-4 !py-2.5">
                {tx(t.refresh.header.dashboard, lang)}
              </Link>
              <button onClick={handleLogout} className="rounded-lg p-2 text-aura-muted hover:bg-aura-primary/5 hover:text-aura-primary" title={tx(t.refresh.header.logout, lang)}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to={SITE_LINKS.vocationalTest} className="aura-button-primary hidden !px-5 !py-2.5 md:inline-flex">
              {tx(t.refresh.header.cta, lang)}
            </Link>
          )}
          <button onClick={() => setIsMenuOpen((open) => !open)} className="rounded-lg p-2 text-aura-ink lg:hidden" aria-label={tx(t.refresh.header.menuLabel, lang)} aria-expanded={isMenuOpen}>
            {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-aura-primary/10 bg-white/95 lg:hidden">
            <nav className="aura-container flex flex-col gap-1 py-4" aria-label={tx(t.refresh.header.mobileNavigationLabel, lang)}>
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="rounded-xl px-4 py-3 font-medium text-aura-muted hover:bg-aura-primary/5 hover:text-aura-primary">
                  {item.label}
                </a>
              ))}
              <a href={SITE_LINKS.repository} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-aura-muted hover:bg-aura-primary/5 hover:text-aura-primary">
                {tx(t.refresh.header.code, lang)} <ExternalLink size={15} />
              </a>
              <Link to={user ? dashboardRoute : SITE_LINKS.vocationalTest} onClick={() => setIsMenuOpen(false)} className="aura-button-primary mt-2">
                {user ? tx(t.refresh.header.dashboard, lang) : tx(t.refresh.header.cta, lang)}
              </Link>
            </nav>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.header>
  );
};

export default Header;
