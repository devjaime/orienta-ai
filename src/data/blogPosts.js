import { sourceLibrary } from "./futureLabor2030";

/**
 * Artículos del blog de Vocari.
 * Cada post tiene slug, título, resumen, categoría, autor, fecha, emoji, tiempo de lectura y contenido en HTML.
 * Los posts nuevos pueden incluir audiencia, fuentes, rutas y roles sin requerir cambios en Supabase.
 */
export const blogPosts = [
  {
    slug: "trabajo-2030-que-cambiara-y-que-no",
    titulo: "Trabajo 2030: qué cambiará y qué no",
    resumen:
      "Una lectura clara sobre los escenarios laborales hacia 2030: IA, transición verde, cuidados y economía territorial, sin prometer certezas falsas.",
    categoria: "Futuro laboral 2030",
    audiencia: "mixto",
    autor: "Equipo Vocari",
    fecha: "2026-06-27",
    emoji: "2030",
    lectura: 8,
    fuentes: [sourceLibrary.wef, sourceLibrary.ilo, sourceLibrary.oecd],
    roles: {
      tecnologicos: ["IA aplicada", "Datos", "Ciberseguridad", "Automatización"],
      noTecnologicos: ["Cuidados", "Educación", "Logística", "Energía"],
    },
    rutas: [
      "Identifica tareas repetitivas de tu área y aprende a automatizar una parte.",
      "Suma una habilidad transversal: datos, comunicación, inglés o gestión de proyectos.",
      "Construye evidencia con un proyecto breve antes de cambiar de carrera o empleo.",
    ],
    contenido: `
      <h2>La pregunta correcta no es si la IA quitará empleos</h2>
      <p>La pregunta útil es qué tareas cambiarán, qué capacidades se volverán más valiosas y qué rutas educativas permiten moverse a tiempo. El World Economic Forum proyecta que hacia 2030 un 22% de los empleos tendrá transformación estructural: se crearían 170 millones de roles y se desplazarían 92 millones, con un saldo neto positivo pero muy desigual entre industrias.</p>
      <h2>Cuatro escenarios probables</h2>
      <ul>
        <li><strong>Aceleración IA:</strong> crecerá el trabajo que combina criterio humano, datos y automatización. No bastará con "saber usar prompts"; habrá que entender procesos, calidad y riesgos.</li>
        <li><strong>Transición verde:</strong> eficiencia energética, electromovilidad, mantención, construcción sostenible y gestión ambiental demandarán técnicos y profesionales híbridos.</li>
        <li><strong>Salud y cuidados:</strong> el envejecimiento, la salud mental y la tecnología asistiva impulsarán roles clínicos, comunitarios y de coordinación de servicios.</li>
        <li><strong>Economía territorial:</strong> minería, agro, logística y servicios regionales necesitarán personas capaces de operar, medir y mejorar procesos reales.</li>
      </ul>
      <h2>Qué no cambiará</h2>
      <p>Seguirán importando la confianza, la comunicación, la responsabilidad y la capacidad de aprender. La evidencia de la ILO sugiere que la IA generativa tiende a aumentar muchas ocupaciones más que reemplazarlas por completo, aunque algunas tareas administrativas quedan más expuestas.</p>
      <h2>Cómo usar esto para decidir</h2>
      <p>Si estás eligiendo carrera, mira la combinación entre intereses, empleabilidad, ingresos y flexibilidad futura. Si ya trabajas, busca una reconversión por capas: primero automatizar o mejorar tu rol actual, luego moverte hacia un rol híbrido y recién después cambiar de industria si tiene sentido.</p>
    `,
  },
  {
    slug: "roles-tecnologicos-proyeccion-2030",
    titulo: "Roles tecnológicos con mayor proyección: IA, datos, ciberseguridad y automatización",
    resumen:
      "Una guía para entender qué roles tecnológicos conviene mirar, qué habilidades piden y cómo entrar sin perderse en nombres de moda.",
    categoria: "Tecnología",
    audiencia: "adulto",
    autor: "Equipo Vocari",
    fecha: "2026-06-26",
    emoji: "IA",
    lectura: 9,
    fuentes: [sourceLibrary.wef, sourceLibrary.oecd, sourceLibrary.mifuturo],
    roles: {
      tecnologicos: ["Analista de datos", "AI product builder", "Ciberseguridad", "Cloud support", "Automatización"],
      noTecnologicos: ["Product owner", "Soporte técnico funcional", "Ventas técnicas"],
    },
    rutas: [
      "Parte por fundamentos: lógica, datos, seguridad básica y documentación.",
      "Elige una ruta aplicada: datos, IA aplicada, ciberseguridad, cloud o automatización.",
      "Publica un portafolio con 2 o 3 proyectos que resuelvan problemas reales.",
    ],
    contenido: `
      <h2>La tecnología 2030 no será solo programar</h2>
      <p>Los roles tecnológicos de mayor proyección mezclan software, datos, seguridad, producto y conocimiento de negocio. La ventaja no estará solo en escribir código, sino en traducir problemas humanos y operacionales a sistemas que funcionen.</p>
      <h2>Roles a mirar</h2>
      <ul>
        <li><strong>Analista de datos y BI:</strong> convierte bases de datos en decisiones. Buena puerta de entrada para perfiles de administración, ingeniería, educación o ventas.</li>
        <li><strong>IA aplicada:</strong> diseña flujos con modelos, evalúa resultados y reduce riesgos. Requiere criterio, pruebas y conocimiento de dominio.</li>
        <li><strong>Ciberseguridad:</strong> protege sistemas, identidades y datos. Crece con la digitalización de empresas y servicios públicos.</li>
        <li><strong>Automatización y no-code ops:</strong> mejora procesos con herramientas digitales, integraciones y agentes simples.</li>
        <li><strong>Cloud y soporte técnico funcional:</strong> conecta infraestructura, usuarios y continuidad operacional.</li>
      </ul>
      <h2>Ruta sugerida para entrar</h2>
      <p>Aprende fundamentos primero, elige una especialidad y construye evidencia. Un portafolio simple puede pesar más que acumular cursos: dashboard de datos, automatización de un proceso, evaluación de un chatbot o checklist de seguridad para una pyme.</p>
      <h2>Qué mirar en Chile</h2>
      <p>Usa MiFuturo para comparar empleabilidad e ingresos de carreras relacionadas, y revisa perfiles técnicos o certificables cuando la ruta no requiera necesariamente una carrera universitaria completa.</p>
    `,
  },
  {
    slug: "roles-no-tecnologicos-que-creceran-2030",
    titulo: "Roles no tecnológicos que crecerán: salud, cuidados, educación, logística, energía y construcción",
    resumen:
      "No todo el futuro laboral será software. Hay áreas humanas, técnicas y territoriales que pueden crecer si incorporan datos y mejores procesos.",
    categoria: "Salud y cuidados",
    audiencia: "mixto",
    autor: "Equipo Vocari",
    fecha: "2026-06-25",
    emoji: "RUTAS",
    lectura: 8,
    fuentes: [sourceLibrary.ilo, sourceLibrary.observatorio, sourceLibrary.mctp, sourceLibrary.chilevalora],
    roles: {
      tecnologicos: ["Soporte de sistemas clínicos", "Analítica operacional", "Automatización administrativa"],
      noTecnologicos: ["Técnicos de salud", "Cuidadores", "Formadores", "Logística", "Energía", "Construcción"],
    },
    rutas: [
      "Busca sectores con demanda local sostenida: salud, educación, logística, energía o construcción.",
      "Suma alfabetización digital: planillas, reportes, herramientas IA y gestión de datos simples.",
      "Valida competencias con certificaciones técnicas cuando existan perfiles reconocidos.",
    ],
    contenido: `
      <h2>El futuro también será profundamente humano</h2>
      <p>La automatización cambia tareas, pero no elimina la necesidad de cuidado, coordinación, formación, mantención y operación en terreno. De hecho, muchas ocupaciones no tecnológicas crecerán si incorporan herramientas digitales sin perder el trato humano.</p>
      <h2>Áreas con señales fuertes</h2>
      <ul>
        <li><strong>Salud y cuidados:</strong> técnicos, cuidadores, coordinación de pacientes, salud mental y apoyo comunitario.</li>
        <li><strong>Educación y formación:</strong> docentes, tutores, diseñadores instruccionales y capacitadores internos.</li>
        <li><strong>Logística:</strong> planificación, bodegas, última milla, compras y control operacional.</li>
        <li><strong>Energía y construcción:</strong> mantención, eficiencia energética, seguridad, obras y supervisión técnica.</li>
        <li><strong>Servicios territoriales:</strong> turismo, agro, minería, comercio y gestión de comunidades.</li>
      </ul>
      <h2>La habilidad puente</h2>
      <p>La clave no es convertir todos estos roles en "tech", sino agregar una capa digital: reportes, trazabilidad, uso básico de datos, comunicación con clientes, herramientas IA y mejora continua.</p>
      <h2>Rutas chilenas posibles</h2>
      <p>El Marco de Cualificaciones Técnico Profesional ayuda a ordenar niveles de formación, y ChileValora permite identificar perfiles ocupacionales certificables. Para una persona adulta, esta ruta puede ser más realista que partir de cero con una carrera larga.</p>
    `,
  },
  {
    slug: "rutas-reconversion-laboral-ia",
    titulo: "Rutas de reconversión laboral: de administración, ventas, educación u oficios hacia roles con IA",
    resumen:
      "Ejemplos concretos para transformar experiencia previa en rutas laborales con IA aplicada, datos o automatización.",
    categoria: "Reconversión",
    audiencia: "adulto",
    autor: "Equipo Vocari",
    fecha: "2026-06-24",
    emoji: "MAPA",
    lectura: 9,
    fuentes: [sourceLibrary.wef, sourceLibrary.ilo, sourceLibrary.chilevalora],
    roles: {
      tecnologicos: ["Data analyst junior", "Automatizador de procesos", "AI operations", "Customer success técnico"],
      noTecnologicos: ["Administración", "Ventas", "Docencia", "Oficios técnicos"],
    },
    rutas: [
      "Administración a automatización: planillas, procesos, Zapier/Make, reporting y control.",
      "Ventas a customer success técnico: CRM, datos de clientes, demos y onboarding.",
      "Educación a diseño instruccional IA: contenidos, evaluación, tutoría y analítica de aprendizaje.",
      "Oficios a técnico digital: sensores, mantención, seguridad, documentación y mejora continua.",
    ],
    contenido: `
      <h2>La reconversión más fuerte parte desde lo que ya sabes</h2>
      <p>No conviene borrar tu historia laboral. Una persona que viene de administración entiende procesos; alguien de ventas entiende clientes; una docente entiende aprendizaje; un técnico entiende operación real. La IA agrega una capa nueva sobre esas fortalezas.</p>
      <h2>Cuatro rutas concretas</h2>
      <ul>
        <li><strong>Administración → automatización de procesos:</strong> documentar tareas, limpiar datos, crear reportes, automatizar flujos y medir tiempos.</li>
        <li><strong>Ventas → customer success técnico:</strong> CRM, análisis de clientes, demos, onboarding y comunicación consultiva.</li>
        <li><strong>Educación → diseño instruccional con IA:</strong> crear materiales, evaluar aprendizaje, diseñar rutas y acompañar estudiantes.</li>
        <li><strong>Oficios → técnico digital:</strong> sensores, mantención preventiva, seguridad, inventarios, registros y datos de operación.</li>
      </ul>
      <h2>Qué estudiar primero</h2>
      <p>Empieza por una herramienta que mejore tu trabajo actual. Luego suma fundamentos: datos, automatización, ética y seguridad. Finalmente, arma un proyecto visible: una automatización, un tablero, un manual operativo o un asistente para un proceso real.</p>
      <h2>Motivación realista</h2>
      <p>Reconvertirse no significa convertirse en otra persona. Significa actualizar tu valor para un mercado donde aprender rápido, verificar información y trabajar con tecnología será parte normal de casi todos los roles.</p>
    `,
  },
  {
    slug: "elegir-carrera-vocacion-empleabilidad-aprendizaje",
    titulo: "Cómo elegir una carrera mirando vocación, empleabilidad y aprendizaje continuo",
    resumen:
      "Una fórmula simple para decidir mejor: intereses, datos laborales, rutas educativas y capacidad de adaptación.",
    categoria: "Educación",
    audiencia: "joven",
    autor: "Equipo Vocari",
    fecha: "2026-06-23",
    emoji: "GUIA",
    lectura: 7,
    fuentes: [sourceLibrary.mifuturo, sourceLibrary.mctp, sourceLibrary.wef],
    roles: {
      tecnologicos: ["Datos", "IA aplicada", "Producto digital"],
      noTecnologicos: ["Salud", "Educación", "Gestión", "Oficios TP"],
    },
    rutas: [
      "Haz un test de intereses y compara el resultado con carreras reales.",
      "Revisa empleabilidad e ingresos, pero también malla, prácticas y campo laboral.",
      "Elige una carrera que permita seguir aprendiendo cada 12 meses.",
    ],
    contenido: `
      <h2>Vocación sin datos puede dejarte a ciegas</h2>
      <p>Y datos sin vocación puede llevarte a una carrera que no sostendrás. La mejor decisión combina tres capas: intereses personales, evidencia laboral y capacidad de aprendizaje continuo.</p>
      <h2>Una fórmula útil</h2>
      <ol>
        <li><strong>Intereses:</strong> identifica ambientes donde podrías aprender con energía. RIASEC ayuda a ordenar esa información.</li>
        <li><strong>Datos:</strong> revisa empleabilidad, ingresos y continuidad de estudios en fuentes como MiFuturo.</li>
        <li><strong>Ruta:</strong> compara universidad, instituto profesional, CFT, certificaciones y aprendizaje por proyectos.</li>
        <li><strong>Adaptabilidad:</strong> pregúntate qué habilidad podrías actualizar cada año: datos, IA, comunicación, inglés, gestión o especialidad técnica.</li>
      </ol>
      <h2>Qué evitar</h2>
      <p>No elijas solo por moda, sueldo promedio o presión familiar. Tampoco descartes carreras humanas o técnicas por creer que "todo será IA". Muchas áreas crecerán precisamente porque combinan trato humano con herramientas digitales.</p>
      <h2>La decisión madura</h2>
      <p>Una buena carrera no es una promesa para toda la vida; es una base desde la cual podrás seguir construyendo. El objetivo no es adivinar 2030, sino elegir una ruta que te permita moverte cuando el mercado cambie.</p>
    `,
  },
  {
    slug: "educacion-corta-tecnica-universitaria",
    titulo: "Educación corta, técnica o universitaria: cómo decidir según tu etapa",
    resumen:
      "No todas las personas necesitan la misma ruta. Compara educación técnica, certificaciones, universidad y bootcamps según edad, recursos y objetivo laboral.",
    categoria: "Oficios y TP",
    audiencia: "mixto",
    autor: "Equipo Vocari",
    fecha: "2026-06-22",
    emoji: "TP",
    lectura: 8,
    fuentes: [sourceLibrary.mifuturo, sourceLibrary.mctp, sourceLibrary.chilevalora, sourceLibrary.observatorio],
    roles: {
      tecnologicos: ["Soporte TI", "Datos junior", "Automatización", "QA"],
      noTecnologicos: ["Técnico en salud", "Logística", "Energía", "Administración", "Mantención"],
    },
    rutas: [
      "Si necesitas empleabilidad rápida, evalúa CFT/IP, certificaciones y perfiles ChileValora.",
      "Si buscas profesión regulada o investigación, evalúa ruta universitaria.",
      "Si ya tienes experiencia, usa formación corta para agregar una capa digital o técnica.",
    ],
    contenido: `
      <h2>No existe una sola ruta correcta</h2>
      <p>La educación universitaria puede ser clave en profesiones reguladas, investigación o trayectorias largas. Pero la educación técnico profesional, certificaciones y programas cortos pueden ser mejores si necesitas entrar o moverte rápido en el mercado laboral.</p>
      <h2>Cuándo mirar una ruta técnica</h2>
      <p>Si te interesa salud, logística, energía, construcción, administración, soporte TI o mantención, una ruta técnica puede entregar habilidades aplicables y continuidad de estudios. El Marco de Cualificaciones Técnico Profesional ayuda a ordenar niveles y progresión.</p>
      <h2>Cuándo mirar universidad</h2>
      <p>Si tu objetivo requiere licenciatura, investigación, especialidad profesional o habilitación legal, la universidad sigue siendo una ruta fuerte. La clave es comparar malla, empleabilidad, acreditación, prácticas y costo total.</p>
      <h2>Cuándo mirar certificaciones o bootcamps</h2>
      <p>Funcionan mejor cuando ya tienes una base laboral y quieres sumar una habilidad concreta: análisis de datos, automatización, soporte, inglés, gestión de proyectos o herramientas IA. El riesgo es creer que un curso aislado reemplaza experiencia; por eso debe terminar en proyecto demostrable.</p>
    `,
  },
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
