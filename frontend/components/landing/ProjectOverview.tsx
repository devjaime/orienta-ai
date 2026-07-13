"use client";

import { motion as Motion } from "framer-motion";
import {
  ArrowUpRight,
  Blocks,
  Code2,
  Database,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { SITE_LINKS } from "@/lib/siteLinks";
import { refresh } from "@/lib/i18n/refresh";

interface ProjectCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const ProjectOverview = () => {
  const cards: ProjectCard[] = [
    {
      icon: Blocks,
      title: refresh.project.card1Title,
      description: refresh.project.card1Description,
    },
    {
      icon: Database,
      title: refresh.project.card2Title,
      description: refresh.project.card2Description,
    },
    {
      icon: ShieldCheck,
      title: refresh.project.card3Title,
      description: refresh.project.card3Description,
    },
  ];

  return (
    <section id="proyecto" className="aura-section bg-white/60">
      <div className="aura-container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="aura-kicker">{refresh.project.kicker}</span>
          <h2 className="aura-heading mt-5">{refresh.project.title}</h2>
          <p className="aura-copy mx-auto mt-5">{refresh.project.subtitle}</p>
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
              <h3 className="mt-5 font-display text-xl font-bold text-aura-ink">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-aura-muted">
                {card.description}
              </p>
            </Motion.article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {["React 19", "Vite 7", "Next.js", "FastAPI", "Supabase", "RIASEC"].map(
            (tech) => (
              <span
                key={tech}
                className="rounded-full border border-aura-primary/10 bg-white px-4 py-2 text-xs font-semibold text-aura-muted shadow-sm"
              >
                {tech}
              </span>
            ),
          )}
        </div>

        <div className="mt-9 text-center">
          <a
            href={SITE_LINKS.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="aura-button-ghost"
          >
            <Code2 size={18} />
            {refresh.project.cta}
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProjectOverview;