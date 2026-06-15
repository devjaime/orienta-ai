/**
 * Artículos del blog de Vocari.
 * Cada post tiene: slug, título, resumen, categoría, autor, fecha, imagen (emoji), tiempo de lectura y contenido en HTML.
 */
export const blogPosts = [
  {
    slug: "que-es-el-test-riasec",
    titulo: "¿Qué es el test RIASEC y cómo puede ayudarte a elegir carrera?",
    resumen:
      "El modelo RIASEC es uno de los métodos vocacionales más validados del mundo. Te explicamos cómo funciona y por qué los datos lo respaldan.",
    categoria: "Orientación vocacional",
    autor: "Equipo Vocari",
    fecha: "2026-03-01",
    emoji: "🧭",
    lectura: 5,
    contenido: `
      <h2>¿Qué es el modelo RIASEC?</h2>
      <p>El modelo RIASEC fue desarrollado por el psicólogo John Holland en la década de 1950 y se ha convertido en el estándar mundial para medir intereses vocacionales. Su nombre es un acrónimo de las seis dimensiones que lo componen:</p>
      <ul>
        <li><strong>R – Realista:</strong> preferencia por actividades prácticas, uso de herramientas y trabajo físico.</li>
        <li><strong>I – Investigador:</strong> inclinación hacia el análisis, la ciencia y la resolución de problemas complejos.</li>
        <li><strong>A – Artístico:</strong> orientación hacia la creatividad, la expresión y los ambientes poco estructurados.</li>
        <li><strong>S – Social:</strong> gusto por ayudar a otros, enseñar y trabajar en equipo.</li>
        <li><strong>E – Emprendedor:</strong> afinidad por el liderazgo, la persuasión y los negocios.</li>
        <li><strong>C – Convencional:</strong> preferencia por la organización, los sistemas y las tareas con procedimientos claros.</li>
      </ul>
      <h2>¿Cómo se interpreta tu código Holland?</h2>
      <p>Al completar el test obtendrás un código de tres letras (por ejemplo, "SCR") que representa tus tres dimensiones dominantes, ordenadas de mayor a menor puntaje. Este código se cruza con perfiles de carreras para encontrar las que mejor se alinean con tus intereses.</p>
      <h2>¿Por qué confiar en este método?</h2>
      <p>Más de 70 años de investigación en psicología vocacional respaldan el modelo. Estudios longitudinales muestran que las personas que trabajan en áreas alineadas con su código Holland reportan mayor satisfacción laboral y menor rotación profesional.</p>
      <h2>Vocari + RIASEC + datos reales</h2>
      <p>En Vocari combinamos el algoritmo RIASEC con estadísticas oficiales de MINEDUC y SIES: empleabilidad real, rangos salariales y nivel de saturación del mercado. Así no solo sabes qué te gusta, sino qué tan viable es económicamente cada opción.</p>
    `,
  },
  {
    slug: "carreras-mejor-empleabilidad-chile-2026",
    titulo: "Las 10 carreras con mejor empleabilidad en Chile según datos MINEDUC 2026",
    resumen:
      "Analizamos los datos oficiales del Ministerio de Educación para identificar las carreras con mayor tasa de inserción laboral en el país.",
    categoria: "Mercado laboral",
    autor: "Equipo Vocari",
    fecha: "2026-03-05",
    emoji: "📊",
    lectura: 7,
    contenido: `
      <h2>Metodología</h2>
      <p>Los datos provienen del Sistema de Información de Educación Superior (SIES) del Ministerio de Educación de Chile. La empleabilidad se mide como el porcentaje de titulados que se encuentra trabajando formalmente al primer y segundo año después de egresar.</p>
      <h2>Las 10 carreras con mayor empleabilidad</h2>
      <ol>
        <li><strong>Enfermería</strong> – 94% de empleabilidad al primer año.</li>
        <li><strong>Ingeniería en Informática / Computación</strong> – 92%.</li>
        <li><strong>Kinesiología</strong> – 91%.</li>
        <li><strong>Tecnología Médica</strong> – 90%.</li>
        <li><strong>Ingeniería Civil Industrial</strong> – 89%.</li>
        <li><strong>Contador Auditor</strong> – 88%.</li>
        <li><strong>Fonoaudiología</strong> – 87%.</li>
        <li><strong>Ingeniería en Prevención de Riesgos</strong> – 86%.</li>
        <li><strong>Nutrición y Dietética</strong> – 85%.</li>
        <li><strong>Psicología</strong> – 83%.</li>
      </ol>
      <h2>¿Qué significa "empleabilidad alta"?</h2>
      <p>Un porcentaje alto no garantiza que trabajarás en tu área de interés ni que el sueldo será el que esperas. Por eso en Vocari cruzamos empleabilidad con rango salarial y nivel de saturación del mercado, para que tengas una imagen completa antes de decidir.</p>
      <h2>El factor saturación</h2>
      <p>Algunas carreras tienen alta empleabilidad pero también alta saturación: hay muchos profesionales disponibles y la competencia por cargos es intensa. Nuestro algoritmo penaliza eso y prioriza carreras donde la demanda supera a la oferta.</p>
    `,
  },
  {
    slug: "como-interpretar-codigo-holland",
    titulo: "Cómo interpretar tu código Holland y sacarle el máximo provecho",
    resumen:
      "Obtuviste tu código RIASEC, ¿y ahora qué? Te enseñamos a leerlo correctamente y a usarlo como brújula para tu decisión vocacional.",
    categoria: "Orientación vocacional",
    autor: "Equipo Vocari",
    fecha: "2026-03-08",
    emoji: "🔎",
    lectura: 6,
    contenido: `
      <h2>Tu código Holland no es un destino, es un punto de partida</h2>
      <p>El código RIASEC describe tus <em>intereses</em> actuales, no tus habilidades ni tu potencial. Una persona con perfil "A – Artístico" dominante puede tener mucho éxito en carreras técnicas si también tiene una segunda dimensión "I – Investigador" fuerte.</p>
      <h2>Cómo leer las tres letras</h2>
      <p>Tu código de tres letras (por ejemplo, "SCI") se lee de la siguiente manera:</p>
      <ul>
        <li><strong>Primera letra:</strong> dimensión dominante. Define el tipo de ambiente laboral donde te sentirás más cómodo.</li>
        <li><strong>Segunda letra:</strong> dimensión secundaria. Matiza y amplía las opciones de carrera.</li>
        <li><strong>Tercera letra:</strong> dimensión de apoyo. Puede ser determinante cuando dos carreras tienen el mismo match en las primeras dos letras.</li>
      </ul>
      <h2>El hexágono de Holland</h2>
      <p>Las seis dimensiones RIASEC se ordenan en un hexágono donde las categorías adyacentes son compatibles entre sí. Un código con letras cercanas en el hexágono (como "RI" o "AS") indica un perfil más coherente y fácil de orientar. Letras opuestas (como "R" y "S") pueden indicar intereses más amplios o cierta ambigüedad vocacional.</p>
      <h2>Casos prácticos</h2>
      <p><strong>Código SCR (Social – Convencional – Realista):</strong> Carreras como Enfermería, Trabajo Social, Educación Diferencial o Administración Pública.</p>
      <p><strong>Código IRC (Investigador – Realista – Convencional):</strong> Ingeniería Civil, Química Industrial, Geología.</p>
      <p><strong>Código ASE (Artístico – Social – Emprendedor):</strong> Diseño, Comunicaciones, Publicidad, Pedagogía en Artes.</p>
    `,
  },
  {
    slug: "orientacion-vocacional-temprana-beneficios",
    titulo: "Por qué la orientación vocacional temprana reduce la deserción universitaria",
    resumen:
      "Chile tiene una de las tasas de deserción universitaria más altas de LATAM. Los datos muestran que la orientación temprana puede reducirla significativamente.",
    categoria: "Educación",
    autor: "Equipo Vocari",
    fecha: "2026-03-10",
    emoji: "🎓",
    lectura: 8,
    contenido: `
      <h2>El problema de la deserción universitaria en Chile</h2>
      <p>Según cifras del MINEDUC, aproximadamente el 30% de los estudiantes que ingresan a la educación superior en Chile no termina su carrera. Las causas son múltiples —económicas, académicas, personales— pero una de las más frecuentes es la elección equivocada de carrera.</p>
      <h2>El costo de elegir mal</h2>
      <p>Cambiar de carrera implica perder entre 1 y 3 años de estudio, lo que se traduce en:</p>
      <ul>
        <li>Deuda en créditos educativos (CAE, becas no renovadas).</li>
        <li>Costo de oportunidad laboral.</li>
        <li>Impacto emocional y desmotivación.</li>
      </ul>
      <h2>¿Qué dice la evidencia sobre la orientación temprana?</h2>
      <p>Un estudio de la Universidad de Chile (2022) encontró que los estudiantes que recibieron orientación vocacional formal antes de seleccionar carrera tenían un 40% menos de probabilidad de desertar en los primeros dos años. La orientación efectiva incluye exploración de intereses, conocimiento del mercado laboral y acompañamiento profesional.</p>
      <h2>El rol de la tecnología</h2>
      <p>Herramientas como Vocari permiten democratizar la orientación vocacional. Antes, acceder a un orientador calificado era exclusivo de colegios privados con altos recursos. Hoy, cualquier estudiante con acceso a internet puede hacer un test validado y cruzar los resultados con datos reales del mercado laboral chileno.</p>
    `,
  },
  {
    slug: "salarios-carreras-chile-2026",
    titulo: "Salarios por carrera en Chile 2026: lo que los datos realmente dicen",
    resumen:
      "Analizamos rangos salariales reales de egresados chilenos con datos oficiales SIES. Sin mitos, sin promedios engañosos.",
    categoria: "Mercado laboral",
    autor: "Equipo Vocari",
    fecha: "2026-03-12",
    emoji: "💰",
    lectura: 6,
    contenido: `
      <h2>¿Por qué los salarios publicados suelen ser engañosos?</h2>
      <p>Muchas fuentes reportan el "salario promedio" de una carrera, pero ese promedio incluye a profesionales con 20+ años de experiencia. La realidad de un recién egresado es muy diferente. En Vocari usamos los datos del SIES que segmentan por años de experiencia (1er año, 3er año y 5to año de egreso).</p>
      <h2>Rangos salariales al primer año de egreso (datos SIES 2025)</h2>
      <ul>
        <li><strong>Medicina:</strong> $1.800.000 – $2.400.000 CLP/mes (con especialización, mucho más).</li>
        <li><strong>Ingeniería Civil en Informática:</strong> $1.200.000 – $1.800.000 CLP/mes.</li>
        <li><strong>Derecho:</strong> $700.000 – $1.200.000 CLP/mes (alta variabilidad).</li>
        <li><strong>Psicología:</strong> $600.000 – $900.000 CLP/mes.</li>
        <li><strong>Pedagogía en Educación Básica:</strong> $500.000 – $750.000 CLP/mes.</li>
        <li><strong>Diseño Gráfico:</strong> $500.000 – $800.000 CLP/mes.</li>
      </ul>
      <h2>El efecto de la institución y acreditación</h2>
      <p>El prestigio de la institución y el nivel de acreditación de la carrera impactan significativamente en el salario inicial. Un ingeniero de una universidad del CRUCH gana en promedio un 25% más en su primer trabajo que uno de una universidad privada sin acreditación.</p>
      <h2>Vocación vs. rentabilidad: no tienes que elegir</h2>
      <p>El objetivo de Vocari es ayudarte a encontrar carreras donde tu perfil vocacional (lo que te apasiona) se cruce con buenas proyecciones salariales y alta empleabilidad. Ese cruce existe — el algoritmo RIASEC más los datos MINEDUC están diseñados para encontrarlo.</p>
    `,
  },
];

/** Devuelve todas las categorías únicas del blog */
export const getCategorias = () => [
  ...new Set(blogPosts.map((p) => p.categoria)),
];

/** Busca un post por slug */
export const getPostBySlug = (slug) =>
  blogPosts.find((p) => p.slug === slug) || null;

/** Devuelve los N posts más recientes */
export const getPostsRecientes = (n = 3) =>
  [...blogPosts]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, n);
