import { describe, expect, it } from "vitest";

import {
  calcularCodigoRIASEC,
  calcularCompatibilidad,
  calcularPuntajes,
} from "@/lib/data/riasec-scoring";

function respuestasPorDimension(valores: [number, number, number, number, number, number]) {
  return Object.fromEntries(
    valores.flatMap((valor, dimensionIndex) =>
      Array.from({ length: 6 }, (_, questionIndex) => [
        dimensionIndex * 6 + questionIndex + 1,
        valor,
      ]),
    ),
  );
}

describe("scoring RIASEC", () => {
  it("suma seis respuestas válidas por cada dimensión", () => {
    const respuestas = respuestasPorDimension([5, 4, 3, 2, 1, 5]);

    expect(calcularPuntajes(respuestas)).toEqual({
      R: 30,
      I: 24,
      A: 18,
      S: 12,
      E: 6,
      C: 30,
    });
  });

  it("ignora preguntas desconocidas y valores fuera de la escala", () => {
    expect(calcularPuntajes({ 1: 5, 2: 0, 3: 6, 99: 5 })).toEqual({
      R: 5,
      I: 0,
      A: 0,
      S: 0,
      E: 0,
      C: 0,
    });
  });

  it("genera un código ordenado y una certeza alta cuando existen brechas claras", () => {
    const resultado = calcularCodigoRIASEC(
      respuestasPorDimension([5, 4, 3, 2, 1, 1]),
    );

    expect(resultado.codigo_holland).toBe("RIA");
    expect(resultado.certeza).toBe("Alta");
    expect(resultado.top_dimensions).toEqual(["R", "I", "A"]);
  });

  it("usa desempate estable cuando todas las dimensiones tienen igual puntaje", () => {
    const resultado = calcularCodigoRIASEC(
      respuestasPorDimension([3, 3, 3, 3, 3, 3]),
    );

    expect(resultado.codigo_holland).toBe("ACE");
    expect(resultado.certeza).toBe("Exploratoria");
  });

  it("calcula compatibilidad exacta y parcial sin superar cien", () => {
    expect(calcularCompatibilidad("RIA", "RIA")).toBe(80);
    expect(calcularCompatibilidad("RIA", "AIR")).toBe(45);
  });
});
