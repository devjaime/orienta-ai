"use client";

import { motion as Motion } from "framer-motion";
import {
  ArrowUpRight,
  Award,
  Bot,
  Braces,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SITE_LINKS } from "@/lib/siteLinks";
import { refresh } from "@/lib/i18n/refresh";

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className: string;
}

const ExternalLink = ({ href, children, className }: ExternalLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={className}
  >
    {children}
  </a>
);

interface PreviewLinkItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const SkillGraphSection = () => {
  const roadmap = [
    refresh.skillGraph.node1,
    refresh.skillGraph.node2,
    refresh.skillGraph.node3,
    refresh.skillGraph.node4,
    refresh.skillGraph.node5,
    refresh.skillGraph.node6,
  ];
  const profiles = [
    refresh.skillGraph.profile1,
    refresh.skillGraph.profile2,
    refresh.skillGraph.profile3,
    refresh.skillGraph.profile4,
    refresh.skillGraph.profile5,
    refresh.skillGraph.profile6,
  ];

  const previewLinks: PreviewLinkItem[] = [
    {
      icon: Bot,
      label: refresh.skillGraph.agent,
      href: SITE_LINKS.skillGraphAgent,
    },
    {
      icon: Braces,
      label: refresh.skillGraph.playground,
      href: SITE_LINKS.skillGraphPlayground,
    },
    {
      icon: Award,
      label: refresh.skillGraph.certifications,
      href: SITE_LINKS.skillGraphCertifications,
    },
  ];

  return (
    <section id="skill-graph" className="aura-section bg-aura-ink text-white">
      <div className="aura-container">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <Motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-aura-teal/30 bg-aura-teal/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <Sparkles size={16} />
              {refresh.skillGraph.badge}
            </div>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {refresh.skillGraph.title}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              {refresh.skillGraph.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {profiles.map((profile) => (
                <span
                  key={profile}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
                >
                  {profile}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ExternalLink
                href={SITE_LINKS.skillGraphRoadmap}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lime-300/40"
              >
                {refresh.skillGraph.primaryCta}
                <ArrowUpRight size={18} />
              </ExternalLink>
              <a
                href={SITE_LINKS.careerTransition}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              >
                {refresh.skillGraph.secondaryCta}
                <Route size={18} />
              </a>
            </div>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-3xl border border-lime-400/25 bg-[#061208] p-5 shadow-2xl shadow-lime-500/10 md:p-7"
          >
            <div className="skill-grid absolute inset-0 opacity-50" />
            <div className="relative">
              <div className="mb-6 flex items-center justify-between border-b border-lime-300/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-slate-950">
                    <Route size={21} />
                  </div>
                  <div>
                    <p className="font-semibold text-lime-50">
                      AI Engineer Skill Graph
                    </p>
                    <p className="text-xs text-lime-100/55">
                      {refresh.skillGraph.previewLabel}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-lime-300/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-200">
                  MVP
                </span>
              </div>

              <div className="space-y-3">
                {roadmap.map((node, index) => (
                  <div key={node} className="grid grid-cols-[2rem_1fr] gap-3">
                    <div className="relative flex justify-center">
                      {index < roadmap.length - 1 && (
                        <span className="absolute bottom-[-16px] top-8 w-px bg-lime-400/25" />
                      )}
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-lime-400/35 bg-[#07170a] text-xs font-bold text-lime-300">
                        {index + 1}
                      </span>
                    </div>
                    <div className="rounded-xl border border-lime-400/20 bg-black/20 px-4 py-3">
                      <p className="text-sm font-medium text-lime-50">{node}</p>
                      <p className="mt-1 text-xs text-lime-100/45">
                        {index < 2 ? "beginner" : "intermediate"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {previewLinks.map((item) => (
                  <ExternalLink
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 rounded-xl border border-lime-300/15 bg-lime-400/5 px-3 py-3 text-xs font-medium text-lime-100 transition hover:bg-lime-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
                  >
                    <item.icon size={16} className="text-lime-300" />
                    {item.label}
                  </ExternalLink>
                ))}
              </div>
            </div>
          </Motion.div>
        </div>
      </div>
    </section>
  );
};

export default SkillGraphSection;