# Milestone 3: AI Engine Pipeline

> Duracion: Semanas 5-8
> Objetivo: Pipeline de IA funcional que analiza transcripciones y genera insights
> Dependencias: Milestone 1 (backend), Milestone 2 (transcripciones disponibles)

---

## Resumen

Implementar el motor de IA que procesa transcripciones de sesiones y genera: resumenes, deteccion de intereses, deteccion de habilidades, analisis de sentimiento emocional, y sugerencias de tests/juegos. Implementacion via OpenRouter API con strategy de modelos.

---

## Tareas

### T3.1 - OpenRouter client
- **Estimacion**: 1 dia
- **Descripcion**: Client HTTP para OpenRouter API con retry, fallback entre modelos, rate limiting, y logging de costos
- **Entregable**: `ai_engine/openrouter_client.py` con soporte para multiples modelos y fallback chain
- **Referencia**: `specs/ai-engine.md` seccion 3

### T3.2 - Prompt templates
- **Estimacion**: 2 dias
- **Descripcion**: Implementar todos los prompt templates: resumen, intereses, habilidades, sentimiento, sugerencias
- **Entregable**: `ai_engine/prompts.py` con templates parametrizados y versionados
- **Referencia**: `specs/ai-engine.md` seccion 5

### T3.3 - Transcript analysis pipeline
- **Estimacion**: 3 dias
- **Descripcion**: Pipeline completo: pre-procesamiento -> 5 analisis en paralelo -> post-procesamiento -> almacenamiento
- **Entregable**: `ai_engine/pipelines.py` con TranscriptAnalysisPipeline
- **Referencia**: `specs/ai-engine.md` seccion 4.1

### T3.4 - RQ worker setup
- **Estimacion**: 1 dia
- **Descripcion**: Configurar rq workers con multiples queues (ai_analysis, reports, profiles), supervisord para produccion
- **Entregable**: `workers/worker.py`, Dockerfile para worker, docker-compose service

### T3.5 - AI analysis job
- **Estimacion**: 2 dias
- **Descripcion**: Job asincrono `transcript_analysis_job` que ejecuta el pipeline completo y almacena resultados
- **Entregable**: Job registrado, ejecutable via queue, con timeout y retries
- **Referencia**: `specs/backend.md` seccion 6.1

### T3.6 - Output validation
- **Estimacion**: 1 dia
- **Descripcion**: Validacion de JSON output de LLMs contra Pydantic schemas, re-intento con error feedback
- **Entregable**: Validator que parsea, valida, y re-intenta si necesario
- **Referencia**: `specs/ai-engine.md` seccion 8.1

### T3.7 - AI analysis API endpoints
- **Estimacion**: 1 dia
- **Descripcion**: GET /sessions/{id}/analysis, GET /sessions/{id}/transcript para orientador
- **Entregable**: Endpoints con role-checking, respuesta estructurada
- **Referencia**: `specs/backend.md` seccion 2.2

### T3.8 - Redis cache para respuestas IA
- **Estimacion**: 1 dia
- **Descripcion**: Cache layer para respuestas IA reutilizables (explicaciones RIASEC, sugerencias genericas)
- **Entregable**: Cache decorators con TTL configurable
- **Referencia**: `specs/ai-engine.md` seccion 7.1

### T3.9 - Cost tracking y monitoring
- **Estimacion**: 1 dia
- **Descripcion**: Registrar tokens usados, modelo, costo estimado, latencia de cada llamada IA
- **Entregable**: Tabla ai_usage_log, metricas en dashboard
- **Referencia**: `specs/ai-engine.md` seccion 9

### T3.10 - PII scrubbing pre-LLM
- **Estimacion**: 1 dia
- **Descripcion**: Remover nombres reales, apellidos, RUT, direcciones de transcripciones antes de enviar al LLM
- **Entregable**: Funcion de scrubbing, tests que verifican que PII no se envia
- **Referencia**: `specs/ai-engine.md` seccion 8.2

### T3.11 - Tests del pipeline IA
- **Estimacion**: 2 dias
- **Descripcion**: Tests con transcripciones de ejemplo, mock de OpenRouter, verificacion de output format
- **Entregable**: Suite de tests para cada etapa del pipeline

---

## Criterios de Aceptacion

- [ ] Pipeline procesa una transcripcion de ejemplo y genera los 5 analisis
- [ ] Resultados almacenados en session_ai_analysis con formato correcto
- [ ] Fallback entre modelos funciona cuando modelo primario falla
- [ ] PII removido de todas las llamadas a OpenRouter
- [ ] Cache reduce llamadas repetidas
- [ ] Costos trackeados por llamada
- [ ] Worker procesa jobs de forma asincrona
- [ ] Tests con mocks pasan al 100%

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| Output JSON del LLM inconsistente | Alta | Medio | Validacion + re-intento + structured output mode |
| OpenRouter rate limits en picos | Media | Medio | Queue con backoff, fallback models |
| Calidad de deteccion de intereses/habilidades baja | Media | Alto | Prompt engineering iterativo, evaluacion manual de 50 sesiones |
| Costo real mayor al estimado | Baja | Medio | Monitoring + alertas + model tiering agresivo |
