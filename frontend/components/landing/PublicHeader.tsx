"use client";

import { AnimatePresence, motion as Motion } from "framer-motion";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { SITE_LINKS } from "@/lib/siteLinks";
import { refresh } from "@/lib/i18n/refresh";

const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const homePrefix = pathname === "/" ? "" : "/";
  const { user, isAuthenticated, initialize, logout } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const dashboardRoute = "/admin";

  const navItems = [
    { label: refresh.header.paths, href: `${homePrefix}#caminos` },
    { label: refresh.header.how, href: `${homePrefix}#como-funciona` },
    { label: "Skill Graph", href: `${homePrefix}#skill-graph` },
    { label: refresh.header.project, href: `${homePrefix}#proyecto` },
  ];

  return (
    <Motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/50 bg-white/75 backdrop-blur-2xl"
    >
      <div className="aura-container flex h-[4.5rem] items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aura-primary to-aura-violet font-display text-lg font-bold text-white shadow-lg shadow-aura-primary/20">
            V
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-aura-ink">
            Vocari
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label={refresh.header.navigationLabel}
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-aura-muted transition hover:text-aura-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aura-primary/20"
            >
              {item.label}
            </a>
          ))}
          <a
            href={SITE_LINKS.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-aura-muted transition hover:text-aura-primary"
          >
            {refresh.header.code}
            <ExternalLink size={13} />
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {user && isAuthenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href={dashboardRoute}
                className="aura-button-secondary !px-4 !py-2.5"
              >
                {refresh.header.dashboard}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-aura-muted hover:bg-aura-primary/5 hover:text-aura-primary"
                title={refresh.header.logout}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              href={SITE_LINKS.vocationalTest}
              className="aura-button-primary hidden !px-5 !py-2.5 md:inline-flex"
            >
              {refresh.header.cta}
            </Link>
          )}
          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-aura-ink lg:hidden"
            aria-label={refresh.header.menuLabel}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-aura-primary/10 bg-white/95 lg:hidden"
          >
            <nav
              className="aura-container flex flex-col gap-1 py-4"
              aria-label={refresh.header.mobileNavigationLabel}
            >
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-4 py-3 font-medium text-aura-muted hover:bg-aura-primary/5 hover:text-aura-primary"
                >
                  {item.label}
                </a>
              ))}
              <a
                href={SITE_LINKS.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-aura-muted hover:bg-aura-primary/5 hover:text-aura-primary"
              >
                {refresh.header.code} <ExternalLink size={15} />
              </a>
              <Link
                href={user && isAuthenticated ? dashboardRoute : SITE_LINKS.vocationalTest}
                onClick={() => setIsMenuOpen(false)}
                className="aura-button-primary mt-2"
              >
                {user && isAuthenticated
                  ? refresh.header.dashboard
                  : refresh.header.cta}
              </Link>
            </nav>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.header>
  );
};

export default PublicHeader;