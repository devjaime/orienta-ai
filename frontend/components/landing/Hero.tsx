"use client";

import { motion as Motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Compass,
  Database,
  Play,
  Route,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { SITE_LINKS } from "@/lib/siteLinks";
import { refresh } from "@/lib/i18n/refresh";

const Hero = () => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-24">
      <div className="aura-orb -right-36 -top-20 h-[34rem] w-[34rem] bg-aura-primary/20" />
      <div className="aura-orb -bottom-40 -left-48 h-[38rem] w-[38rem] bg-aura-teal/10" />
      <div className="aura-orb left-[35%] top-[35%] h-80 w-80 bg-aura-violet/10" />

      <div className="aura-container relative grid items-center gap-14 py-16 lg:grid-cols-12 lg:py-24">
        <Motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-aura-primary/15 bg-white/70 px-4 py-2 text-sm font-semibold text-aura-primary shadow-sm backdrop-blur-xl">
            <Sparkles size={16} />
            {refresh.hero.badge}
          </div>

          <h1 className="mt-7 font-display text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-aura-ink sm:text-5xl lg:text-6xl">
            {refresh.hero.title}
            <span className="mt-2 block bg-gradient-to-r from-aura-primary via-aura-violet to-aura-teal bg-clip-text text-transparent">
              {refresh.hero.highlight}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-aura-muted">
            {refresh.hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={SITE_LINKS.vocationalTest} className="aura-button-primary">
              <Play size={18} />
              {refresh.hero.primaryCta}
            </Link>
            <Link
              href={SITE_LINKS.careerTransition}
              className="aura-button-secondary"
            >
              <Route size={18} />
              {refresh.hero.secondaryCta}
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-12 grid max-w-lg grid-cols-2 gap-3">
            <div className="aura-glass flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aura-teal/10 text-aura-teal">
                <Database size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-aura-ink">
                  {refresh.hero.dataTitle}
                </p>
                <p className="mt-1 text-xs text-aura-muted">
                  {refresh.hero.dataDescription}
                </p>
              </div>
            </div>
            <div className="aura-glass flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aura-violet/10 text-aura-violet">
                <BrainCircuit size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-aura-ink">
                  {refresh.hero.aiTitle}
                </p>
                <p className="mt-1 text-xs text-aura-muted">
                  {refresh.hero.aiDescription}
                </p>
              </div>
            </div>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative mx-auto w-full max-w-[34rem] lg:col-span-6"
        >
          <div className="relative aspect-square">
            <div className="absolute inset-0 animate-[spin_28s_linear_infinite] rounded-full border border-dashed border-aura-primary/20 motion-reduce:animate-none" />
            <div className="absolute inset-8 animate-[spin_36s_linear_infinite_reverse] rounded-full border border-dashed border-aura-teal/30 motion-reduce:animate-none" />
            <div className="aura-glass absolute inset-14 flex items-center justify-center rounded-full shadow-2xl shadow-aura-primary/10">
              <span className="absolute top-6 font-display font-bold text-aura-primary/35">
                N
              </span>
              <span className="absolute bottom-6 font-display font-bold text-aura-primary/35">
                S
              </span>
              <span className="absolute left-6 font-display font-bold text-aura-primary/35">
                O
              </span>
              <span className="absolute right-6 font-display font-bold text-aura-primary/35">
                E
              </span>
              <div className="relative flex h-36 w-36 rotate-45 items-center justify-center">
                <div className="absolute h-32 w-7 rounded-full bg-gradient-to-b from-aura-primary via-aura-violet to-aura-teal shadow-lg shadow-aura-primary/30" />
                <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg">
                  <Compass size={18} className="-rotate-45 text-aura-primary" />
                </div>
              </div>
            </div>

            <Motion.a
              href="#skill-graph"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="aura-glass absolute right-0 top-14 flex items-center gap-3 p-4 motion-reduce:transform-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aura-violet to-aura-teal text-white">
                <Route size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-aura-teal">
                  {refresh.hero.newLabel}
                </p>
                <p className="text-sm font-semibold text-aura-ink">
                  Skill Graph para IA
                </p>
              </div>
            </Motion.a>

            <Motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6,
              }}
              className="aura-glass absolute bottom-8 left-0 max-w-[17rem] p-5 motion-reduce:transform-none"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-aura-primary">
                {refresh.hero.cardEyebrow}
              </p>
              <p className="mt-2 font-display text-lg font-bold text-aura-ink">
                {refresh.hero.cardTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-aura-muted">
                {refresh.hero.cardDescription}
              </p>
            </Motion.div>
          </div>
        </Motion.div>
      </div>
    </section>
  );
};

export default Hero;