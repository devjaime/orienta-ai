export const FUTURE_LABOR_HUB_SLUG = "futuro-laboral-2030";

export const sourceLibrary = {
  wef: {
    nombre: "World Economic Forum - Future of Jobs Report 2025",
    url: "https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/",
  },
  oecd: {
    nombre: "OECD Employment Outlook 2023",
    url: "https://www.oecd.org/en/publications/oecd-employment-outlook-2023_08785bba-en.html",
  },
  ilo: {
    nombre: "ILO - Generative AI and Jobs",
    url: "https://www.ilo.org/publications/generative-ai-and-jobs-global-analysis-potential-effects-job-quantity-and",
  },
  mifuturo: {
    nombre: "MiFuturo / MINEDUC - empleabilidad e ingresos",
    url: "https://www.mifuturo.cl/",
  },
  observatorio: {
    nombre: "Observatorio Laboral - SENCE",
    url: "https://www.observatorionacional.cl/",
  },
  mctp: {
    nombre: "Marco de Cualificaciones Técnico Profesional",
    url: "https://marcodecualificacionestp.mineduc.cl/",
  },
  chilevalora: {
    nombre: "ChileValora - perfiles ocupacionales",
    url: "https://certificacion.chilevalora.cl/ChileValora-publica/perfilesList.html",
  },
};

export const futureLaborStats = [
  {
    value: "22%",
    label: "de los empleos cambiarían estructuralmente al 2030",
    source: "WEF 2025",
  },
  {
    value: "170M",
    label: "nuevos roles proyectados globalmente hacia 2030",
    source: "WEF 2025",
  },
  {
    value: "92M",
    label: "roles desplazados por transición tecnológica y económica",
    source: "WEF 2025",
  },
  {
    value: "59%",
    label: "de trabajadores requeriría upskilling o reskilling",
    source: "WEF 2025",
  },
];

export const futureLaborScenarios = [
  {
    title: "Aceleración IA",
    tag: "Productividad + criterio humano",
    text: "La IA generativa automatiza tareas de oficina, soporte, análisis y contenido, pero aumenta el valor de quienes sepan definir problemas, verificar resultados y coordinar sistemas.",
  },
  {
    title: "Transición verde",
    tag: "Energía, datos y operación",
    text: "Crecen funciones ligadas a eficiencia energética, electromovilidad, mantenimiento, gestión ambiental, construcción sostenible y monitoreo de indicadores.",
  },
  {
    title: "Salud y cuidados",
    tag: "Demografía + bienestar",
    text: "El envejecimiento y la salud mental elevan la demanda por técnicos, profesionales clínicos, cuidadores, coordinación de servicios y tecnología asistiva.",
  },
  {
    title: "Economía territorial",
    tag: "Logística, agro, minería y servicios",
    text: "Chile necesitará perfiles que conecten operación real con datos: supervisión, seguridad, mantención, ventas técnicas y mejora continua en regiones.",
  },
];

export const futureLaborRoleGroups = [
  {
    title: "Roles tecnológicos",
    roles: [
      "Analista de datos y BI",
      "Especialista en IA aplicada",
      "Ciberseguridad",
      "Automatización y no-code ops",
      "Cloud, soporte e integración",
      "Diseño de producto digital",
    ],
  },
  {
    title: "Roles no tecnológicos",
    roles: [
      "Técnicos de salud y cuidados",
      "Docencia y formación corporativa",
      "Logística y coordinación operacional",
      "Energía, mantención y construcción",
      "Ventas consultivas y customer success",
      "Administración con herramientas IA",
    ],
  },
];

export const futureLaborRoutes = [
  {
    title: "Si estás eligiendo carrera",
    steps: [
      "Cruza intereses RIASEC con empleabilidad e ingresos en MiFuturo.",
      "Compara rutas universitarias, técnico profesionales y certificables.",
      "Elige una carrera base y una habilidad transferible: datos, comunicación, inglés o automatización.",
    ],
  },
  {
    title: "Si ya trabajas y quieres reconvertirte",
    steps: [
      "Mapea experiencia previa: procesos, clientes, operación, educación o administración.",
      "Elige una ruta de 8 a 16 semanas con proyecto demostrable.",
      "Certifica habilidades cuando exista perfil ChileValora o marco técnico relacionado.",
    ],
  },
];

export const futureLaborFeaturedSlugs = [
  "trabajo-2030-que-cambiara-y-que-no",
  "roles-tecnologicos-proyeccion-2030",
  "roles-no-tecnologicos-que-creceran-2030",
  "rutas-reconversion-laboral-ia",
  "elegir-carrera-vocacion-empleabilidad-aprendizaje",
  "educacion-corta-tecnica-universitaria",
];
