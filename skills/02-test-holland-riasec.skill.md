# Skill 02: Test Holland RIASEC

## Propósito

Implementar el test vocacional Holland RIASEC con 36 preguntas, scoring determinístico, sistema de desempate y cálculo de nivel de certeza para generar el código vocacional de 3 letras del usuario.

---

## Responsabilidades

- [x] Presentar 36 preguntas del test (6 por dimensión R-I-A-S-E-C)
- [x] Capturar respuestas en escala 1-5
- [x] Calcular puntajes por dimensión
- [x] Aplicar algoritmo de desempate (suma → intensidad → rechazo → alfabético)
- [x] Generar código Holland de 3 letras (ej: "ISA")
- [x] Calcular nivel de certeza (Exploratoria / Media / Alta)
- [x] Guardar resultados en base de datos
- [x] Permitir retomar test incompleto
- [x] Validar que todas las preguntas estén respondidas

---

## Entradas

### Inicio del Test
```typescript
{
  user_id: string,          // UUID del usuario autenticado
  reiniciar?: boolean       // Si true, descarta progreso anterior
}
```

### Respuesta Individual
```typescript
{
  pregunta_id: number,      // 1-36
  dimension: "R" | "I" | "A" | "S" | "E" | "C",
  respuesta: 1 | 2 | 3 | 4 | 5,
  timestamp: string         // ISO 8601
}
```

**Escala de respuestas:**
- `1` = Totalmente en desacuerdo
- `2` = En desacuerdo
- `3` = Neutral
- `4` = De acuerdo
- `5` = Totalmente de acuerdo

---

## Salidas

### Progreso del Test
```typescript
{
  user_id: string,
  preguntas_totales: 36,
  preguntas_respondidas: number,
  progreso_porcentaje: number,    // 0-100
  dimension_actual: string,        // Última dimensión en progreso
  test_completado: boolean,
  ultima_actualizacion: string
}
```

### Resultado Final
```typescript
{
  user_id: string,
  codigo_holland: string,          // Ej: "ISA", "ECS", "RAI"
  certeza: "Exploratoria" | "Media" | "Alta",
  puntajes: {
    R: number,  // 6-30 (6 preguntas x escala 1-5)
    I: number,  // 6-30
    A: number,  // 6-30
    S: number,  // 6-30
    E: number,  // 6-30
    C: number   // 6-30
  },
  ranking_completo: [
    { dimension: "I", puntaje: 28 },
    { dimension: "S", puntaje: 25 },
    { dimension: "A", puntaje: 22 },
    { dimension: "R", puntaje: 18 },
    { dimension: "E", puntaje: 15 },
    { dimension: "C", puntaje: 12 }
  ],
  respuestas: Array<{
    pregunta_id: number,
    dimension: string,
    respuesta: number
  }>,
  fecha_completado: string,
  duracion_minutos: number
}
```

---

## Restricciones

### Negocio
- **36 preguntas obligatorias** (6 por dimensión)
- **No se puede saltar preguntas** (flujo lineal)
- **No hay límite de tiempo** (usuario va a su ritmo)
- **Puede guardar progreso** y retomar después
- **Un test activo por usuario** (puede reiniciar si quiere)

### Técnica
- **Puntaje mínimo por dimensión:** 6 (todas respuestas = 1)
- **Puntaje máximo por dimensión:** 30 (todas respuestas = 5)
- **Código Holland:** Siempre 3 letras, sin repetición
- **Algoritmo determinístico:** Mismo input → mismo output

### UX
- **Duración estimada:** 8-10 minutos
- **Feedback visual:** Barra de progreso clara
- **Guardado automático:** Cada 3 respuestas
- **Mobile-first:** Optimizado para celular
- **Accesibilidad:** Botones grandes, alto contraste

---

## Dependencias

### Externas
- **Supabase Database** - Tabla `test_results` y `test_responses`

### Internas - Frontend
```
src/pages/Test/
├── TestIntro.jsx           # Intro y explicación del test
├── TestQuestion.jsx        # Componente pregunta individual
├── TestProgress.jsx        # Barra de progreso
└── TestComplete.jsx        # Pantalla de finalización

src/lib/test/
├── testQuestions.js        # Array de 36 preguntas
├── scoringAlgorithm.js     # Lógica de cálculo RIASEC
└── useTestProgress.js      # Hook para gestionar progreso
```

### Internas - Backend
```
backend/services/
└── vocational/
    ├── riasec.js           # Algoritmo de scoring
    └── preguntas.json      # 36 preguntas del test

netlify/functions/
├── test-save-progress.js   # Guardar progreso parcial
├── test-submit.js          # Enviar test completo y calcular resultado
└── test-get-progress.js    # Obtener progreso guardado
```

---

## Estados / Flujo

### Flujo Completo del Test

```
1. INICIO
   [Usuario autenticado] → [Dashboard Estudiante]
       ↓
   [Clic "Comenzar Test Vocacional"]
       ↓
   [Verificar si existe test en progreso]
       ├─ No existe → [Crear nuevo test_result con status='in_progress']
       └─ Existe → [Mostrar opción: Continuar o Reiniciar]

2. PRESENTACIÓN DEL TEST
   [Pantalla Intro]
       ↓
   [Explicación: 36 preguntas, 8-10 min, sin respuestas correctas/incorrectas]
       ↓
   [Botón "Comenzar"]

3. PREGUNTAS (Loop x36)
   FOR cada pregunta 1-36:
       [Mostrar pregunta + escala 1-5]
           ↓
       [Usuario selecciona respuesta]
           ↓
       [Guardar en estado local]
           ↓
       IF (pregunta % 3 === 0):  // Cada 3 preguntas
           [Auto-guardar en backend]
           ↓
       [Avanzar a siguiente pregunta]

4. SCORING (Después de pregunta 36)
   [Todas las respuestas completadas]
       ↓
   [Enviar al backend: POST /test-submit]
       ↓
   [Backend ejecuta algoritmo de scoring]
       ↓
   [Calcular puntajes por dimensión]
       ↓
   [Ordenar y desempatar]
       ↓
   [Generar código Holland (top 3)]
       ↓
   [Calcular nivel de certeza]
       ↓
   [Guardar resultado en DB]
       ↓
   [Retornar resultado al frontend]

5. RESULTADO
   [Mostrar código Holland: "ISA"]
       ↓
   [Mostrar nivel de certeza: "Alta"]
       ↓
   [Trigger Skill 03: Motor de Recomendación]
       ↓
   [Mostrar top 6 carreras compatibles]
       ↓
   [Trigger Skill 07: IA - Explicación]
       ↓
   [Mostrar explicación personalizada]
       ↓
   [Botón "Ver mi Dashboard"]
```

### Diagrama de Estados

```
┌─────────────┐
│   NOT_      │
│  STARTED    │
└──────┬──────┘
       │ start()
       ▼
┌─────────────┐
│     IN_     │◄──┐
│  PROGRESS   │   │ saveProgress()
└──────┬──────┘   │
       │          │
       │ answer()─┘
       │
       │ submit()
       ▼
┌─────────────┐
│  COMPLETED  │
└─────────────┘
```

---

## Casos de Uso

### 1. Estudiante Completa Test por Primera Vez

**Actor:** Estudiante registrado

**Objetivo:** Completar test vocacional y obtener código Holland

**Flujo:**
1. Estudiante hace clic en "Comenzar Test" desde dashboard
2. Ve pantalla intro con explicación
3. Hace clic en "Comenzar"
4. Responde pregunta 1/36: "Me gusta trabajar con herramientas" → 4 (De acuerdo)
5. Responde pregunta 2/36: "Disfruto actividades al aire libre" → 5 (Totalmente de acuerdo)
6. ... continúa hasta pregunta 36
7. Sistema calcula automáticamente
8. Ve resultado: "Tu código es **ISA** (Investigador-Social-Artístico) - Certeza: Alta"
9. Ve top 6 carreras recomendadas
10. Puede guardar carreras favoritas o explorar más

### 2. Estudiante Interrumpe y Retoma Test

**Actor:** Estudiante con test en progreso

**Objetivo:** Continuar test desde donde lo dejó

**Flujo:**
1. Estudiante respondió 18/36 preguntas ayer
2. Hoy regresa y hace clic en "Continuar Test"
3. Sistema carga progreso: "Pregunta 19/36"
4. Estudiante continúa desde pregunta 19
5. Completa las 18 restantes
6. Obtiene resultado

### 3. Estudiante Quiere Reiniciar Test

**Actor:** Estudiante que ya completó el test

**Objetivo:** Hacer el test nuevamente

**Flujo:**
1. Estudiante hace clic en "Retomar Test" desde dashboard
2. Sistema muestra confirmación: "Ya completaste el test. ¿Deseas reiniciar?"
3. Estudiante confirma
4. Sistema marca test anterior como `status='archived'`
5. Crea nuevo test con `status='in_progress'`
6. Estudiante responde las 36 preguntas nuevamente
7. Obtiene nuevo resultado (puede ser diferente)

---

## Algoritmo de Scoring (Implementación)

### Paso 1: Calcular Puntajes por Dimensión

```javascript
function calcularPuntajesPorDimension(respuestas) {
  const puntajes = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

  respuestas.forEach(({ dimension, respuesta }) => {
    puntajes[dimension] += respuesta
  })

  return puntajes
}

// Ejemplo:
// Respuestas R: [4, 5, 3, 4, 2, 5] → puntajes.R = 23
// Respuestas I: [5, 5, 4, 5, 4, 5] → puntajes.I = 28
```

### Paso 2: Ordenar por Puntaje Total

```javascript
function ordenarPorPuntaje(puntajes) {
  return Object.entries(puntajes)
    .sort((a, b) => b[1] - a[1])  // Mayor a menor
}

// Ejemplo:
// Input:  { R: 23, I: 28, A: 22, S: 25, E: 15, C: 12 }
// Output: [["I", 28], ["S", 25], ["R", 23], ["A", 22], ["E", 15], ["C", 12]]
```

### Paso 3: Desempate por Intensidad Alta

```javascript
function desempatarPorIntensidad(respuestas, ranking) {
  // Contar cuántas respuestas 4-5 tiene cada dimensión
  const intensidad = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

  respuestas.forEach(({ dimension, respuesta }) => {
    if (respuesta >= 4) {
      intensidad[dimension]++
    }
  })

  // Identificar dimensiones empatadas
  const grupos Empatados = []
  let i = 0
  while (i < ranking.length) {
    const puntajeActual = ranking[i][1]
    const grupoEmpate = [ranking[i]]

    let j = i + 1
    while (j < ranking.length && ranking[j][1] === puntajeActual) {
      grupoEmpate.push(ranking[j])
      j++
    }

    if (grupoEmpate.length > 1) {
      // Hay empate, ordenar por intensidad
      grupoEmpate.sort((a, b) => intensidad[b[0]] - intensidad[a[0]])
    }

    gruposEmpatados.push(...grupoEmpate)
    i = j
  }

  return gruposEmpatados
}

// Ejemplo:
// Si I y S ambos tienen puntaje 25
// I tiene 5 respuestas 4-5
// S tiene 3 respuestas 4-5
// → I queda primero
```

### Paso 4: Desempate por Bajo Rechazo

```javascript
function desempatarPorRechazo(respuestas, ranking) {
  // Contar cuántas respuestas 1-2 tiene cada dimensión (MENOS es mejor)
  const rechazo = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

  respuestas.forEach(({ dimension, respuesta }) => {
    if (respuesta <= 2) {
      rechazo[dimension]++
    }
  })

  // Misma lógica de identificar empates y ordenar
  // Pero ahora por MENOR rechazo
  // ... (similar a paso 3, pero ascendente)

  return rankingOrdenado
}
```

### Paso 5: Desempate Alfabético (Determinístico)

```javascript
function desempatarAlfabetico(ranking) {
  // Si aún hay empate, ordenar alfabéticamente
  return ranking.sort((a, b) => {
    if (a[1] === b[1]) {
      return a[0].localeCompare(b[0])
    }
    return 0
  })
}
```

### Algoritmo Completo

```javascript
// backend/services/vocational/riasec.js

export function calcularCodigoRIASEC(respuestas) {
  // 1. Calcular puntajes
  const puntajes = calcularPuntajesPorDimension(respuestas)

  // 2. Ordenar por puntaje
  let ranking = ordenarPorPuntaje(puntajes)

  // 3. Desempate por intensidad
  if (hayEmpate(ranking)) {
    ranking = desempatarPorIntensidad(respuestas, ranking)
  }

  // 4. Desempate por rechazo
  if (hayEmpate(ranking)) {
    ranking = desempatarPorRechazo(respuestas, ranking)
  }

  // 5. Desempate alfabético
  if (hayEmpate(ranking)) {
    ranking = desempatarAlfabetico(ranking)
  }

  // 6. Generar código de 3 letras
  const codigo = ranking.slice(0, 3).map(r => r[0]).join('')

  // 7. Calcular nivel de certeza
  const certeza = calcularNivelCerteza(ranking)

  return {
    codigo,
    certeza,
    puntajes,
    ranking_completo: ranking.map(r => ({
      dimension: r[0],
      puntaje: r[1]
    }))
  }
}

function calcularNivelCerteza(ranking) {
  // Diferencia entre top 3 y el resto
  const diff1a2 = ranking[0][1] - ranking[1][1]
  const diff2a3 = ranking[1][1] - ranking[2][1]
  const diff3a4 = ranking[2][1] - ranking[3][1]

  const diferenciaPromedio = (diff1a2 + diff2a3 + diff3a4) / 3

  if (diferenciaPromedio >= 5) return 'Alta'
  if (diferenciaPromedio >= 3) return 'Media'
  return 'Exploratoria'
}

function hayEmpate(ranking) {
  // Verificar si alguna de las top 3 tiene el mismo puntaje
  return ranking[0][1] === ranking[1][1] ||
         ranking[1][1] === ranking[2][1] ||
         ranking[2][1] === ranking[3][1]
}
```

---

## Preguntas del Test (36 preguntas)

### R - Realista (6 preguntas)

1. Me gusta trabajar con herramientas y maquinaria
2. Disfruto realizar actividades al aire libre
3. Me siento cómodo/a resolviendo problemas prácticos con mis manos
4. Prefiero trabajos que requieran habilidades técnicas concretas
5. Me interesa saber cómo funcionan las cosas (mecánica, electricidad, construcción)
6. Me gusta construir o reparar objetos físicos

### I - Investigador (6 preguntas)

7. Me gusta analizar datos y encontrar patrones
8. Disfruto resolver problemas complejos que requieren pensamiento lógico
9. Me interesa investigar y descubrir cómo funcionan las cosas a nivel profundo
10. Prefiero trabajar con ideas y teorías abstractas
11. Me gusta experimentar y probar hipótesis
12. Disfruto aprender sobre ciencia, matemáticas o tecnología

### A - Artístico (6 preguntas)

13. Me gusta expresarme creativamente (arte, música, escritura, diseño)
14. Disfruto imaginar nuevas ideas y conceptos originales
15. Me siento cómodo/a en ambientes poco estructurados y flexibles
16. Prefiero trabajos que me permitan usar mi creatividad
17. Me interesa la estética y el diseño visual
18. Disfruto creando cosas únicas y originales

### S - Social (6 preguntas)

19. Me gusta ayudar a otras personas con sus problemas
20. Disfruto enseñar o explicar cosas a otros
21. Me siento cómodo/a trabajando en equipo y colaborando
22. Prefiero trabajos que impliquen interacción directa con personas
23. Me interesa el bienestar y desarrollo de los demás
24. Disfruto escuchar y apoyar emocionalmente a otros

### E - Emprendedor (6 preguntas)

25. Me gusta liderar proyectos y tomar decisiones
26. Disfruto persuadir y convencer a otros
27. Me siento cómodo/a asumiendo riesgos calculados
28. Prefiero trabajos que me permitan tener autonomía e influencia
29. Me interesa el mundo de los negocios y las oportunidades comerciales
30. Disfruto organizar eventos y dirigir equipos

### C - Convencional (6 preguntas)

31. Me gusta trabajar con datos, números y registros organizados
32. Disfruto seguir procedimientos y protocolos establecidos
33. Me siento cómodo/a en ambientes estructurados y predecibles
34. Prefiero trabajos que requieran precisión y atención al detalle
35. Me interesa la administración y la organización de información
36. Disfruto realizar tareas sistemáticas y ordenadas

**Nota:** Estas preguntas deben ser revisadas y aprobadas por Natalia (experta en contenido vocacional).

---

## Esquema de Base de Datos

```sql
-- Tabla de resultados del test
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'in_progress',  -- in_progress | completed | archived
  codigo_holland VARCHAR(3),                 -- Ej: "ISA"
  certeza VARCHAR(20),                       -- Exploratoria | Media | Alta
  puntajes JSONB,                            -- {R: 23, I: 28, ...}
  ranking_completo JSONB,                    -- Array ordenado
  progreso_porcentaje INTEGER DEFAULT 0,
  fecha_inicio TIMESTAMP DEFAULT NOW(),
  fecha_completado TIMESTAMP,
  duracion_minutos INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de respuestas individuales
CREATE TABLE test_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
  pregunta_id INTEGER NOT NULL,              -- 1-36
  dimension VARCHAR(1) NOT NULL,             -- R, I, A, S, E, C
  respuesta INTEGER NOT NULL,                -- 1-5
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_status ON test_results(status);
CREATE INDEX idx_test_responses_test ON test_responses(test_result_id);

-- Row Level Security
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus tests"
  ON test_results FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios ven solo sus respuestas"
  ON test_responses FOR ALL
  USING (
    test_result_id IN (
      SELECT id FROM test_results WHERE user_id = auth.uid()
    )
  );
```

---

## Checklist de Implementación

### Frontend
- [ ] Crear componente `TestIntro.jsx`
- [ ] Crear componente `TestQuestion.jsx`
- [ ] Crear componente `TestProgress.jsx`
- [ ] Crear archivo `testQuestions.js` con 36 preguntas
- [ ] Implementar hook `useTestProgress.js`
- [ ] Implementar auto-guardado cada 3 preguntas
- [ ] Agregar validación (todas las preguntas respondidas)
- [ ] Implementar barra de progreso visual
- [ ] Mobile responsive

### Backend
- [ ] Crear tablas `test_results` y `test_responses`
- [ ] Implementar `scoringAlgorithm.js`
- [ ] Crear función `test-save-progress.js`
- [ ] Crear función `test-submit.js`
- [ ] Crear función `test-get-progress.js`
- [ ] Tests unitarios del algoritmo de scoring
- [ ] Validar edge cases (empates múltiples)

### Testing
- [ ] Probar algoritmo con casos conocidos
- [ ] Probar empates por puntaje total
- [ ] Probar empates por intensidad
- [ ] Probar empates por rechazo
- [ ] Probar guardado y recuperación de progreso
- [ ] Probar flujo completo end-to-end
- [ ] Probar en diferentes dispositivos

---

**Estado:** 🟡 Pendiente de implementación
**Prioridad:** 🔴 Alta (core del producto)
**Dependencias bloqueantes:** Skill 01 (Autenticación)
**Tiempo estimado:** 4-5 días

**Última actualización:** 2025-12-31
