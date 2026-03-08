import type { RIASECDimension } from "@/lib/types/career";

export interface RIASECQuestion {
  id: number;
  dimension: RIASECDimension;
  text: string;
  categoria: string;
}

export interface DimensionDescription {
  letra: RIASECDimension;
  nombre: string;
  descripcion: string;
  descripcion_larga: string;
  caracteristicas: string[];
  ambientes: string[];
}

export const riasecQuestions: RIASECQuestion[] = [
  // R - REALISTA
  { id: 1, dimension: "R", text: "Me gusta trabajar con herramientas y maquinaria", categoria: "trabajo_manual" },
  { id: 2, dimension: "R", text: "Disfruto realizar actividades al aire libre", categoria: "entorno_fisico" },
  { id: 3, dimension: "R", text: "Me siento comodo/a resolviendo problemas practicos con mis manos", categoria: "resolucion_practica" },
  { id: 4, dimension: "R", text: "Prefiero trabajos que requieran habilidades tecnicas concretas", categoria: "habilidades_tecnicas" },
  { id: 5, dimension: "R", text: "Me interesa saber como funcionan las cosas (mecanica, electricidad, construccion)", categoria: "curiosidad_tecnica" },
  { id: 6, dimension: "R", text: "Me gusta construir o reparar objetos fisicos", categoria: "construccion" },
  // I - INVESTIGADOR
  { id: 7, dimension: "I", text: "Me gusta analizar datos y encontrar patrones", categoria: "analisis_datos" },
  { id: 8, dimension: "I", text: "Disfruto resolver problemas complejos que requieren pensamiento logico", categoria: "resolucion_logica" },
  { id: 9, dimension: "I", text: "Me interesa investigar y descubrir como funcionan las cosas a nivel profundo", categoria: "investigacion" },
  { id: 10, dimension: "I", text: "Prefiero trabajar con ideas y teorias abstractas", categoria: "pensamiento_abstracto" },
  { id: 11, dimension: "I", text: "Me gusta experimentar y probar hipotesis", categoria: "experimentacion" },
  { id: 12, dimension: "I", text: "Disfruto aprender sobre ciencia, matematicas o tecnologia", categoria: "aprendizaje_cientifico" },
  // A - ARTISTICO
  { id: 13, dimension: "A", text: "Me gusta expresarme creativamente (arte, musica, escritura, diseno)", categoria: "expresion_creativa" },
  { id: 14, dimension: "A", text: "Disfruto imaginar nuevas ideas y conceptos originales", categoria: "imaginacion" },
  { id: 15, dimension: "A", text: "Me siento comodo/a en ambientes poco estructurados y flexibles", categoria: "flexibilidad" },
  { id: 16, dimension: "A", text: "Prefiero trabajos que me permitan usar mi creatividad", categoria: "trabajo_creativo" },
  { id: 17, dimension: "A", text: "Me interesa la estetica y el diseno visual", categoria: "estetica" },
  { id: 18, dimension: "A", text: "Disfruto creando cosas unicas y originales", categoria: "originalidad" },
  // S - SOCIAL
  { id: 19, dimension: "S", text: "Me gusta ayudar a otras personas con sus problemas", categoria: "ayuda" },
  { id: 20, dimension: "S", text: "Disfruto ensenar o explicar cosas a otros", categoria: "ensenanza" },
  { id: 21, dimension: "S", text: "Me siento comodo/a trabajando en equipo y colaborando", categoria: "trabajo_equipo" },
  { id: 22, dimension: "S", text: "Prefiero trabajos que impliquen interaccion directa con personas", categoria: "interaccion" },
  { id: 23, dimension: "S", text: "Me interesa el bienestar y desarrollo de los demas", categoria: "bienestar_otros" },
  { id: 24, dimension: "S", text: "Disfruto escuchar y apoyar emocionalmente a otros", categoria: "apoyo_emocional" },
  // E - EMPRENDEDOR
  { id: 25, dimension: "E", text: "Me gusta liderar proyectos y tomar decisiones", categoria: "liderazgo" },
  { id: 26, dimension: "E", text: "Disfruto persuadir y convencer a otros", categoria: "persuasion" },
  { id: 27, dimension: "E", text: "Me siento comodo/a asumiendo riesgos calculados", categoria: "riesgo" },
  { id: 28, dimension: "E", text: "Prefiero trabajos que me permitan tener autonomia e influencia", categoria: "autonomia" },
  { id: 29, dimension: "E", text: "Me interesa el mundo de los negocios y las oportunidades comerciales", categoria: "negocios" },
  { id: 30, dimension: "E", text: "Disfruto organizar eventos y dirigir equipos", categoria: "organizacion_equipos" },
  // C - CONVENCIONAL
  { id: 31, dimension: "C", text: "Me gusta trabajar con datos, numeros y registros organizados", categoria: "datos_numeros" },
  { id: 32, dimension: "C", text: "Disfruto seguir procedimientos y protocolos establecidos", categoria: "procedimientos" },
  { id: 33, dimension: "C", text: "Me siento comodo/a en ambientes estructurados y predecibles", categoria: "estructura" },
  { id: 34, dimension: "C", text: "Prefiero trabajos que requieran precision y atencion al detalle", categoria: "precision" },
  { id: 35, dimension: "C", text: "Me interesa la administracion y la organizacion de informacion", categoria: "administracion" },
  { id: 36, dimension: "C", text: "Disfruto realizar tareas sistematicas y ordenadas", categoria: "sistematicidad" },
];

export const scaleLabels: Record<number, string> = {
  1: "Totalmente en desacuerdo",
  2: "En desacuerdo",
  3: "Neutral",
  4: "De acuerdo",
  5: "Totalmente de acuerdo",
};

export const dimensionDescriptions: Record<RIASECDimension, DimensionDescription> = {
  R: {
    letra: "R",
    nombre: "Realista",
    descripcion: "Orientado/a a la accion practica, herramientas y entornos fisicos.",
    descripcion_larga: "Las personas con perfil Realista prefieren actividades que requieren manipulacion de objetos, herramientas, maquinas y animales.",
    caracteristicas: ["Practico/a", "Concreto/a", "Tecnico/a", "Atletico/a"],
    ambientes: ["Talleres", "Laboratorios", "Exteriores", "Construccion"],
  },
  I: {
    letra: "I",
    nombre: "Investigador/a",
    descripcion: "Analitico/a, curioso/a, disfruta comprender y explicar fenomenos.",
    descripcion_larga: "Las personas Investigadoras prefieren actividades que involucran pensar, organizar y comprender.",
    caracteristicas: ["Analitico/a", "Intelectual", "Curioso/a", "Logico/a"],
    ambientes: ["Laboratorios", "Investigacion", "Academia", "Tecnologia"],
  },
  A: {
    letra: "A",
    nombre: "Artistico/a",
    descripcion: "Creativo/a, expresivo/a, valora la originalidad y la estetica.",
    descripcion_larga: "Las personas Artisticas prefieren actividades ambiguas, libres y desestructuradas para crear arte y disenos.",
    caracteristicas: ["Creativo/a", "Original", "Expresivo/a", "Innovador/a"],
    ambientes: ["Estudios creativos", "Agencias", "Medios", "Diseno"],
  },
  S: {
    letra: "S",
    nombre: "Social",
    descripcion: "Colaborativo/a, empatico/a, enfocado/a en ayudar y ensenar.",
    descripcion_larga: "Las personas Sociales prefieren actividades que involucran ayudar, ensenar, curar y desarrollar a otros.",
    caracteristicas: ["Empatico/a", "Cooperativo/a", "Servicial", "Comprensivo/a"],
    ambientes: ["Educacion", "Salud", "Servicios sociales", "Consultoria"],
  },
  E: {
    letra: "E",
    nombre: "Emprendedor/a",
    descripcion: "Lider, persuasivo/a, orientado/a a metas y resultados.",
    descripcion_larga: "Las personas Emprendedoras prefieren actividades que involucran influir, persuadir y dirigir a otros.",
    caracteristicas: ["Ambicioso/a", "Persuasivo/a", "Lider", "Competitivo/a"],
    ambientes: ["Negocios", "Ventas", "Politica", "Gerencia"],
  },
  C: {
    letra: "C",
    nombre: "Convencional",
    descripcion: "Organizado/a, detallista, eficiente con datos y sistemas.",
    descripcion_larga: "Las personas Convencionales prefieren actividades ordenadas y sistematicas con datos y procedimientos establecidos.",
    caracteristicas: ["Organizado/a", "Preciso/a", "Eficiente", "Detallista"],
    ambientes: ["Oficinas", "Finanzas", "Administracion", "Banca"],
  },
};
