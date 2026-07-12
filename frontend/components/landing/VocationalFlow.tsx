"use client";

import { motion as Motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Database,
  FileText,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { SITE_LINKS } from "@/lib/siteLinks";
import { refresh } from "@/lib/i18n/refresh";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const VocationalFlow = () => {
  const steps: Step[] = [
    {
      icon: ClipboardCheck,
      title: refresh.flow.step1Title,
      description: refresh.flow.step1Description,
    },
    {
      icon: Database,
      title: refresh.flow.step2Title,
      description: refresh.flow.step2Description,
    },
    {
      icon: FileText,
      title: refresh.flow.step3Title,
      description: refresh.flow.step3Description,
    },
  ];

  return (
    <section id="como-funciona" className="aura-section relative overflow-hidden">
      <div className="aura-orb -left-40 top-20 h-96 w-96 bg-aura-teal/10" />
      <div className="aura-container relative">
        <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28">
            <span className="aura-kicker">{refresh.flow.kicker}</span>
            <h2 className="aura-heading mt-5">{refresh.flow.title}</h2>
            <p className="aura-copy mt-5">{refresh.flow.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={SITE_LINKS.vocationalTest} className="aura-button-primary">
                {refresh.flow.primaryCta}
                <ArrowRight size={18} />
              </Link>
              <Link href={SITE_LINKS.sampleReport} className="aura-button-ghost">
                <BarChart3 size={18} />
                {refresh.flow.secondaryCta}
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
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-aura-ink">
                    {step.title}
                  </h3>
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