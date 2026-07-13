import type { Metadata } from "next";
import PublicHeader from "@/components/landing/PublicHeader";
import Hero from "@/components/landing/Hero";
import CareerPaths from "@/components/landing/CareerPaths";
import VocationalFlow from "@/components/landing/VocationalFlow";
import SkillGraphSection from "@/components/landing/SkillGraphSection";
import ProjectOverview from "@/components/landing/ProjectOverview";
import FAQ from "@/components/landing/FAQ";
import PublicFooter from "@/components/landing/PublicFooter";
import { refresh } from "@/lib/i18n/refresh";

export const metadata: Metadata = {
  title: {
    default: "Vocari - Orientación vocacional basada en evidencia",
    template: "%s | Vocari",
  },
  description: refresh.hero.subtitle,
  keywords: [
    "orientación vocacional",
    "RIASEC",
    "carreras Chile",
    "reconversión laboral",
    "skill graph",
    "colegios",
    "educación",
    "inteligencia artificial",
  ],
  openGraph: {
    title: "Vocari - Orientación vocacional basada en evidencia",
    description: refresh.hero.subtitle,
    type: "website",
    locale: "es_CL",
    siteName: "Vocari",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vocari - Orientación vocacional basada en evidencia",
    description: refresh.hero.subtitle,
  },
};

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-aura-surface text-aura-ink">
      <PublicHeader />
      <main>
        <Hero />
        <CareerPaths />
        <VocationalFlow />
        <SkillGraphSection />
        <ProjectOverview />
        <FAQ />
      </main>
      <PublicFooter />
    </div>
  );
}