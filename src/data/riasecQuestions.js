/**
 * Test Holland RIASEC - 36 Preguntas
 * 6 preguntas por dimensión (R, I, A, S, E, C)
 * Escala 1-5: Totalmente en desacuerdo → Totalmente de acuerdo
 */

export const riasecQuestions = [
  // ============ R - REALISTA (6 preguntas) ============
  {
    id: 1,
    dimension: 'R',
    text: 'Me gusta trabajar con herramientas y maquinaria',
    categoria: 'trabajo_manual'
  },
  {
    id: 2,
    dimension: 'R',
    text: 'Disfruto realizar actividades al aire libre',
    categoria: 'entorno_fisico'
  },
  {
    id: 3,
    dimension: 'R',
    text: 'Me siento cómodo/a resolviendo problemas prácticos con mis manos',
    categoria: 'resolucion_practica'
  },
  {
    id: 4,
    dimension: 'R',
    text: 'Prefiero trabajos que requieran habilidades técnicas concretas',
    categoria: 'habilidades_tecnicas'
  },
  {
    id: 5,
    dimension: 'R',
    text: 'Me interesa saber cómo funcionan las cosas (mecánica, electricidad, construcción)',
    categoria: 'curiosidad_tecnica'
  },
  {
    id: 6,
    dimension: 'R',
    text: 'Me gusta construir o reparar objetos físicos',
    categoria: 'construccion'
  },

  // ============ I - INVESTIGADOR (6 preguntas) ============
  {
    id: 7,
    dimension: 'I',
    text: 'Me gusta analizar datos y encontrar patrones',
    categoria: 'analisis_datos'
  },
  {
    id: 8,
    dimension: 'I',
    text: 'Disfruto resolver problemas complejos que requieren pensamiento lógico',
    categoria: 'resolucion_logica'
  },
  {
    id: 9,
    dimension: 'I',
    text: 'Me interesa investigar y descubrir cómo funcionan las cosas a nivel profundo',
    categoria: 'investigacion'
  },
  {
    id: 10,
    dimension: 'I',
    text: 'Prefiero trabajar con ideas y teorías abstractas',
    categoria: 'pensamiento_abstracto'
  },
  {
    id: 11,
    dimension: 'I',
    text: 'Me gusta experimentar y probar hipótesis',
    categoria: 'experimentacion'
  },
  {
    id: 12,
    dimension: 'I',
    text: 'Disfruto aprender sobre ciencia, matemáticas o tecnología',
    categoria: 'aprendizaje_cientifico'
  },

  // ============ A - ARTÍSTICO (6 preguntas) ============
  {
    id: 13,
    dimension: 'A',
    text: 'Me gusta expresarme creativamente (arte, música, escritura, diseño)',
    categoria: 'expresion_creativa'
  },
  {
    id: 14,
    dimension: 'A',
    text: 'Disfruto imaginar nuevas ideas y conceptos originales',
    categoria: 'imaginacion'
  },
  {
    id: 15,
    dimension: 'A',
    text: 'Me siento cómodo/a en ambientes poco estructurados y flexibles',
    categoria: 'flexibilidad'
  },
  {
    id: 16,
    dimension: 'A',
    text: 'Prefiero trabajos que me permitan usar mi creatividad',
    categoria: 'trabajo_creativo'
  },
  {
    id: 17,
    dimension: 'A',
    text: 'Me interesa la estética y el diseño visual',
    categoria: 'estetica'
  },
  {
    id: 18,
    dimension: 'A',
    text: 'Disfruto creando cosas únicas y originales',
    categoria: 'originalidad'
  },

  // ============ S - SOCIAL (6 preguntas) ============
  {
    id: 19,
    dimension: 'S',
    text: 'Me gusta ayudar a otras personas con sus problemas',
    categoria: 'ayuda'
  },
  {
    id: 20,
    dimension: 'S',
    text: 'Disfruto enseñar o explicar cosas a otros',
    categoria: 'ensenanza'
  },
  {
    id: 21,
    dimension: 'S',
    text: 'Me siento cómodo/a trabajando en equipo y colaborando',
    categoria: 'trabajo_equipo'
  },
  {
    id: 22,
    dimension: 'S',
    text: 'Prefiero trabajos que impliquen interacción directa con personas',
    categoria: 'interaccion'
  },
  {
    id: 23,
    dimension: 'S',
    text: 'Me interesa el bienestar y desarrollo de los demás',
    categoria: 'bienestar_otros'
  },
  {
    id: 24,
    dimension: 'S',
    text: 'Disfruto escuchar y apoyar emocionalmente a otros',
    categoria: 'apoyo_emocional'
  },

  // ============ E - EMPRENDEDOR (6 preguntas) ============
  {
    id: 25,
    dimension: 'E',
    text: 'Me gusta liderar proyectos y tomar decisiones',
    categoria: 'liderazgo'
  },
  {
    id: 26,
    dimension: 'E',
    text: 'Disfruto persuadir y convencer a otros',
    categoria: 'persuasion'
  },
  {
    id: 27,
    dimension: 'E',
    text: 'Me siento cómodo/a asumiendo riesgos calculados',
    categoria: 'riesgo'
  },
  {
    id: 28,
    dimension: 'E',
    text: 'Prefiero trabajos que me permitan tener autonomía e influencia',
    categoria: 'autonomia'
  },
  {
    id: 29,
    dimension: 'E',
    text: 'Me interesa el mundo de los negocios y las oportunidades comerciales',
    categoria: 'negocios'
  },
  {
    id: 30,
    dimension: 'E',
    text: 'Disfruto organizar eventos y dirigir equipos',
    categoria: 'organizacion_equipos'
  },

  // ============ C - CONVENCIONAL (6 preguntas) ============
  {
    id: 31,
    dimension: 'C',
    text: 'Me gusta trabajar con datos, números y registros organizados',
    categoria: 'datos_numeros'
  },
  {
    id: 32,
    dimension: 'C',
    text: 'Disfruto seguir procedimientos y protocolos establecidos',
    categoria: 'procedimientos'
  },
  {
    id: 33,
    dimension: 'C',
    text: 'Me siento cómodo/a en ambientes estructurados y predecibles',
    categoria: 'estructura'
  },
  {
    id: 34,
    dimension: 'C',
    text: 'Prefiero trabajos que requieran precisión y atención al detalle',
    categoria: 'precision'
  },
  {
    id: 35,
    dimension: 'C',
    text: 'Me interesa la administración y la organización de información',
    categoria: 'administracion'
  },
  {
    id: 36,
    dimension: 'C',
    text: 'Disfruto realizar tareas sistemáticas y ordenadas',
    categoria: 'sistematicidad'
  }
];

/**
 * Escala de respuestas (1-5)
 */
export const scaleLabels = {
  1: 'Totalmente en desacuerdo',
  2: 'En desacuerdo',
  3: 'Neutral',
  4: 'De acuerdo',
  5: 'Totalmente de acuerdo'
};

/**
 * Descripciones de las dimensiones RIASEC
 */
export const dimensionDescriptions = {
  R: {
    letra: 'R',
    nombre: 'Realista',
    descripcion: 'Orientado/a a la acción práctica, herramientas y entornos físicos.',
    descripcion_larga: 'Las personas con perfil Realista prefieren actividades que requieren manipulación de objetos, herramientas, máquinas y animales. Disfrutan trabajando al aire libre y con las manos.',
    caracteristicas: ['Práctico/a', 'Concreto/a', 'Técnico/a', 'Atlético/a'],
    ambientes: ['Talleres', 'Laboratorios', 'Exteriores', 'Construcción']
  },
  I: {
    letra: 'I',
    nombre: 'Investigador/a',
    descripcion: 'Analítico/a, curioso/a, disfruta comprender y explicar fenómenos.',
    descripcion_larga: 'Las personas Investigadoras prefieren actividades que involucran pensar, organizar y comprender. Les gusta la investigación científica y resolver problemas complejos.',
    caracteristicas: ['Analítico/a', 'Intelectual', 'Curioso/a', 'Lógico/a'],
    ambientes: ['Laboratorios', 'Investigación', 'Academia', 'Tecnología']
  },
  A: {
    letra: 'A',
    nombre: 'Artístico/a',
    descripcion: 'Creativo/a, expresivo/a, valora la originalidad y la estética.',
    descripcion_larga: 'Las personas Artísticas prefieren actividades ambiguas, libres y desestructuradas para crear arte, diseños o productos originales.',
    caracteristicas: ['Creativo/a', 'Original', 'Expresivo/a', 'Innovador/a'],
    ambientes: ['Estudios creativos', 'Agencias', 'Medios', 'Diseño']
  },
  S: {
    letra: 'S',
    nombre: 'Social',
    descripcion: 'Colaborativo/a, empático/a, enfocado/a en ayudar y enseñar.',
    descripcion_larga: 'Las personas Sociales prefieren actividades que involucran ayudar, enseñar, curar y desarrollar a otros. Valoran las relaciones interpersonales.',
    caracteristicas: ['Empático/a', 'Cooperativo/a', 'Servicial', 'Comprensivo/a'],
    ambientes: ['Educación', 'Salud', 'Servicios sociales', 'Consultoría']
  },
  E: {
    letra: 'E',
    nombre: 'Emprendedor/a',
    descripcion: 'Líder, persuasivo/a, orientado/a a metas y resultados.',
    descripcion_larga: 'Las personas Emprendedoras prefieren actividades que involucran influir, persuadir y dirigir a otros para alcanzar objetivos organizacionales o económicos.',
    caracteristicas: ['Ambicioso/a', 'Persuasivo/a', 'Líder', 'Competitivo/a'],
    ambientes: ['Negocios', 'Ventas', 'Política', 'Gerencia']
  },
  C: {
    letra: 'C',
    nombre: 'Convencional',
    descripcion: 'Organizado/a, detallista, eficiente con datos y sistemas.',
    descripcion_larga: 'Las personas Convencionales prefieren actividades ordenadas y sistemáticas que involucran manipular datos, registros y cumplir con procedimientos establecidos.',
    caracteristicas: ['Organizado/a', 'Preciso/a', 'Eficiente', 'Detallista'],
    ambientes: ['Oficinas', 'Finanzas', 'Administración', 'Banca']
  }
};

/**
 * Valida que todas las respuestas estén completas
 */
export const validateResponses = (responses) => {
  if (!responses || typeof responses !== 'object') {
    return { valid: false, error: 'Respuestas inválidas' };
  }

  const totalQuestions = riasecQuestions.length;
  const answeredCount = Object.keys(responses).filter(key => {
    const questionId = parseInt(key);
    return questionId >= 1 && questionId <= totalQuestions && responses[key] >= 1 && responses[key] <= 5;
  }).length;

  if (answeredCount < totalQuestions) {
    return {
      valid: false,
      error: `Faltan ${totalQuestions - answeredCount} preguntas por responder`,
      progress: Math.round((answeredCount / totalQuestions) * 100)
    };
  }

  return { valid: true };
};

/**
 * Obtiene el número total de preguntas
 */
export const getTotalQuestions = () => riasecQuestions.length;

/**
 * Obtiene preguntas por dimensión
 */
export const getQuestionsByDimension = (dimension) => {
  return riasecQuestions.filter(q => q.dimension === dimension);
};
