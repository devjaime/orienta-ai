/* Dimension RIASEC */
export type RIASECDimension = "R" | "I" | "A" | "S" | "E" | "C";

export const RIASEC_LABELS: Record<RIASECDimension, string> = {
  R: "Realista",
  I: "Investigador",
  A: "Artistico",
  S: "Social",
  E: "Emprendedor",
  C: "Convencional",
};

/* Resultado de un test RIASEC */
export interface RIASECScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export interface TestResult {
  id: string;
  student_id: string;
  test_type: string;
  scores: RIASECScores;
  top_dimensions: RIASECDimension[];
  completed_at: string;
}

/* Carrera */
export interface Career {
  id: string;
  nombre: string;
  area: string;
  riasec_code: string;
  descripcion: string;
  universidades: string[];
  salario_promedio: number | null;
  empleabilidad: number | null;
  tendencia_matricula: "creciente" | "estable" | "decreciente" | null;
  saturacion: "baja" | "media" | "alta" | null;
}

export interface CareerRecommendation {
  career: Career;
  match_score: number;
  match_reasons: string[];
}
