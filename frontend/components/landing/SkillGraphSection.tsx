"use client";

import { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  Compass,
  GraduationCap,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SITE_LINKS } from "@/lib/siteLinks";
import { refresh } from "@/lib/i18n/refresh";

type GraphMode = "vocacion" | "reconversion";

interface GraphNode {
  id: string;
  label: string;
  category: string;
  description: string;
  evidence: string;
  x: number;
  y: number;
  icon: LucideIcon;
  tone: "violet" | "teal" | "gold" | "blue";
}

const toneClasses: Record<GraphNode["tone"], string> = {
  violet:
    "border-violet-300/50 bg-violet-400/15 text-violet-100 hover:bg-violet-400/25",
  teal: "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25",
  gold: "border-amber-300/50 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25",
  blue: "border-blue-300/50 bg-blue-400/15 text-blue-100 hover:bg-blue-400/25",
};

const graphData: Record<GraphMode, GraphNode[]> = {
  vocacion: [
    {
      id: "intereses",
      label: "Intereses RIASEC",
      category: "Autoconocimiento",
      description:
        "Tus preferencias por investigar, crear y ayudar orientan los entornos donde podrías desarrollarte mejor.",
      evidence: "Resultado de test · afinidad alta",
      x: 21,
      y: 23,
      icon: Compass,
      tone: "violet",
    },
    {
      id: "habilidades",
      label: "Habilidades",
      category: "Fortalezas",
      description:
        "Pensamiento analítico, comunicación y creatividad conectan tu perfil con distintas familias de carrera.",
      evidence: "3 fortalezas declaradas",
      x: 76,
      y: 20,
      icon: BrainCircuit,
      tone: "teal",
    },
    {
      id: "datos",
      label: "Datos y tecnología",
      category: "Área sugerida",
      description:
        "Aparece como un campo compatible porque combina exploración, resolución de problemas y aprendizaje continuo.",
      evidence: "Coincidencia explicable · 87%",
      x: 82,
      y: 66,
      icon: Route,
      tone: "blue",
    },
    {
      id: "impacto",
      label: "Innovación social",
      category: "Área sugerida",
      description:
        "Une el interés social con la creación de soluciones y abre rutas en educación, salud y servicios públicos.",
      evidence: "Coincidencia explicable · 79%",
      x: 19,
      y: 72,
      icon: GraduationCap,
      tone: "gold",
    },
  ],
  reconversion: [
    {
      id: "experiencia",
      label: "Experiencia actual",
      category: "Punto de partida",
      description:
        "Tu experiencia no se descarta: se traduce en capacidades transferibles para construir el siguiente rol.",
      evidence: "6 capacidades transferibles",
      x: 20,
      y: 22,
      icon: BriefcaseBusiness,
      tone: "violet",
    },
    {
      id: "brechas",
      label: "Brechas de skills",
      category: "Diagnóstico",
      description:
        "El mapa compara lo que ya dominas con las habilidades necesarias y ordena las brechas por impacto.",
      evidence: "3 brechas prioritarias",
      x: 77,
      y: 20,
      icon: BrainCircuit,
      tone: "teal",
    },
    {
      id: "rol",
      label: "Product AI",
      category: "Rol objetivo",
      description:
        "Este rol aprovecha conocimiento de producto y suma fundamentos de datos, automatización e IA responsable.",
      evidence: "Afinidad de transición · 84%",
      x: 82,
      y: 67,
      icon: Route,
      tone: "blue",
    },
    {
      id: "plan",
      label: "Plan de 12 semanas",
      category: "Próximo paso",
      description:
        "Una ruta gradual combina práctica, evidencia de avance y proyectos que puedes mostrar profesionalmente.",
      evidence: "4 hitos · progreso medible",
      x: 18,
      y: 73,
      icon: GraduationCap,
      tone: "gold",
    },
  ],
};

const SkillGraphSection = () => {
  const [mode, setMode] = useState<GraphMode>("vocacion");
  const [selectedNodeId, setSelectedNodeId] = useState("intereses");

  const nodes = graphData[mode];
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? nodes[0],
    [nodes, selectedNodeId],
  );

  const changeMode = (nextMode: GraphMode) => {
    setMode(nextMode);
    setSelectedNodeId(graphData[nextMode][0].id);
  };

  return (
    <section id="skill-graph" className="aura-section bg-aura-ink text-white">
      <div className="aura-container">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
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
            <p className="mt-5 flex items-center gap-2 text-sm text-cyan-100/80">
              <Compass size={17} />
              {refresh.skillGraph.demoHint}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={SITE_LINKS.skillGraphRoadmap}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lime-300/40"
              >
                {refresh.skillGraph.primaryCta}
                <ArrowUpRight size={18} />
              </a>
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
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#071020] p-4 shadow-2xl shadow-cyan-500/10 sm:p-6"
            aria-label={refresh.skillGraph.demoLabel}
          >
            <div className="skill-grid pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-lg font-bold text-white">
                    {refresh.skillGraph.demoTitle}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {refresh.skillGraph.previewLabel}
                  </p>
                </div>
                <div
                  className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1"
                  role="group"
                  aria-label={refresh.skillGraph.modeLabel}
                >
                  <button
                    type="button"
                    aria-pressed={mode === "vocacion"}
                    onClick={() => changeMode("vocacion")}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      mode === "vocacion"
                        ? "bg-white text-aura-ink"
                        : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Primera vocación
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === "reconversion"}
                    onClick={() => changeMode("reconversion")}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      mode === "reconversion"
                        ? "bg-white text-aura-ink"
                        : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Reconversión
                  </button>
                </div>
              </div>

              <div className="relative mt-4 h-[25rem] overflow-hidden rounded-2xl border border-white/10 bg-[#050b16] sm:h-[27rem]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.2),transparent_38%)]" />
                <svg
                  viewBox="0 0 100 100"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  {nodes.map((node) => (
                    <line
                      key={node.id}
                      x1="50"
                      y1="48"
                      x2={node.x}
                      y2={node.y}
                      stroke="rgba(103, 232, 249, 0.35)"
                      strokeWidth="0.35"
                      strokeDasharray="1.3 1.3"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>

                <div className="absolute left-1/2 top-[48%] z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-200/40 bg-gradient-to-br from-indigo-500 to-cyan-500 text-center shadow-[0_0_45px_rgba(34,211,238,0.28)] sm:h-28 sm:w-28">
                  <Compass size={25} />
                  <span className="mt-1 text-xs font-bold">
                    {mode === "vocacion" ? "Tu perfil" : "Tu trayectoria"}
                  </span>
                </div>

                {nodes.map((node) => {
                  const Icon = node.icon;
                  const isSelected = selectedNode.id === node.id;

                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedNodeId(node.id)}
                      aria-pressed={isSelected}
                      aria-label={`${node.label}: ${node.category}`}
                      className={`absolute z-20 flex max-w-[8.5rem] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] font-semibold shadow-lg backdrop-blur-md transition duration-200 focus-visible:ring-2 focus-visible:ring-cyan-200 sm:max-w-none sm:px-3 sm:text-xs ${toneClasses[node.tone]} ${
                        isSelected
                          ? "scale-105 ring-2 ring-white/80"
                          : "opacity-80 hover:scale-105 hover:opacity-100"
                      }`}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                      <Icon className="shrink-0" size={16} />
                      <span>{node.label}</span>
                    </button>
                  );
                })}

                <div
                  className="absolute inset-x-3 bottom-3 z-30 rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-xl backdrop-blur-md sm:inset-x-5 sm:p-4"
                  aria-live="polite"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                      {selectedNode.category}
                    </p>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                      {selectedNode.evidence}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-200">
                    {selectedNode.description}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-500">
                {refresh.skillGraph.demoDisclaimer}
              </p>
            </div>
          </Motion.div>
        </div>
      </div>
    </section>
  );
};

export default SkillGraphSection;
