export interface ReconversionPhaseTwoScenario {
  id: number;
  dimension: "personas" | "analisis" | "creatividad" | "ejecucion";
  title: string;
  description: string;
}

export const reconversionPhaseTwoLabels: Record<
  ReconversionPhaseTwoScenario["dimension"],
  string
> = {
  personas: "Trabajo con personas",
  analisis: "Analisis y resolucion",
  creatividad: "Creacion e ideacion",
  ejecucion: "Ejecucion y operacion",
};

export const reconversionPhaseTwoScenarios: ReconversionPhaseTwoScenario[] = [
  {
    id: 1,
    dimension: "personas",
    title: "Guiar a otra persona",
    description:
      "Debes acompanar a alguien que esta aprendiendo una tarea nueva y resolver sus dudas durante la jornada.",
  },
  {
    id: 2,
    dimension: "personas",
    title: "Reunion con cliente o usuario",
    description:
      "Tienes que escuchar un problema, ordenar la conversacion y proponer un siguiente paso claro.",
  },
  {
    id: 3,
    dimension: "personas",
    title: "Coordinar un equipo pequeno",
    description:
      "Debes alinear a varias personas para que un entregable salga a tiempo sin que se caiga la calidad.",
  },
  {
    id: 4,
    dimension: "analisis",
    title: "Leer datos para decidir",
    description:
      "Recibes una planilla con errores y patrones. Necesitas detectar que esta pasando y proponer una solucion.",
  },
  {
    id: 5,
    dimension: "analisis",
    title: "Resolver un problema ambiguo",
    description:
      "Nadie sabe bien por que un proceso esta fallando y te toca investigar hasta encontrar la causa.",
  },
  {
    id: 6,
    dimension: "analisis",
    title: "Aprender una herramienta nueva",
    description:
      "Debes entender un software o sistema desconocido para luego usarlo con criterio.",
  },
  {
    id: 7,
    dimension: "creatividad",
    title: "Proponer una idea distinta",
    description:
      "Te piden rediseñar una experiencia o presentar una solucion mas original que la actual.",
  },
  {
    id: 8,
    dimension: "creatividad",
    title: "Crear contenido o concepto",
    description:
      "Debes transformar informacion dispersa en una propuesta clara, atractiva y facil de entender.",
  },
  {
    id: 9,
    dimension: "creatividad",
    title: "Trabajar sin receta exacta",
    description:
      "La meta esta clara, pero nadie te dice como llegar. Te toca inventar el camino.",
  },
  {
    id: 10,
    dimension: "ejecucion",
    title: "Sacar adelante una operacion",
    description:
      "Debes mover tareas, cerrar pendientes y asegurarte de que todo funcione durante un dia intenso.",
  },
  {
    id: 11,
    dimension: "ejecucion",
    title: "Implementar con rapidez",
    description:
      "Existe una solucion definida y tu foco es llevarla a la practica sin perder ritmo ni orden.",
  },
  {
    id: 12,
    dimension: "ejecucion",
    title: "Resolver una urgencia concreta",
    description:
      "Aparece un problema operativo y lo importante es actuar, coordinar y dejarlo resuelto hoy.",
  },
];
