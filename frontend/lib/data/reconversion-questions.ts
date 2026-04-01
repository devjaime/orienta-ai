export interface ReconversionQuestion {
  id: number;
  dimension: string;
  text: string;
}

export const reconversionDimensionLabels: Record<string, string> = {
  energia_social: "Energia social",
  energia_analitica: "Energia analitica",
  energia_creativa: "Energia creativa",
  energia_practica: "Energia practica",
  autonomia: "Autonomia",
  seguridad: "Seguridad",
  proposito: "Proposito",
  aprendizaje: "Aprendizaje",
  liderazgo: "Liderazgo",
  tolerancia_al_cambio: "Tolerancia al cambio",
};

export const reconversionQuestions: ReconversionQuestion[] = [
  {
    id: 1,
    dimension: "energia_social",
    text: "Me energiza trabajar conversando y coordinando con otras personas.",
  },
  {
    id: 2,
    dimension: "energia_social",
    text: "Disfruto guiar, explicar o acompanar a alguien en un proceso.",
  },
  {
    id: 3,
    dimension: "energia_social",
    text: "Prefiero trabajos donde haya interaccion humana frecuente.",
  },
  {
    id: 4,
    dimension: "energia_analitica",
    text: "Me resulta natural ordenar informacion y detectar patrones.",
  },
  {
    id: 5,
    dimension: "energia_analitica",
    text: "Me gusta resolver problemas complejos paso a paso.",
  },
  {
    id: 6,
    dimension: "energia_analitica",
    text: "Disfruto entender como funciona un sistema antes de actuar.",
  },
  {
    id: 7,
    dimension: "energia_creativa",
    text: "Me activa imaginar ideas nuevas o enfoques distintos.",
  },
  {
    id: 8,
    dimension: "energia_creativa",
    text: "Disfruto crear contenido, conceptos o propuestas originales.",
  },
  {
    id: 9,
    dimension: "energia_creativa",
    text: "Prefiero trabajos donde se valore la innovacion.",
  },
  {
    id: 10,
    dimension: "energia_practica",
    text: "Me gusta ver resultados concretos y tangibles de mi trabajo.",
  },
  {
    id: 11,
    dimension: "energia_practica",
    text: "Disfruto ejecutar, implementar o resolver cosas del dia a dia.",
  },
  {
    id: 12,
    dimension: "energia_practica",
    text: "Me siento bien cuando hago avanzar una operacion real.",
  },
  {
    id: 13,
    dimension: "autonomia",
    text: "Me motiva tener margen para decidir como hacer mi trabajo.",
  },
  {
    id: 14,
    dimension: "autonomia",
    text: "Valoro mucho poder organizar mis tiempos o prioridades.",
  },
  {
    id: 15,
    dimension: "autonomia",
    text: "Prefiero menos control externo y mas responsabilidad propia.",
  },
  {
    id: 16,
    dimension: "seguridad",
    text: "Necesito que mi proximo paso profesional tenga cierta estabilidad.",
  },
  {
    id: 17,
    dimension: "seguridad",
    text: "Me importa que el cambio no ponga demasiado en riesgo mis ingresos.",
  },
  {
    id: 18,
    dimension: "seguridad",
    text: "Prefiero rutas de reconversion con estructura y plazos claros.",
  },
  {
    id: 19,
    dimension: "proposito",
    text: "Necesito sentir que mi trabajo aporta algo valioso a otros.",
  },
  {
    id: 20,
    dimension: "proposito",
    text: "Busco un futuro profesional con mayor sentido personal.",
  },
  {
    id: 21,
    dimension: "proposito",
    text: "Estoy dispuesto/a a cambiar si eso mejora mi bienestar de largo plazo.",
  },
  {
    id: 22,
    dimension: "aprendizaje",
    text: "Me entusiasma aprender herramientas o habilidades nuevas.",
  },
  {
    id: 23,
    dimension: "aprendizaje",
    text: "No me incomoda volver a estudiar si la ruta vale la pena.",
  },
  {
    id: 24,
    dimension: "aprendizaje",
    text: "Veo la adaptacion como parte normal del crecimiento profesional.",
  },
  {
    id: 25,
    dimension: "liderazgo",
    text: "Me acomoda tomar decisiones y mover a otros hacia una meta.",
  },
  {
    id: 26,
    dimension: "liderazgo",
    text: "Disfruto coordinar equipos o empujar proyectos.",
  },
  {
    id: 27,
    dimension: "liderazgo",
    text: "Me energiza influir, negociar o abrir oportunidades.",
  },
  {
    id: 28,
    dimension: "tolerancia_al_cambio",
    text: "Puedo tolerar una etapa de transicion si el cambio tiene sentido.",
  },
  {
    id: 29,
    dimension: "tolerancia_al_cambio",
    text: "Estoy dispuesto/a a salir de mi zona conocida para crecer.",
  },
  {
    id: 30,
    dimension: "tolerancia_al_cambio",
    text: "Puedo adaptarme si el nuevo camino exige ajustes importantes.",
  },
];
