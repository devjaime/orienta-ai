"use client";

import { motion as Motion } from "framer-motion";
import { ArrowRight, BrainCircuit, GraduationCap, type LucideIcon, Route } from "lucide-react";
import Link from "next/link";
import { SITE_LINKS } from "@/lib/siteLinks";
import { refresh } from "@/lib/i18n/refresh";

interface PathConfig {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  details: string[];
  accent: string;
  iconClass: string;
  ctaLabel: string;
  ctaHref: string;
  ctaIcon: LucideIcon;
  ctaVariant: "primary" | "secondary";
}

const CareerPaths = () => {
  const paths: PathConfig[] = [
    {
      icon: GraduationCap,
      eyebrow: refresh.paths.studentEyebrow,
      title: refresh.paths.studentTitle,
      description: refresh.paths.studentDescription,
      details: [
        refresh.paths.studentDetail1,
        refresh.paths.studentDetail2,
        refresh.paths.studentDetail3,
      ],
      accent: "from-aura-primary/15 to-aura-teal/10",
      iconClass: "bg-aura-primary text-white",
      ctaLabel: refresh.paths.studentCta,
      ctaHref: SITE_LINKS.vocationalTest,
      ctaIcon: ArrowRight,
      ctaVariant: "primary",
    },
    {
      icon: BrainCircuit,
      eyebrow: refresh.paths.professionalEyebrow,
      title: refresh.paths.professionalTitle,
      description: refresh.paths.professionalDescription,
      details: [
        refresh.paths.professionalDetail1,
        refresh.paths.professionalDetail2,
        refresh.paths.professionalDetail3,
      ],
      accent: "from-aura-violet/15 to-aura-teal/10",
      iconClass: "bg-gradient-to-br from-aura-violet to-aura-teal text-white",
      ctaLabel: refresh.paths.professionalCta,
      ctaHref: "#skill-graph",
      ctaIcon: Route,
      ctaVariant: "secondary",
    },
  ];

  return (
    <section id="caminos" className="aura-section bg-white/50">
      <div className="aura-container">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="aura-kicker">{refresh.paths.kicker}</span>
          <h2 className="aura-heading mt-5">{refresh.paths.title}</h2>
          <p className="aura-copy mx-auto mt-5">{refresh.paths.subtitle}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {paths.map((path, index) => (
            <Motion.article
              key={path.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={`aura-glass group relative overflow-hidden bg-gradient-to-br p-7 md:p-9 ${path.accent}`}
            >
              <div className="relative z-10">
                <div
                  className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${path.iconClass}`}
                >
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
                    <li
                      key={detail}
                      className="flex items-center gap-3 text-sm text-aura-ink/80"
                    >
                      <span className="h-2 w-2 rounded-full bg-gradient-to-r from-aura-primary to-aura-teal" />
                      {detail}
                    </li>
                  ))}
                </ul>
                {path.ctaVariant === "primary" ? (
                  <Link
                    href={path.ctaHref}
                    className="aura-button-primary"
                  >
                    {path.ctaLabel}
                    <path.ctaIcon size={18} />
                  </Link>
                ) : (
                  <a href={path.ctaHref} className="aura-button-secondary">
                    {path.ctaLabel}
                    <path.ctaIcon size={18} />
                  </a>
                )}
              </div>
            </Motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CareerPaths;