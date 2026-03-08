import type { RIASECDimension, RIASECScores } from "@/lib/types/career";

/** Mapa de preguntas a dimensiones (id 1-6 = R, 7-12 = I, etc.) */
const DIMENSION_MAP: Record<number, RIASECDimension> = {};
const DIMS: RIASECDimension[] = ["R", "I", "A", "S", "E", "C"];
for (let i = 0; i < 6; i++) {
  for (let j = 1; j <= 6; j++) {
    DIMENSION_MAP[i * 6 + j] = DIMS[i];
  }
}

/** Calcula puntajes por dimension (6-30 cada una) */
export function calcularPuntajes(responses: Record<number, number>): RIASECScores {
  const scores: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const [qId, value] of Object.entries(responses)) {
    const dim = DIMENSION_MAP[parseInt(qId)];
    if (dim && value >= 1 && value <= 5) {
      scores[dim] += value;
    }
  }

  return scores;
}

interface RankedDimension {
  dimension: RIASECDimension;
  score: number;
  intensity: number; // respuestas 4 o 5
  rejection: number; // respuestas 1 o 2
}

/** Calcula el codigo Holland completo */
export function calcularCodigoRIASEC(responses: Record<number, number>) {
  const scores = calcularPuntajes(responses);

  // Calcular intensidad y rechazo por dimension
  const ranked: RankedDimension[] = DIMS.map((dim) => {
    let intensity = 0;
    let rejection = 0;

    for (const [qId, value] of Object.entries(responses)) {
      if (DIMENSION_MAP[parseInt(qId)] === dim) {
        if (value >= 4) intensity++;
        if (value <= 2) rejection++;
      }
    }

    return { dimension: dim, score: scores[dim], intensity, rejection };
  });

  // Ordenar con desempates
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.intensity !== a.intensity) return b.intensity - a.intensity;
    if (a.rejection !== b.rejection) return a.rejection - b.rejection;
    return a.dimension.localeCompare(b.dimension);
  });

  const codigoHolland = ranked
    .slice(0, 3)
    .map((d) => d.dimension)
    .join("");

  // Calcular certeza
  const gaps: number[] = [];
  for (let i = 0; i < 3; i++) {
    if (ranked[i + 1]) {
      gaps.push(ranked[i].score - ranked[i + 1].score);
    }
  }
  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

  let certeza: "Alta" | "Media" | "Exploratoria";
  if (avgGap >= 4) certeza = "Alta";
  else if (avgGap >= 2) certeza = "Media";
  else certeza = "Exploratoria";

  return {
    codigo_holland: codigoHolland,
    certeza,
    puntajes: scores,
    ranking: ranked,
    top_dimensions: ranked.slice(0, 3).map((d) => d.dimension),
  };
}

/** Calcula compatibilidad entre un codigo de usuario y un codigo de carrera (0-100) */
export function calcularCompatibilidad(
  codigoUsuario: string,
  codigoCarrera: string,
): number {
  let score = 0;
  const weights = [40, 25, 15];

  for (let i = 0; i < 3; i++) {
    if (codigoUsuario[i] === codigoCarrera[i]) {
      score += weights[i];
    } else if (codigoCarrera.includes(codigoUsuario[i])) {
      score += 10;
    }
  }

  return Math.min(100, score);
}
