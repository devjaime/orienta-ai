# GUION TÉCNICO PARA VIDEO LINKEDIN - ORIENTA AI

## ESTRUCTURA RECOMENDADA (5-7 minutos)

### 1. INTRODUCCIÓN (30 segundos)
**Qué decir:**
"Hola, soy [tu nombre] y hoy quiero mostrarles OrientaIA, una plataforma de orientación vocacional que desarrollé combinando React, Supabase y Claude AI. Es un sistema completo que ayuda a jóvenes a descubrir su vocación profesional usando el test RIASEC más análisis de inteligencia artificial."

**Qué mostrar:**
- Landing page en pantalla
- Navegación rápida por las secciones principales

---

### 2. ARQUITECTURA TÉCNICA (1 minuto)
**Qué decir:**
"La arquitectura está construida sobre un stack moderno y escalable:

- **Frontend**: React 19 con Vite como bundler, lo que nos da hot module replacement ultra rápido
- **Styling**: Tailwind CSS con una paleta personalizada (azul oscuro 0C1E3C y celeste 33B5E5)
- **Base de datos**: Supabase PostgreSQL con Row Level Security habilitado
- **Autenticación**: OAuth 2.0 con Google gestionado por Supabase Auth
- **IA**: Claude API de Anthropic, específicamente el modelo Sonnet 3.5
- **Backend**: Netlify Functions para operaciones serverless
- **Deploy**: Netlify con builds automáticos desde Git"

**Qué mostrar:**
- Diagrama de arquitectura (puedes dibujar uno en pantalla)
- package.json mostrando las dependencias principales
- netlify.toml

**Código a destacar:**
```bash
# Mostrar estructura de carpetas
src/
├── components/  # 10+ componentes reutilizables
├── pages/       # 7 páginas principales
├── lib/         # Lógica de negocio
└── data/        # 36 preguntas + 30 carreras
```

---

### 3. SISTEMA DE AUTENTICACIÓN (1 minuto)
**Qué decir:**
"El flujo de autenticación es crítico para la seguridad. Implementé OAuth 2.0 con Google usando Supabase Auth.

El flujo funciona así:
1. Usuario hace clic en 'Continuar con Google'
2. Se abre el OAuth flow de Google
3. Después de autorizar, Google redirige a `/auth/callback`
4. Mi componente AuthCallback verifica la sesión
5. Si es usuario nuevo, lo llevo a completar su perfil
6. Si ya existe, lo redirijo al test o su destino original

Un detalle importante: en Netlify tuve que configurar un SPA fallback para que las rutas de React Router funcionen correctamente en producción."

**Qué mostrar:**
- Código de `src/lib/supabase.js` línea 23-41 (función signInWithGoogle)
- `src/pages/AuthCallback.jsx` - el handler del callback
- `netlify.toml` líneas 10-13 (el redirect catch-all)
- Demostración en vivo del login

**Código a destacar:**
```javascript
// src/lib/supabase.js
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  // ...
}
```

---

### 4. BASE DE DATOS Y SEGURIDAD (1 minuto)
**Qué decir:**
"La base de datos tiene 3 tablas principales con Row Level Security:

1. **user_profiles**: Información del usuario con roles (user, orientador, admin)
2. **test_results**: Resultados del test RIASEC con puntajes, código Holland y análisis de IA
3. **scheduled_sessions**: Sesiones agendadas con orientadores

La seguridad es fundamental. Implementé políticas RLS para que:
- Los usuarios solo vean sus propios datos
- Los orientadores vean todos los tests para análisis
- Los admins tengan control total del sistema

Esto se hace directamente en PostgreSQL usando policies, no en el código, lo que es mucho más seguro."

**Qué mostrar:**
- Dashboard de Supabase mostrando las tablas
- Ejemplo de una política RLS
- Código de `src/lib/supabase.js` mostrando helpers como getUserProfile(), hasRole()

**Código SQL a mencionar:**
```sql
-- Ejemplo de RLS Policy
CREATE POLICY "Usuarios ven solo sus tests"
  ON test_results
  FOR ALL
  USING (auth.uid() = user_id);
```

---

### 5. TEST RIASEC Y ALGORITMO (1.5 minutos) ⭐ PUNTO FUERTE
**Qué decir:**
"El corazón de la aplicación es el test RIASEC basado en la teoría de Holland. Son 36 preguntas que miden 6 dimensiones de personalidad vocacional:

- **R**ealista: Personas prácticas, técnicas
- **I**nvestigador: Analíticos, curiosos
- **A**rtístico: Creativos, expresivos
- **S**ocial: Empáticos, colaborativos
- **E**mprendedor: Líderes, persuasivos
- **C**onvencional: Organizados, detallistas

El algoritmo que desarrollé hace esto:
1. Suma los puntajes por cada dimensión (rango 6-30)
2. Ordena de mayor a menor
3. Aplica un sistema de desempate inteligente basado en intensidad de respuestas
4. Genera el código Holland con las top 3 letras (ejemplo: ISA)
5. Calcula la certeza: Alta, Media o Exploratoria según la diferencia entre puntajes

Lo interesante es el sistema de desempate. Si dos dimensiones tienen el mismo puntaje, comparo cuántas respuestas fueron 4 o 5 (alta intensidad) versus 1 o 2 (rechazo). Esto da resultados mucho más precisos."

**Qué mostrar:**
- `src/data/riasecQuestions.js` - las 36 preguntas
- `src/lib/riasecScoring.js` - el algoritmo completo
- Interfaz del test con progress bar
- Página de resultados mostrando el código y puntajes

**Código a destacar:**
```javascript
// src/lib/riasecScoring.js - líneas 45-70
export function calcularCodigoRIASEC(responses) {
  // 1. Calcular puntajes
  const puntajes = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  // 2. Sistema de desempate
  const intensidadAlta = contarRespuestas(responses, [4, 5]);
  const rechazo = contarRespuestas(responses, [1, 2]);

  // 3. Generar código Holland (top 3)
  const codigo_holland = ranking.slice(0, 3)
    .map(item => item.dimension)
    .join('');

  return { codigo_holland, certeza, puntajes, ranking };
}
```

---

### 6. INTEGRACIÓN CON CLAUDE AI (1.5 minutos) ⭐ PUNTO FUERTE
**Qué decir:**
"Una vez que el usuario completa el test, aquí es donde entra la inteligencia artificial. Desarrollé una integración con Claude API de Anthropic.

El flujo es así:
1. El frontend envía el código Holland, puntajes y ranking completo
2. Mi función serverless en Netlify recibe esta data
3. Construyo un prompt especializado que le da contexto a Claude sobre qué es RIASEC
4. Claude genera un análisis personalizado de 250-300 palabras
5. El texto vuelve al frontend y se muestra junto con las carreras recomendadas

Lo interesante es que uso dos tipos de prompts:
- **Tipo 'explicacion'**: Para el análisis inicial detallado
- **Tipo 'conversacion'**: Para el chat interactivo donde los usuarios pueden hacer preguntas

El prompt de conversación configura a Claude como un orientador vocacional experto que habla en tono cercano y motivador, perfecto para jóvenes de 16-24 años."

**Qué mostrar:**
- `netlify/functions/generate-explanation.js` - función serverless
- Consola mostrando la llamada a Claude API
- Resultado real de IA en la página de resultados
- Chat interactivo en funcionamiento

**Código a destacar:**
```javascript
// netlify/functions/generate-explanation.js
const prompt = tipo === 'explicacion'
  ? `Eres un orientador vocacional experto. Analiza este perfil RIASEC:
     Código: ${codigo_holland}
     Top 3: ${ranking_completo.slice(0,3).map(d => d.dimension).join(', ')}

     Genera un análisis personalizado de 250-300 palabras...`
  : `Eres un orientador experto hablando con un joven...`;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': CLAUDE_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  })
});
```

---

### 7. MOTOR DE RECOMENDACIÓN DE CARRERAS (1 minuto)
**Qué decir:**
"Tengo una base de 30 carreras chilenas cuidadosamente seleccionadas, cada una con su propio código Holland.

El motor de recomendación funciona calculando compatibilidad entre el código del usuario y el de cada carrera:
- Si coincide la primera letra: +40 puntos
- Segunda letra: +25 puntos
- Tercera letra: +15 puntos
- Bonus si aparece en cualquier posición: +10 puntos

Esto genera un score de 0-100 por carrera. Luego ordeno por score y muestro el top 6.

Cada carrera incluye:
- Descripción completa
- Universidades destacadas en Chile
- Salario promedio en CLP
- Empleabilidad (Alta, Muy Alta, Media)
- Campos laborales
- Duración de la carrera
- Nivel de matemáticas requerido"

**Qué mostrar:**
- `src/data/carreras.json` - estructura de datos
- `src/lib/recomendacionCarreras.js` - algoritmo de matching
- Componente CarrerasRecomendadas expandido mostrando detalles
- Filtros y ordenamiento funcionando

**Código a destacar:**
```javascript
// src/lib/recomendacionCarreras.js
function calcularCompatibilidad(codigoUsuario, codigoCarrera) {
  let score = 0;

  // Coincidencia exacta en posición
  if (codigoUsuario[0] === codigoCarrera[0]) score += 40;
  if (codigoUsuario[1] === codigoCarrera[1]) score += 25;
  if (codigoUsuario[2] === codigoCarrera[2]) score += 15;

  // Bonus por aparecer en código
  for (let letra of codigoUsuario) {
    if (codigoCarrera.includes(letra)) score += 10;
  }

  return Math.min(score, 100);
}
```

---

### 8. DASHBOARDS DE ORIENTADOR Y ADMIN (45 segundos)
**Qué decir:**
"Implementé un sistema de roles con 3 niveles:
- **User**: Acceso básico al test
- **Orientador**: Dashboard con todos los usuarios, tests y sesiones agendadas
- **Admin**: Control total incluyendo cambio de roles

El dashboard de orientador permite:
- Ver historial de todos los tests realizados
- Gestionar sesiones agendadas con estudiantes
- Buscar usuarios por email o nombre
- Ver estadísticas generales del sistema

Todo protegido con Row Level Security a nivel de base de datos."

**Qué mostrar:**
- Login como orientador
- Dashboard mostrando las 3 pestañas (Usuarios, Tests, Sesiones)
- Búsqueda en tiempo real
- Vista del Admin Dashboard cambiando roles

---

### 9. FEATURES ADICIONALES (30 segundos)
**Qué decir:**
"Algunas features adicionales que implementé:

1. **Chat IA flotante**: Los usuarios pueden hacer preguntas antes de hacer el test
2. **Widget embebible**: Se puede incrustar el test en cualquier sitio web vía iframe
3. **Agendamiento**: Integración con Google Calendar para agendar sesiones
4. **Animaciones**: Todo usa Framer Motion para transiciones fluidas
5. **Responsive**: Funciona perfecto desde mobile hasta 4K"

**Qué mostrar:**
- Chat flotante en acción
- Widget embebible
- Botón de agendar sesión
- Vista mobile del sitio

---

### 10. TECNOLOGÍAS Y APRENDIZAJES (1 minuto)
**Qué decir:**
"Este proyecto me permitió trabajar con tecnologías modernas:

**Lo que más me gustó:**
- La integración con Claude API es increíblemente poderosa para análisis de texto
- Supabase hace que manejar autenticación y base de datos sea trivial
- Netlify Functions son perfectas para APIs pequeñas sin servidor completo
- React 19 con hooks hace que el código sea muy limpio y mantenible

**Desafíos técnicos que resolví:**
- Implementar un sistema de desempate robusto para el algoritmo RIASEC
- Configurar SPA fallback en Netlify para que las rutas funcionen correctamente
- Diseñar un prompt efectivo para Claude que genere respuestas consistentes
- Implementar Row Level Security correctamente en Supabase

**Próximos pasos:**
- Migrar a TypeScript para mayor type safety
- Agregar tests unitarios con Jest
- Implementar analytics con Mixpanel
- Machine Learning para mejorar las recomendaciones"

**Qué mostrar:**
- package.json con dependencias
- Git log mostrando commits
- Netlify dashboard con builds exitosos

---

### 11. DEMO EN VIVO (1 minuto)
**Qué decir:**
"Déjame mostrarte el flujo completo en acción rápidamente."

**Qué hacer:**
1. Abrir landing page
2. Hacer clic en "Comenzar test"
3. Login con Google (mostrar el callback funcionando)
4. Completar 3-4 preguntas del test (mostrar progress bar)
5. Saltar al final y enviar
6. Mostrar resultados con IA + carreras
7. Expandir una carrera para ver detalles
8. Abrir dashboard de orientador

---

### 12. CIERRE Y CALL TO ACTION (30 segundos)
**Qué decir:**
"Este fue OrientaIA, una plataforma completa de orientación vocacional construida con React, Supabase y Claude AI.

El código está en GitHub (opcional: dar link)
El sitio está live en [tu URL de Netlify]

Si estás trabajando en proyectos similares o tienes preguntas sobre alguna de estas tecnologías, déjame un comentario o escríbeme.

Gracias por ver!"

**Qué mostrar:**
- Pantalla final con tu información de contacto
- Links al proyecto

---

## TIPS PARA LA GRABACIÓN

### Técnicos:
- **Grabador de pantalla**: OBS Studio o Loom
- **Resolución**: 1920x1080 mínimo
- **Audio**: Usa micrófono externo, no el del laptop
- **Cursor**: Activa highlight del cursor para que sea visible
- **Zoom**: Haz zoom en el código importante

### Presentación:
- **Ritmo**: Habla claramente pero con energía
- **Pausas**: Deja 2-3 segundos de silencio entre secciones para editar después
- **Código**: No leas código línea por línea, explica el concepto
- **Pantalla**: Cierra pestañas innecesarias antes de grabar
- **IDE**: Usa tema oscuro con fuente grande (14-16pt)

### Edición:
- **Cortes**: Elimina pausas largas y "ehhh"
- **Velocidad**: Acelera secciones repetitivas 1.25x
- **Subtítulos**: Agrégalos en LinkedIn después de subir
- **Intro**: 3-5 segundos con tu nombre y título del proyecto
- **Outro**: 5 segundos con CTA

---

## VARIANTES SEGÚN DURACIÓN

### Versión Corta (3 minutos)
Enfócate en:
1. Introducción (20s)
2. Stack técnico (30s)
3. Test RIASEC + Algoritmo (60s)
4. Integración Claude AI (60s)
5. Demo rápida (30s)
6. Cierre (20s)

### Versión Media (5 minutos) ✅ RECOMENDADA
Usa el guion completo arriba

### Versión Larga (10 minutos)
Agrega:
- Deep dive en cada función del algoritmo
- Mostrar más código
- Explicar decisiones de arquitectura
- Mostrar pruebas en diferentes dispositivos

---

## HASHTAGS SUGERIDOS PARA LINKEDIN

```
#ReactJS #JavaScript #WebDevelopment #AI #ClaudeAI #Supabase
#Netlify #FullStack #OpenToWork #SoftwareEngineering #CareerGuidance
#EdTech #TailwindCSS #PostgreSQL #Serverless #OAuth
```

---

## ESTRUCTURA DE POST DE LINKEDIN

```
🚀 Te presento OrientaIA: Plataforma de orientación vocacional con IA

Combiné React + Supabase + Claude AI para crear una solución completa
que ayuda a jóvenes a descubrir su vocación profesional.

🔧 Stack técnico:
• React 19 + Vite
• Supabase (PostgreSQL + Auth)
• Claude API (Anthropic)
• Netlify Functions
• Tailwind CSS

✨ Features destacadas:
• Test RIASEC de 36 preguntas
• Algoritmo de scoring con sistema de desempate
• Análisis personalizado con IA
• Recomendación de 30 carreras chilenas
• Dashboard para orientadores
• OAuth 2.0 con Google

En el video te muestro cómo funciona cada componente 👇

#ReactJS #AI #WebDevelopment #Supabase
```

---

**¡Éxito con tu video! 🎥**
