# Vocari - Especificacion del Motor de IA

> Version: 2.0 | Fecha: Marzo 2026
> Provider: OpenRouter API | Modelos: Multi-model strategy

---

## 1. Vision General

El motor de IA de Vocari es el componente que transforma datos crudos (transcripciones de sesiones, respuestas de tests, metricas de juegos) en insights accionables sobre el perfil vocacional de cada estudiante.

**Principio fundamental**: La IA asiste y enriquece, pero nunca toma decisiones. El motor deterministico (RIASEC, matching de carreras, datos MINEDUC) es la base. La IA agrega contexto, narrativa y deteccion de patrones sutiles.

---

## 2. Arquitectura del Pipeline de IA

```
                    +-------------------+
                    |  Data Sources     |
                    +---+-----+-----+--+
                        |     |     |
              +---------+  +--+--+  +--------+
              |Transcript|  |Tests|  |Games   |
              |  (text)  |  |data |  |metrics |
              +----+-----+  +--+--+  +---+----+
                   |           |         |
                   v           v         v
            +------+-----+----+----+----+------+
            |       Pre-Processing Layer        |
            |  - Text cleaning                  |
            |  - Speaker diarization            |
            |  - Segment extraction             |
            |  - Context assembly               |
            +----------------+------------------+
                             |
                             v
            +----------------+------------------+
            |        Analysis Pipelines         |
            |                                   |
            |  +----------+  +-----------+      |
            |  |Summarize |  |Interests  |      |
            |  |Session   |  |Detection  |      |
            |  +----------+  +-----------+      |
            |                                   |
            |  +----------+  +-----------+      |
            |  |Skills    |  |Sentiment  |      |
            |  |Detection |  |Analysis   |      |
            |  +----------+  +-----------+      |
            |                                   |
            |  +----------+  +-----------+      |
            |  |Test/Game |  |Adaptive   |      |
            |  |Suggester |  |Questions  |      |
            |  +----------+  +-----------+      |
            |                                   |
            |  +----------+  +-----------+      |
            |  |Career    |  |Profile    |      |
            |  |Simulation|  |Updater    |      |
            |  +----------+  +-----------+      |
            +----------------+------------------+
                             |
                             v
            +----------------+------------------+
            |        Post-Processing Layer      |
            |  - Confidence scoring             |
            |  - Result validation              |
            |  - Profile reconciliation         |
            |  - Cache management               |
            +----------------+------------------+
                             |
                             v
            +----------------+------------------+
            |        Storage Layer              |
            |  - PostgreSQL (structured)        |
            |  - Redis (cache)                  |
            +-----------------------------------+
```

---

## 3. Estrategia de Modelos (OpenRouter)

### 3.1 Model Tiering

No todos los tasks requieren el mismo nivel de modelo. Usar modelos mas baratos para tareas simples reduce costos significativamente.

| Tarea | Modelo Recomendado | Costo Estimado/llamada | Razon |
|-------|-------------------|----------------------|-------|
| Resumen de sesion | `anthropic/claude-3.5-sonnet` | $0.015-0.03 | Requiere comprension profunda, calidad alta |
| Deteccion de intereses | `anthropic/claude-3.5-sonnet` | $0.015-0.03 | Requiere inferencia sutil |
| Deteccion de habilidades | `anthropic/claude-3.5-sonnet` | $0.015-0.03 | Requiere inferencia sutil |
| Analisis de sentimiento | `anthropic/claude-3.5-haiku` | $0.002-0.005 | Tarea mas estructurada, modelo rapido basta |
| Sugerencia de tests | `anthropic/claude-3.5-haiku` | $0.002-0.005 | Tarea de clasificacion |
| Cuestionario adaptativo | `anthropic/claude-3.5-sonnet` | $0.01-0.02 | Requiere creatividad + contexto |
| Simulacion de carrera | `anthropic/claude-3.5-sonnet` | $0.02-0.04 | Tarea creativa compleja |
| Explicacion de perfil | `anthropic/claude-3.5-haiku` | $0.002-0.005 | Tarea templated |
| Reporte comprehensivo | `anthropic/claude-3.5-sonnet` | $0.03-0.06 | Maxima calidad requerida |

### 3.2 Fallback Strategy

```
Primary: OpenRouter -> anthropic/claude-3.5-sonnet
Fallback 1: OpenRouter -> google/gemini-2.0-flash
Fallback 2: OpenRouter -> meta-llama/llama-3.3-70b-instruct
Timeout: 30 segundos por llamada
Retries: 3 con backoff exponencial (2s, 4s, 8s)

Implementacion:
  try:
      response = await openrouter.chat(model="anthropic/claude-3.5-sonnet", ...)
  except (TimeoutError, RateLimitError):
      response = await openrouter.chat(model="google/gemini-2.0-flash", ...)
  except Exception:
      response = await openrouter.chat(model="meta-llama/llama-3.3-70b-instruct", ...)
```

### 3.3 OpenRouter Client

```
Configuracion:
  Base URL: https://openrouter.ai/api/v1
  Auth: Bearer token (OPENROUTER_API_KEY)
  Headers:
    HTTP-Referer: https://vocari.cl
    X-Title: Vocari

Rate Limits:
  - Respetar 429 responses con backoff
  - Rate limit propio: max 10 llamadas concurrentes
  - Queue para exceso de demanda

Monitoreo:
  - Log de cada llamada: modelo, tokens, latencia, costo
  - Alerta si costo diario > umbral
  - Dashboard de uso en super-admin
```

---

## 4. Pipelines de Analisis

### 4.1 Pipeline: Analisis de Transcripcion de Sesion

Este es el pipeline principal. Se ejecuta como job asincrono (rq) despues de cada sesion.

```
Input: session_transcript (text, ~3,000-8,000 palabras para 30 min)

Step 1: Pre-procesamiento
  - Limpiar texto (remover artefactos de transcripcion automatica)
  - Identificar hablantes (orientador vs estudiante)
  - Dividir en segmentos tematicos
  - Extraer timestamps

Step 2: Resumen (1 llamada LLM)
  Prompt: ver seccion 5.1
  Output: resumen de 200-400 palabras
  Formato: estructurado con secciones (contexto, temas discutidos, conclusiones, proximos pasos)

Step 3: Deteccion de Intereses (1 llamada LLM)
  Prompt: ver seccion 5.2
  Output: lista de intereses con confidence score y evidencia textual
  Formato: JSON [{ interest, confidence: 0-1, evidence: "cita textual", category }]

Step 4: Deteccion de Habilidades (1 llamada LLM)
  Prompt: ver seccion 5.3
  Output: lista de habilidades con confidence score y evidencia
  Formato: JSON [{ skill, confidence: 0-1, evidence: "cita textual", type: "hard|soft" }]

Step 5: Analisis de Sentimiento (1 llamada LLM, modelo menor)
  Prompt: ver seccion 5.4
  Output: sentimiento general + momentos clave
  Formato: JSON {
    overall: "positive|neutral|negative|mixed",
    score: -1.0 to 1.0,
    engagement_level: "high|medium|low",
    moments: [{ timestamp, sentiment, trigger, intensity }]
  }

Step 6: Sugerencia de Tests/Juegos (1 llamada LLM, modelo menor)
  Prompt: ver seccion 5.5
  Input adicional: catalogo de tests y juegos disponibles
  Output: tests y juegos recomendados con razon
  Formato: JSON {
    suggested_tests: [{ test_type, reason, priority }],
    suggested_games: [{ game_id, reason, expected_insight }]
  }

Step 7: Post-procesamiento
  - Validar JSON outputs
  - Calcular confidence scores agregados
  - Guardar en session_ai_analysis
  - Trigger: update_longitudinal_profile_job

Total llamadas LLM: 5 (3 Sonnet + 2 Haiku)
Costo estimado: $0.05-$0.10 por sesion
Tiempo estimado: 15-45 segundos (paralelo donde posible)
```

### 4.2 Pipeline: Cuestionario Adaptativo

```
Input:
  - Transcripcion de sesion reciente
  - Perfil longitudinal actual del estudiante
  - Respuestas anteriores (si existen)

Generacion de Pregunta:
  El LLM genera UNA pregunta a la vez, adaptandose a la respuesta anterior.

  Contexto enviado al LLM:
    - Resumen de sesion
    - Intereses detectados
    - Habilidades detectadas
    - Historial RIASEC
    - Pregunta anterior y respuesta (si no es la primera)
    - Objetivo: profundizar en areas de incertidumbre del perfil

  Output por pregunta:
    {
      text: "pregunta en espanol",
      type: "likert" | "multiple_choice" | "open_text",
      options: [...] | null,
      reasoning: "por que se hace esta pregunta" (interno, no mostrado)
    }

  Longitud: 10-15 preguntas por cuestionario
  Llamadas LLM: 10-15 (1 por pregunta) + 1 evaluacion final
  Costo estimado: $0.15-$0.30 por cuestionario completo
```

### 4.3 Pipeline: Simulacion de Carrera

```
Input:
  - Perfil longitudinal del estudiante
  - Carrera seleccionada
  - Datos MINEDUC de la carrera (matricula, titulacion, empleabilidad)
  - Datos salariales

Output:
  {
    timeline: [
      { year: 2027, milestone: "Ingreso a universidad", salary_estimate: null, description: "..." },
      { year: 2031, milestone: "Egreso", salary_estimate: 800000, description: "..." },
      { year: 2033, milestone: "Primer trabajo estable", salary_estimate: 1200000, description: "..." },
      { year: 2036, milestone: "Especializacion", salary_estimate: 1800000, description: "..." },
      { year: 2041, milestone: "Cargo senior", salary_estimate: 2500000, description: "..." }
    ],
    probability_of_success: 0.75,
    risk_factors: ["Alta saturacion en Region Metropolitana", "..."],
    opportunity_factors: ["Demanda creciente en regiones", "..."],
    alternative_paths: ["Puedes complementar con...", "..."],
    ai_narrative: "Texto narrativo de 300-500 palabras describiendo el futuro posible"
  }

Llamadas LLM: 1 (Sonnet, prompt complejo)
Costo estimado: $0.02-$0.04
```

### 4.4 Pipeline: Actualizacion de Perfil Longitudinal

```
Input:
  - Perfil longitudinal actual
  - Nuevo dato (resultado de test, analisis de sesion, resultado de juego)

Procesamiento (mayormente deterministico, IA solo para reconciliacion):
  1. Incorporar nuevo dato al perfil
  2. Recalcular scores de skills:
     - Si nueva habilidad: agregar como "emerging" con confidence basada en fuente
     - Si habilidad existente: actualizar confidence (promedio ponderado por recencia)
     - Si habilidad contradice dato anterior: marcar para revision
  3. Recalcular interests:
     - Tracking de tendencia: growing, stable, declining
     - Consistency score basado en multiples fuentes
  4. Actualizar happiness indicators:
     - Basado en sentiment analysis de sesiones
     - Engagement level en tests/juegos
  5. Recalcular career recommendations:
     - Re-run motor deterministico con perfil actualizado
  6. Si cambios significativos:
     - Llamada LLM (Haiku) para generar insight en lenguaje natural
     - Notificar orientador

Llamadas LLM: 0-1 (solo si hay cambio significativo)
Costo estimado: $0-$0.005 por actualizacion
```

---

## 5. Prompt Templates

### 5.1 Resumen de Sesion

```
SYSTEM:
Eres un asistente de orientacion vocacional para estudiantes de colegio en Chile.
Tu tarea es resumir una sesion de orientacion vocacional entre un orientador y un estudiante.
El resumen debe ser objetivo, profesional y util para el orientador.
Responde siempre en espanol chileno.

USER:
## Transcripcion de Sesion

Fecha: {session_date}
Duracion: {duration} minutos
Estudiante: {student_name} ({student_grade})
Orientador: {orientador_name}

### Transcripcion:
{transcript_text}

### Instrucciones:
Genera un resumen estructurado con las siguientes secciones:

1. **Contexto**: Situacion general del estudiante al inicio de la sesion (1-2 oraciones)
2. **Temas Discutidos**: Lista de los principales temas abordados (3-5 puntos)
3. **Hallazgos Clave**: Descubrimientos importantes sobre el estudiante (2-4 puntos)
4. **Estado Emocional**: Observacion breve del estado emocional del estudiante
5. **Proximos Pasos**: Acciones acordadas o sugeridas (2-3 puntos)
6. **Notas para el Orientador**: Observaciones internas que podrian ser utiles en futuras sesiones

Mantener el resumen entre 200-400 palabras. Ser concreto y evitar generalidades.
```

### 5.2 Deteccion de Intereses

```
SYSTEM:
Eres un psicologo especializado en orientacion vocacional para adolescentes.
Tu tarea es detectar intereses vocacionales a partir de una conversacion.
Debes identificar intereses explicitos (mencionados directamente) e implicitos (inferidos del contexto).
Responde siempre en formato JSON.

USER:
## Transcripcion de Sesion
{transcript_text}

## Perfil Previo del Estudiante (si existe)
Intereses previamente detectados: {previous_interests}
Codigo RIASEC: {riasec_code}

## Instrucciones
Identifica todos los intereses vocacionales detectables en la conversacion.

Para cada interes, proporciona:
- "interest": nombre del interes (en espanol)
- "confidence": nivel de confianza de 0.0 a 1.0
- "evidence": cita textual o parafrasis que sustenta el interes
- "category": categoria Holland (R, I, A, S, E, C) mas cercana
- "explicit": true si el estudiante lo menciono directamente, false si es inferido
- "new": true si no estaba en el perfil previo

Responde SOLO con un JSON array valido. Ejemplo:
[
  {
    "interest": "Programacion y desarrollo de software",
    "confidence": 0.85,
    "evidence": "El estudiante menciono que pasa horas programando en Python por diversion",
    "category": "I",
    "explicit": true,
    "new": false
  }
]
```

### 5.3 Deteccion de Habilidades

```
SYSTEM:
Eres un psicologo especializado en evaluacion de habilidades de adolescentes.
Tu tarea es detectar habilidades (hard skills y soft skills) a partir de una conversacion de orientacion vocacional.
Responde siempre en formato JSON.

USER:
## Transcripcion de Sesion
{transcript_text}

## Datos Adicionales del Estudiante
Resultados de juegos recientes: {game_results}
Perfil previo: {previous_skills}

## Instrucciones
Identifica habilidades del estudiante evidenciadas en la conversacion.

Para cada habilidad:
- "skill": nombre de la habilidad (en espanol)
- "confidence": nivel de confianza de 0.0 a 1.0
- "evidence": evidencia textual
- "type": "hard" (tecnica) o "soft" (blanda/interpersonal)
- "level": "beginner", "intermediate", "advanced" (si es inferible)

Responde SOLO con un JSON array valido.
```

### 5.4 Analisis de Sentimiento

```
SYSTEM:
Eres un psicologo clinico especializado en adolescentes.
Analiza el estado emocional de un estudiante durante una sesion de orientacion vocacional.
Tu analisis debe ser sensible, objetivo y util para el orientador.
Responde en formato JSON.

USER:
## Transcripcion de Sesion
{transcript_text}

## Instrucciones
Analiza el estado emocional del estudiante durante la sesion.

Proporciona:
1. "overall": sentimiento general ("positive", "neutral", "negative", "mixed")
2. "score": puntuacion de -1.0 (muy negativo) a 1.0 (muy positivo)
3. "engagement_level": nivel de participacion ("high", "medium", "low")
4. "anxiety_indicators": indicadores de ansiedad sobre el futuro (true/false + descripcion)
5. "motivation_level": nivel de motivacion percibido ("high", "medium", "low")
6. "moments": momentos emocionales significativos (max 5):
   - "approximate_position": "inicio", "primer_tercio", "mitad", "ultimo_tercio", "final"
   - "sentiment": emocion detectada
   - "trigger": que lo causo
   - "intensity": "low", "medium", "high"

Responde SOLO con JSON valido.
```

### 5.5 Sugerencia de Tests/Juegos

```
SYSTEM:
Eres un orientador vocacional con amplio conocimiento en evaluacion psicometrica y gamificacion educativa.
Tu tarea es recomendar evaluaciones y juegos que ayuden a profundizar el conocimiento del perfil vocacional del estudiante.

USER:
## Resumen de Sesion
{session_summary}

## Intereses Detectados
{interests_detected}

## Habilidades Detectadas
{skills_detected}

## Tests Disponibles
{available_tests}

## Juegos Disponibles
{available_games}

## Areas de Incertidumbre del Perfil
{profile_gaps}

## Instrucciones
Recomienda tests y juegos que ayuden a:
1. Confirmar o refutar habilidades detectadas con baja confianza
2. Explorar intereses emergentes
3. Llenar vacios en el perfil del estudiante
4. Mantener al estudiante motivado y engaged

Para cada recomendacion:
- "id" o "type": identificador del test/juego
- "reason": por que se recomienda (en espanol, claro para el orientador)
- "priority": "high", "medium", "low"
- "expected_insight": que se espera descubrir

Responde en JSON con formato: { "suggested_tests": [...], "suggested_games": [...] }
```

---

## 6. Sistema de Recomendacion de Carreras

### 6.1 Motor Deterministico (Base)

El motor deterministico es el que ya existe en el MVP, migrado a Python y expandido.

```
Input:
  - Codigo RIASEC del estudiante (ej: "RIA")
  - Scores RIASEC (6 dimensiones, 0-100)
  - Datos MINEDUC de carreras

Algoritmo:
  1. Para cada carrera en el catalogo:
     a. Calcular compatibilidad RIASEC:
        - Match con codigo primario: +40 pts
        - Match con codigo secundario: +25 pts
        - Match con codigo terciario: +15 pts
        - Distancia euclidiana entre scores: +0-20 pts (inverso de distancia)
     b. Ajustar por datos de mercado:
        - Empleabilidad alta (>80%): +10 pts
        - Empleabilidad media (50-80%): +5 pts
        - Saturacion baja: +5 pts
        - Saturacion alta: -5 pts
     c. Score final = compatibility_score (0-100)
  2. Ordenar por score descendente
  3. Retornar top 10

Output:
  [{ career, compatibility_score, match_reasons, risk_factors }]
```

### 6.2 Enriquecimiento con IA

Cuando el perfil longitudinal tiene datos suficientes (>= 2 sesiones + 1 test), el motor se enriquece:

```
Input adicional:
  - Intereses detectados en sesiones (con confidence)
  - Habilidades detectadas (con confidence)
  - Patrones de aprendizaje
  - Preferencias expresadas

Ajustes:
  1. Re-ponderar carreras segun intereses:
     - Interes con confidence > 0.7 y alineado con carrera: +15 pts
     - Interes con confidence > 0.7 y no alineado: -10 pts
  2. Re-ponderar segun habilidades:
     - Habilidad requerida por carrera detectada con confidence > 0.6: +10 pts
  3. Generar explicacion personalizada con IA (Haiku):
     - Por que esta carrera hace match con TU perfil especifico
     - Que necesitarias desarrollar
```

---

## 7. Cache y Optimizacion de Costos

### 7.1 Estrategia de Cache

```
Redis Cache con TTL variable:

| Tipo de Dato | Cache Key Pattern | TTL | Razon |
|-------------|-------------------|-----|-------|
| Explicacion RIASEC | riasec:explain:{code}:{model} | 24h | Mismo codigo = misma explicacion base |
| Recomendacion de carreras | careers:rec:{riasec_code}:{hash} | 1h | Cambia con perfil pero no frecuentemente |
| Simulacion de carrera | sim:{career_id}:{profile_hash} | 6h | Datos de mercado no cambian rapido |
| Sugerencias de tests | suggest:{profile_hash} | 30min | Puede cambiar con nueva data |
| Resumen de sesion | NO CACHEAR | - | Siempre unico |
| Analisis de sentimiento | NO CACHEAR | - | Siempre unico |
```

### 7.2 Estimacion de Costos IA (Revisada)

Con model tiering y cache, los costos se reducen significativamente vs el modelo actual.

```
Costo por sesion completa (pipeline completo):
  Resumen (Sonnet):           $0.025
  Intereses (Sonnet):         $0.025
  Habilidades (Sonnet):       $0.025
  Sentimiento (Haiku):        $0.003
  Sugerencias (Haiku):        $0.003
  ─────────────────────────
  Total por sesion:           ~$0.08

Costo por cuestionario adaptativo (15 preguntas):
  15 x Sonnet calls:          $0.20
  1 x evaluacion final:       $0.02
  ─────────────────────────
  Total por cuestionario:     ~$0.22

Costo por simulacion de carrera:
  1 x Sonnet call:            $0.04
  ─────────────────────────
  Total:                      ~$0.04

Costo mensual por estudiante (2 sesiones + 1 cuestionario + 1 simulacion):
  2 x $0.08 + $0.22 + $0.04 = $0.42/estudiante/mes

Con cache (30% hit rate estimado):
  $0.42 x 0.70 = ~$0.30/estudiante/mes
```

**Comparacion con modelo actual**: El MVP estima $8.50/estudiante/mes en IA. La nueva arquitectura reduce esto a ~$0.30-$0.50/estudiante/mes gracias a:
- Model tiering (Haiku vs Sonnet)
- Eliminacion de chat conversacional libre (reemplazado por pipeline estructurado)
- Cache agresivo
- Prompts optimizados con output estructurado (menos tokens)

### 7.3 Batch Processing

```
Procesamiento en batch (fuera de horario pico):

Jobs nocturnos (02:00-06:00 CLT):
  - Actualizacion masiva de perfiles longitudinales
  - Re-calculo de recomendaciones de carreras
  - Generacion de reportes solicitados durante el dia
  - Limpieza de cache expirado

Beneficio:
  - Reduce carga en horario escolar (08:00-17:00)
  - OpenRouter suele tener menor latencia fuera de horario pico
```

---

## 8. Validacion y Seguridad del Pipeline IA

### 8.1 Validacion de Output

```
Cada respuesta del LLM pasa por:

1. JSON Validation:
   - Parsear JSON response
   - Validar contra Pydantic schema esperado
   - Si falla: re-intentar con prompt que incluye error
   - Max 2 re-intentos

2. Content Validation:
   - Confidence scores en rango [0, 1]
   - No mas de 20 intereses/habilidades por sesion
   - Sentiment score en rango [-1, 1]
   - No contenido inapropiado para menores

3. Consistency Check:
   - Si interes detectado contradice perfil historico: marcar para revision humana
   - Si sentimiento es "muy negativo" (< -0.7): alerta al orientador
```

### 8.2 Seguridad

```
Reglas:
  1. Nunca enviar datos personales identificables al LLM
     - Usar "Estudiante" en vez del nombre real
     - Remover apellidos, RUT, direcciones del texto
  2. No almacenar prompts completos en logs (solo metadata)
  3. OpenRouter API key en vault, no en codigo
  4. Audit log de cada llamada IA
  5. Opt-out: si el apoderado revoca consentimiento IA,
     el pipeline no se ejecuta y el orientador trabaja manualmente
```

### 8.3 Bias y Fairness

```
Riesgos identificados:
  1. Sesgo de genero en recomendaciones de carreras
  2. Sesgo socioeconomico en deteccion de intereses
  3. Sesgo cultural en analisis de sentimiento

Mitigaciones:
  1. Prompt engineering: instruccion explicita de no sesgar por genero
  2. Auditorias trimestrales: revisar distribucion de recomendaciones por genero
  3. El motor deterministico (RIASEC) es el peso principal; IA solo ajusta
  4. Orientador SIEMPRE revisa y puede editar resultados IA
  5. Metricas de fairness en dashboard de super-admin
```

---

## 9. Monitoring y Observabilidad

```
Metricas a trackear:

| Metrica | Alerta si | Dashboard |
|---------|----------|-----------|
| Latencia promedio por pipeline | > 60 segundos | Super Admin |
| Tasa de error OpenRouter | > 5% en 1 hora | Super Admin |
| Costo diario IA | > 150% del promedio | Super Admin |
| Tasa de fallback a modelo secundario | > 20% | Super Admin |
| Tasa de re-intentos por JSON invalido | > 10% | Super Admin |
| Alertas de sentimiento negativo | Cualquiera | Orientador |
| Cache hit rate | < 20% | Super Admin |
| Tiempo de procesamiento de cola | > 5 minutos de espera | Super Admin |

Logging:
  Cada llamada IA registra:
    - request_id
    - model_used
    - input_tokens
    - output_tokens
    - latency_ms
    - cost_usd
    - success: bool
    - fallback_used: bool
    - cache_hit: bool
```
