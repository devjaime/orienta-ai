export interface ReconversionPhaseFourOption {
  value: "a" | "b" | "c";
  title: string;
  description: string;
}

export interface ReconversionPhaseFourScenario {
  id: number;
  theme: string;
  title: string;
  description: string;
  options: ReconversionPhaseFourOption[];
}

export const reconversionPhaseFourScenarios: ReconversionPhaseFourScenario[] = [
  {
    id: 1,
    theme: "Dinero hoy vs futuro",
    title: "Si tuvieras que cambiar de rumbo, que priorizarias primero?",
    description:
      "Imagina que aparece una opcion de cambio, pero no todos los beneficios llegan al mismo tiempo.",
    options: [
      {
        value: "a",
        title: "Mantener estabilidad inmediata",
        description:
          "Prefiero que el cambio no ponga en riesgo mis ingresos actuales.",
      },
      {
        value: "b",
        title: "Equilibrar ingreso y proyeccion",
        description:
          "Acepto un ajuste moderado si veo crecimiento real en el mediano plazo.",
      },
      {
        value: "c",
        title: "Invertir hoy para crecer mas",
        description:
          "Puedo tolerar una etapa menos comoda si la proyeccion futura mejora mucho.",
      },
    ],
  },
  {
    id: 2,
    theme: "Estabilidad vs autonomia",
    title: "En tu siguiente etapa, que te importa mas cuidar?",
    description:
      "No siempre se puede maximizar estructura y libertad al mismo tiempo.",
    options: [
      {
        value: "a",
        title: "Reglas y estabilidad claras",
        description: "Me da tranquilidad tener un marco conocido y predecible.",
      },
      {
        value: "b",
        title: "Un punto medio",
        description:
          "Necesito cierta estructura, pero tambien espacio para decidir.",
      },
      {
        value: "c",
        title: "Mayor autonomia",
        description:
          "Valoro mucho elegir como trabajo aunque eso exija mas responsabilidad.",
      },
    ],
  },
  {
    id: 3,
    theme: "Personas vs sistemas",
    title: "Si tuvieras que elegir el foco principal de tu trabajo futuro?",
    description:
      "Piensa en donde te ves dedicando la mayor parte de tu energia.",
    options: [
      {
        value: "a",
        title: "Personas y acompanamiento",
        description:
          "Me veo conversando, guiando o facilitando procesos humanos.",
      },
      {
        value: "b",
        title: "Mezcla de personas y procesos",
        description:
          "Me acomoda un rol que combine coordinacion con estructura.",
      },
      {
        value: "c",
        title: "Sistemas, datos o procesos",
        description:
          "Me veo mejor entendiendo herramientas, flujos o problemas tecnicos.",
      },
    ],
  },
  {
    id: 4,
    theme: "Tiempo de aprendizaje",
    title: "Cuanto estudio o entrenamiento tolerarias para reconvertirte?",
    description:
      "La mejor ruta no siempre es la mas corta, pero tampoco tiene que ser la mas larga.",
    options: [
      {
        value: "a",
        title: "Algo breve y aplicable rapido",
        description: "Prefiero una ruta corta que me permita moverme pronto.",
      },
      {
        value: "b",
        title: "Un plan intermedio",
        description:
          "Estoy dispuesto/a a dedicar varios meses si eso mejora mi posicion.",
      },
      {
        value: "c",
        title: "Una inversion formativa mayor",
        description:
          "Aceptaria una ruta mas larga si el cambio realmente vale la pena.",
      },
    ],
  },
  {
    id: 5,
    theme: "Modalidad de trabajo",
    title: "Cual entorno te imaginas mas sostenible en esta nueva etapa?",
    description:
      "No solo importa el rol; tambien importa la forma en que se vive ese trabajo.",
    options: [
      {
        value: "a",
        title: "Mayormente remoto o flexible",
        description: "Me haria bien trabajar con mas independencia geografica.",
      },
      {
        value: "b",
        title: "Hibrido",
        description:
          "Me gusta combinar autonomia con algo de presencia o contacto.",
      },
      {
        value: "c",
        title: "Presencial o muy relacional",
        description:
          "Funciono mejor cuando estoy en contacto directo con personas o terreno.",
      },
    ],
  },
  {
    id: 6,
    theme: "Relocalizacion",
    title: "Si la mejor oportunidad no estuviera en tu ciudad actual?",
    description:
      "La disponibilidad geografica puede abrir o cerrar caminos de reconversion.",
    options: [
      {
        value: "a",
        title: "Prefiero quedarme donde estoy",
        description:
          "Necesito que el cambio funcione sin moverme de mi contexto actual.",
      },
      {
        value: "b",
        title: "Podria moverme dentro del pais",
        description:
          "Acepto cierta movilidad si la oportunidad es realmente buena.",
      },
      {
        value: "c",
        title: "Estoy abierto/a a moverme bastante",
        description:
          "Puedo considerar cambios de ciudad o incluso de pais si encaja.",
      },
    ],
  },
  {
    id: 7,
    theme: "Idioma y expansion",
    title: "Que harias si una ruta interesante exige mejorar tu ingles?",
    description:
      "El idioma puede ser friccion o una puerta de acceso, segun el momento vital.",
    options: [
      {
        value: "a",
        title: "Prefiero opciones locales sin esa exigencia",
        description:
          "Hoy priorizaria caminos donde pueda avanzar con lo que ya manejo.",
      },
      {
        value: "b",
        title: "Lo mejoraria si la ruta lo justifica",
        description:
          "Estoy dispuesto/a a aprenderlo de forma gradual para abrir oportunidades.",
      },
      {
        value: "c",
        title: "Lo asumiria como parte central del cambio",
        description:
          "Si la mejor ruta lo requiere, me comprometo a incorporarlo seriamente.",
      },
    ],
  },
  {
    id: 8,
    theme: "Ritmo del cambio",
    title: "Como te imaginas ejecutando la reconversion en la practica?",
    description:
      "No solo importa querer cambiar, sino el ritmo en que podrias sostenerlo.",
    options: [
      {
        value: "a",
        title: "Gradual y con bajo riesgo",
        description:
          "Quiero moverme paso a paso, con el menor nivel de disrupcion posible.",
      },
      {
        value: "b",
        title: "Con un plan definido y progresivo",
        description: "Puedo tomar decisiones concretas si veo etapas claras.",
      },
      {
        value: "c",
        title: "Con una apuesta decidida",
        description:
          "Si la direccion es correcta, estoy dispuesto/a a acelerar el cambio.",
      },
    ],
  },
];
