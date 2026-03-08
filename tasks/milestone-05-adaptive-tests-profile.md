# Milestone 5: Tests Adaptativos y Perfil Longitudinal

> Duracion: Semanas 9-12
> Objetivo: Cuestionarios adaptativos post-sesion y perfil acumulativo del estudiante
> Dependencias: Milestone 3 (AI engine), Milestone 4 (frontend base)

---

## Resumen

Implementar cuestionarios adaptativos generados por IA basados en la sesion de orientacion, y el perfil longitudinal que acumula datos de sesiones, tests y juegos para construir una imagen completa del estudiante.

---

## Tareas

### T5.1 - Adaptive questionnaire pipeline (backend)
- **Estimacion**: 3 dias
- **Descripcion**: Pipeline IA que genera preguntas adaptativas basadas en sesion + perfil. Una pregunta a la vez, ajustada por respuesta anterior.
- **Entregable**: `ai_engine/pipelines.py` AdaptiveQuestionnairePipeline
- **Referencia**: `specs/ai-engine.md` seccion 4.2

### T5.2 - Adaptive questionnaire API
- **Estimacion**: 2 dias
- **Descripcion**: Endpoints GET /tests/adaptive/{session_id}, POST /tests/adaptive/{id}/answer
- **Entregable**: API completa para flujo iterativo de cuestionario
- **Referencia**: `specs/backend.md` seccion 2.3

### T5.3 - Adaptive questionnaire UI
- **Estimacion**: 2 dias
- **Descripcion**: Componente AdaptiveQuestion que muestra una pregunta a la vez, envia respuesta, recibe siguiente
- **Entregable**: `/estudiante/tests/adaptativo/[id]` con UX fluida y progress indicator

### T5.4 - Longitudinal profile model (backend)
- **Estimacion**: 2 dias
- **Descripcion**: Model StudentLongitudinalProfile, logica de actualizacion con datos de multiples fuentes
- **Entregable**: Modelo, service de actualizacion, job de reconciliacion
- **Referencia**: `specs/backend.md` seccion 2.6, `specs/ai-engine.md` seccion 4.4

### T5.5 - Profile update worker
- **Estimacion**: 2 dias
- **Descripcion**: Worker que actualiza perfil longitudinal despues de cada nuevo dato (sesion, test, juego)
- **Entregable**: `update_longitudinal_profile_job` funcional
- **Referencia**: `specs/backend.md` seccion 6.3

### T5.6 - Longitudinal profile API
- **Estimacion**: 1 dia
- **Descripcion**: GET /profiles/me, GET /profiles/{student_id} con datos completos
- **Entregable**: API con role-checking (estudiante ve el suyo, orientador ve sus asignados)

### T5.7 - Longitudinal profile UI
- **Estimacion**: 3 dias
- **Descripcion**: Pagina de perfil con: SkillsRadar, InterestEvolution chart, HappinessTracker, ProfileTimeline
- **Entregable**: `/estudiante/perfil` con visualizaciones ricas
- **Referencia**: `specs/frontend.md` seccion 4.1

### T5.8 - Career recommendation engine v2 (backend)
- **Estimacion**: 2 dias
- **Descripcion**: Migrar motor deterministico a Python, extender con datos de sesiones e intereses del perfil longitudinal
- **Entregable**: `careers/recommendation.py` con scoring mejorado
- **Referencia**: `specs/ai-engine.md` seccion 6

### T5.9 - Career recommendations API + UI
- **Estimacion**: 2 dias
- **Descripcion**: GET /careers/recommendations, UI de explorador de carreras con recomendaciones personalizadas
- **Entregable**: Endpoint + `/estudiante/carreras` con top 10 recomendadas

### T5.10 - Tests de integracion del perfil
- **Estimacion**: 1 dia
- **Descripcion**: Tests que verifican: sesion -> analisis -> perfil actualizado -> recomendaciones cambian
- **Entregable**: Suite de tests end-to-end del flujo de datos

---

## Criterios de Aceptacion

- [ ] Cuestionario adaptativo genera preguntas relevantes basadas en sesion
- [ ] 10-15 preguntas completadas producen evaluacion del perfil
- [ ] Perfil longitudinal se actualiza despues de cada nueva fuente de datos
- [ ] Skills y interests acumulan confidence con multiples fuentes
- [ ] Recomendaciones de carreras cambian cuando el perfil se actualiza
- [ ] UI de perfil muestra evolucion en el tiempo
