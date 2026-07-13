import Link from "next/link";
import { ArrowUpRight, Code2, Mail, Route } from "lucide-react";
import { SITE_LINKS } from "@/lib/siteLinks";
import { refresh } from "@/lib/i18n/refresh";

const PublicFooter = () => {
  return (
    <footer className="border-t border-aura-primary/10 bg-white">
      <div className="aura-container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aura-primary to-aura-violet font-display text-lg font-bold text-white">
              V
            </span>
            <span className="font-display text-xl font-bold text-aura-ink">
              Vocari
            </span>
          </Link>
          <p className="mt-5 max-w-md leading-7 text-aura-muted">
            {refresh.footer.description}
          </p>
          <a
            href={SITE_LINKS.email}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-aura-primary hover:text-aura-violet"
          >
            <Mail size={17} />
            hernandez.hs@gmail.com
          </a>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-aura-ink">
            {refresh.footer.explore}
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-aura-muted">
            <Link
              href={SITE_LINKS.vocationalTest}
              className="hover:text-aura-primary"
            >
              {refresh.footer.test}
            </Link>
            <Link
              href={SITE_LINKS.careerTransition}
              className="inline-flex items-center gap-1 hover:text-aura-primary"
            >
              {refresh.footer.reconversion} <ArrowUpRight size={13} />
            </Link>
            <a
              href={SITE_LINKS.skillGraph}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-aura-primary"
            >
              Skill Graph <Route size={14} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-aura-ink">
            {refresh.footer.project}
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-aura-muted">
            <a
              href={SITE_LINKS.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-aura-primary"
            >
              <Code2 size={15} /> {refresh.footer.code}
            </a>
            <Link href="/privacidad" className="hover:text-aura-primary">
              {refresh.footer.privacy}
            </Link>
            <Link href="/terminos" className="hover:text-aura-primary">
              {refresh.footer.terms}
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-aura-primary/10">
        <div className="aura-container flex flex-col gap-2 py-6 text-xs text-aura-muted md:flex-row md:items-center md:justify-between">
          <p>{refresh.footer.copyright}</p>
          <p>{refresh.footer.transparency}</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;