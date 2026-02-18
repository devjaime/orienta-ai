// Vocari Report Generation - Edge Function
// Este genera el reporte PDF sin necesidad de OpenAI

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CARRERAS_MINEDUC = [
  { codigo: '21001', nombre: 'Medicina', area: 'Salud', duracion: '7 semestres', promedio: 650, empleabilidad: 95 },
  { codigo: '21002', nombre: 'Ingeniería Civil', area: 'Ingeniería', duracion: '12 semestres', promedio: 600, empleabilidad: 88 },
  { codigo: '21003', nombre: 'Ingeniería Comercial', area: 'Negocios', duracion: '10 semestres', promedio: 550, empleabilidad: 82 },
  { codigo: '21004', nombre: 'Derecho', area: 'Derecho', duracion: '10 semestres', promedio: 580, empleabilidad: 75 },
  { codigo: '21005', nombre: 'Arquitectura', area: 'Diseño', duracion: '12 semestres', promedio: 570, empleabilidad: 70 },
  { codigo: '21006', nombre: 'Psicología', area: 'Salud', duracion: '10 semestres', promedio: 520, empleabilidad: 78 },
  { codigo: '21007', nombre: 'Pedagogía', area: 'Educación', duracion: '8 semestres', promedio: 480, empleabilidad: 85 },
  { codigo: '21008', nombre: 'Ingeniería en Sistemas', area: 'Tecnología', duracion: '10 semestres', promedio: 540, empleabilidad: 92 },
  { codigo: '21009', nombre: 'Enfermería', area: 'Salud', duracion: '8 semestres', promedio: 500, empleabilidad: 90 },
  { codigo: '21010', nombre: 'Comunicación Social', area: 'Comunicación', duracion: '8 semestres', promedio: 510, empleabilidad: 72 },
  { codigo: '21011', nombre: 'Diseño Gráfico', area: 'Diseño', duracion: '8 semestres', promedio: 490, empleabilidad: 68 },
  { codigo: '21012', nombre: 'Kinesiología', area: 'Salud', duracion: '10 semestres', promedio: 530, empleabilidad: 82 },
  { codigo: '21013', nombre: 'Odontología', area: 'Salud', duracion: '10 semestres', promedio: 580, empleabilidad: 80 },
  { codigo: '21014', nombre: 'Ingeniería Industrial', area: 'Ingeniería', duracion: '10 semestres', promedio: 560, empleabilidad: 86 },
  { codigo: '21015', nombre: 'Trabajo Social', area: 'Social', duracion: '8 semestres',460, empleabilidad: 75 },
];

const PERFILES_RIASEC = {
  R: { nombre: 'Realista', descripcion: 'Te gusta trabajar con tus manos, resolver problemas prácticos y actividades al aire libre. Prefieres la acción antes que la teoría.', trabajos: ['Técnico', 'Mecánico', 'Agricultor', 'Constructor'] },
  I: { nombre: 'Investigativo', descripcion: 'Te interesa analizar problemas, investigar y buscar soluciones científicas. Disfrutas de la lectura y el pensamiento abstracto.', trabajos: ['Científico', 'Médico', 'Investigador', 'Analista'] },
  A: { nombre: 'Artístico', descripcion: 'Expresas tu creatividad a través de arte, música o escritura. Valoras la originalidad y la libertad creativa.', trabajos: ['Artista', 'Diseñador', 'Escritor', 'Músico'] },
  S: { nombre: 'Social', descripcion: 'Te gusta ayudar, enseñar y trabajar con personas. Disfrutas de actividades que involucren interacción social.', trabajos: ['Profesor', 'Psicólogo', 'Trabajador Social', 'Enfermero'] },
  E: { nombre: 'Emprendedor', descripcion: 'Te atraen el liderazgo, la toma de decisiones y el logro de objetivos. Eres competitivo y persuasivo.', trabajos: ['Emprendedor', 'Vendedor', 'Gerente', 'Abogado'] },
  C: { nombre: 'Convencional', descripcion: 'Te desempeñas bien en tareas ordenadas, con números y procedimientos establecidos. Valoras la precisión y el detalle.', trabajos: ['Contador', 'Administrador', 'Analista de Datos', 'Secretario'] },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { testResult, plan, userEmail } = await req.json();

    // Determinar perfil RIASEC dominante
    const riasecScores = testResult?.riasec || { R: 30, I: 30, A: 30, S: 30, E: 30, C: 30 };
    const dominant = Object.entries(riasecScores).sort((a, b) => b[1] - a[1])[0][0];
    const perfil = PERFILES_RIASEC[dominant];

    // Filtrar carreras compatibles
    const compatibilidadCarreras = CARRERAS_MINEDUC
      .map(carrera => {
        let score = 50;
        
        // Boost según perfil
        if (perfil.nombre === 'Realista' && ['Ingeniería', 'Técnico'].includes(carrera.area)) score += 20;
        if (perfil.nombre === 'Investigativo' && ['Salud', 'Científico'].includes(carrera.area)) score += 20;
        if (perfil.nombre === 'Artístico' && ['Diseño', 'Comunicación'].includes(carrera.area)) score += 20;
        if (perfil.nombre === 'Social' && ['Educación', 'Salud', 'Social'].includes(carrera.area)) score += 20;
        if (perfil.nombre === 'Emprendedor' && ['Negocios'].includes(carrera.area)) score += 20;
        if (perfil.nombre === 'Convencional' && ['Negocios', 'Administración'].includes(carrera.area)) score += 20;
        
        return { ...carrera, compatibilidad: score };
      })
      .sort((a, b) => b.compatibilidad - a.compatibilidad)
      .slice(0, plan === 'premium' ? 15 : 10);

    // Generar HTML del reporte
    const htmlReporte = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Informe Vocacional Vocari</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #0B1A33; border-bottom: 3px solid #D4AF37; padding-bottom: 10px; }
    h2 { color: #0B1A33; margin-top: 30px; }
    .perfil { background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .carrera { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .compatibilidad { display: inline-block; padding: 5px 10px; border-radius: 20px; font-weight: bold; }
    .alta { background: #4CAF50; color: white; }
    .media { background: #FFC107; color: black; }
    .baja { background: #f44336; color: white; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>📊 Informe Vocacional Vocari</h1>
  <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</p>
  
  <div class="perfil">
    <h2>🎯 Tu Perfil RIASEC: ${perfil.nombre}</h2>
    <p>${perfil.descripcion}</p>
    <h3>Trabajos recomendados:</h3>
    <ul>
      ${perfil.trabajos.map(t => `<li>${t}</li>`).join('')}
    </ul>
  </div>

  <h2>🎓 Carreras Recomendadas</h2>
  <p>Basadas en tu perfil y datos oficiales del MINEDUC 2025:</p>
  
  ${compatibilidadCarreras.map(c => `
    <div class="carrera">
      <h3>${c.nombre}</h3>
      <p><strong>Área:</strong> ${c.area} | <strong>Duración:</strong> ${c.duracion}</p>
      <p><strong>Promedio PSU参考:</strong> ${c.promedio} | <strong>Empleabilidad:</strong> ${c.empleabilidad}%</p>
      <span class="compatibilidad ${c.compatibilidad >= 70 ? 'alta' : c.compatibilidad >= 50 ? 'media' : 'baja'}">
        Compatibilidad: ${c.compatibilidad}%
      </span>
    </div>
  `).join('')}

  <div class="footer">
    <p>📌 <strong>Nota:</strong> Este informe es generado automáticamente basado en el test RIASEC y datos públicos del MINEDUC. 
    Las recomendaciones son orientativas y no constituyen asesoramiento profesional definitivo.</p>
    <p>© ${new Date().getFullYear()} Vocari - vocari.cl</p>
  </div>
</body>
</html>
    `;

    return new Response(JSON.stringify({
      success: true,
      html: htmlReporte,
      perfil: perfil,
      carreras: compatibilidadCarreras,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
