import type { RIASECDimension } from "@/lib/types/career";
import { riasecQuestions } from "@/lib/data/riasec-questions";
import { calcularCodigoRIASEC } from "@/lib/data/riasec-scoring";

export type Step = "intro" | "test" | "resultsIntro" | "results";

export interface CareerRecommendation {
  career: {
    id: string;
    name: string;
    area: string;
    holland_codes: string[];
    description: string;
    salary_range: { min?: number; max?: number; median?: number };
    employability: number;
    saturation_index: number;
    mineduc_data: Record<string, unknown>;
  };
  match_score: number;
  match_reasons: string[];
}

export const testQuestions = riasecQuestions;

export const scaleOptions = [
  { value: 1, label: "Muy en desacuerdo", helper: "Casi nunca me representa" },
  { value: 2, label: "En desacuerdo", helper: "Me representa pocas veces" },
  { value: 3, label: "Neutral", helper: "Depende del contexto" },
  { value: 4, label: "De acuerdo", helper: "Me representa con frecuencia" },
  { value: 5, label: "Muy de acuerdo", helper: "Me representa totalmente" },
];

export const dimensionNames: Record<RIASECDimension, string> = {
  R: "Realista",
  I: "Investigador",
  A: "Artistico",
  S: "Social",
  E: "Emprendedor",
  C: "Convencional",
};

export const dimensionBadgeStyles: Record<RIASECDimension, string> = {
  R: "bg-riasec-R/10 text-riasec-R",
  I: "bg-riasec-I/10 text-riasec-I",
  A: "bg-riasec-A/10 text-riasec-A",
  S: "bg-riasec-S/10 text-riasec-S",
  E: "bg-riasec-E/10 text-riasec-E",
  C: "bg-riasec-C/10 text-riasec-C",
};

export const dimensionAccentStyles: Record<RIASECDimension, string> = {
  R: "border-riasec-R/20",
  I: "border-riasec-I/20",
  A: "border-riasec-A/20",
  S: "border-riasec-S/20",
  E: "border-riasec-E/20",
  C: "border-riasec-C/20",
};

export const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export const formatSalary = (range?: { min?: number; max?: number; median?: number }) => {
  if (!range?.median) return "No disponible";
  const lowerBound = range.min || range.median;
  const upperBound = range.max || range.median;
  return `${formatCLP(lowerBound)} - ${formatCLP(upperBound)}`;
};

export const getMineducYear = (data: Record<string, unknown>) => {
  const yearKeys = ["year", "anio", "ano", "periodo"];
  for (const key of yearKeys) {
    const value = data[key];
    if (typeof value === "number") return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

export const getSaturationLabel = (index: number) => {
  if (index < 0.3) return { label: "Baja", color: "bg-success/10 text-success" };
  if (index < 0.6) return { label: "Media", color: "bg-warning/10 text-warning" };
  return { label: "Alta", color: "bg-error/10 text-error" };
};

export const surveyScale = [
  { value: 1, label: "Muy baja" },
  { value: 2, label: "Baja" },
  { value: 3, label: "Media" },
  { value: 4, label: "Alta" },
  { value: 5, label: "Muy alta" },
];

/** Divide el texto del reporte en dos partes: antes y después de "Próximos Pasos". */
export function splitReportText(text: string): { beforeNextSteps: string; nextSteps: string } {
  const idx = text.search(/(\d+[\.\)]\s*)?(pr[oó]ximos\s+pasos)/i);
  if (idx !== -1) {
    return {
      beforeNextSteps: text.slice(0, idx).trimEnd(),
      nextSteps: text.slice(idx),
    };
  }
  return { beforeNextSteps: text, nextSteps: "" };
}

export function getTopDimensions(answersToUse: Record<number, number>) {
  return calcularCodigoRIASEC(answersToUse).ranking
    .slice(0, 3)
    .map((item) => [item.dimension, item.score] as [RIASECDimension, number]);
}

export function buildTestMetadata(
  answersToUse: Record<number, number>,
  stepName = "test_completed",
) {
  const result = calcularCodigoRIASEC(answersToUse);
  return {
    step: stepName,
    total_respuestas: Object.keys(answersToUse).length,
    total_preguntas: testQuestions.length,
    certeza: result.certeza,
    puntajes: result.puntajes,
    ranking: result.ranking,
  };
}
