# Vocari SaaS Colegios - Spec de Ejecución v1

## 1. Contexto Operativo
Este spec aterriza el plan SaaS para colegios sobre la solución actual:

- Sitio público (`vocari.cl`): React/Vite (`src/`) para adquisición.
- Producto institucional (`app.vocari.cl`): Next.js (`frontend/`) + FastAPI (`backend/`).

Objetivo: pasar de MVP funcional a oferta institucional vendible con licencia anual.

## 2. Alcance Funcional Prioritario (P0/P1)

### P0 (venta de piloto institucional)
1. Orientador vocacional virtual contextual (post-test).
2. Panel orientador con seguimiento por estudiante.
3. Panel admin colegio con métricas agregadas.
4. Seguimiento automático D0/D7/D21.
5. Revisión y exportación de resultados.

### P1 (diferenciación comercial)
1. Comparador de carreras con escenarios.
2. Insights por cohorte/generación.
3. Alertas de indecisión por grupo.

## 3. Especificación por Módulo

## 3.1 Orientador Vocacional Virtual (AI Career Advisor)

### Objetivo
Entregar orientación personalizada útil, no genérica, luego del test.

### Entradas mínimas
- `nombre`, `email`, `holland_code`
- `test_answers`, `survey_response`
- recomendaciones de carreras (`/careers/recommendations`)
- historial previo de reportes IA

### Contrato de respuesta obligatorio
1. `resumen_personalizado` (2-3 líneas, nombrando estudiante).
2. `analisis_carreras` (3 opciones con razones y trade-offs).
3. `datos_mercado` (empleabilidad/ingreso/saturación con fuente MINEDUC/SIES).
4. `plan_7_dias` (3 acciones concretas).
5. `plan_30_dias` (3 acciones concretas).

### Backend (FastAPI)
- Extender `POST /api/v1/leads/ai-report` para guardar versión estructurada en `metadata`.
- Guardar también:
  - `ai_report_text`
  - `ai_report_generated_at`
  - `clarity_score` (si existe encuesta).

### Frontend (Next.js)
- `frontend/app/test-gratis/page.tsx`
  - bloque de informe legible por secciones
  - CTA de siguiente paso (comparar carreras / agendar sesión)

### Criterios de aceptación
1. El informe usa nombre real del estudiante.
2. El informe muestra al menos 1 dato de mercado por carrera.
3. El informe queda visible en `/revision-leads`.

## 3.2 Panel Profesional para Orientadores

### Objetivo
Dar una vista operativa diaria para seguimiento por estudiante.

### Vista de lista (MVP)
Ruta: `/orientador/estudiantes`

Columnas mínimas:
- nombre, curso, email
- estado test (`pendiente|completo`)
- `holland_code`
- claridad (`clarity_score`)
- última actividad
- alerta (`sin_test`, `indeciso`, `sin_seguimiento`)

### Vista detalle estudiante
Ruta: `/orientador/estudiantes/[id]`

Secciones:
1. Resumen vocacional.
2. Informe IA histórico.
3. Notas del orientador.
4. Tareas de seguimiento.

### Backend requerido
Nuevas tablas:
- `advisor_notes`
- `advisor_tasks`
- `student_journey`

Nuevos endpoints:
- `GET /api/v1/orientador/students`
- `GET /api/v1/orientador/students/{id}`
- `POST /api/v1/orientador/students/{id}/notes`
- `POST /api/v1/orientador/students/{id}/tasks`

### Criterios de aceptación
1. Se puede filtrar por curso, estado y claridad.
2. Notas y tareas quedan persistidas con autor y fecha.
3. Exportable ficha estudiante (PDF simple).

## 3.3 Panel Administrativo Colegio

### Objetivo
Dar control institucional y evidencia para dirección académica.

### Dashboard mínimo
Ruta: `/admin/metricas`

Widgets:
1. estudiantes totales vs test completado
2. distribución RIASEC por curso
3. top carreras de interés
4. índice de indecisión por curso (`clarity_score`)

### Gestión mínima
Rutas ya existentes a fortalecer:
- `/admin/estudiantes`
- `/admin/orientadores`
- `/admin/importar`

### Backend
Endpoints:
- `GET /api/v1/admin/metrics`
- `GET /api/v1/admin/insights`

Tabla de soporte:
- `institution_metrics_snapshots` (opcional en Fase 2 para cache mensual)

### Criterios de aceptación
1. Filtros por curso y período.
2. Datos agregados sin exposición sensible cross-institution.
3. Export CSV mensual.

## 3.4 Simulación de Futuro Profesional

### Objetivo
Permitir comparar carreras con datos reales y escenarios.

### Funcionalidad
Ruta propuesta: `/estudiante/comparador`

Comparar 2-4 carreras:
- empleabilidad
- ingreso estimado
- saturación
- años de estudio
- tendencia esperada (base/conservador/optimista)

### Criterios de aceptación
1. Mobile-first usable.
2. Visualización clara de trade-offs.
3. CTA a sesión con orientador.

## 3.5 Sistema de Seguimiento y Acompañamiento

### Objetivo
Aumentar continuidad post-test.

### Flujos automatizados
1. D0: entrega de informe + próximos pasos.
2. D7: recordatorio de exploración de carreras.
3. D21: sugerencia de sesión si claridad < umbral.

### Backend
Tabla:
- `followup_events` (`scheduled_at`, `sent_at`, `channel`, `status`, `payload`)

Servicio:
- worker para tareas programadas (reutilizando `workers/worker.py`)

### Criterios de aceptación
1. Historial de envíos auditable.
2. Regla anti-spam por usuario.
3. Plantillas por perfil RIASEC.

## 3.6 Sistema de Insights para Colegios

### Objetivo
Entregar señales accionables de orientación a nivel cohorte.

### Insights iniciales
1. carreras más elegidas por generación.
2. evolución de claridad vocacional por curso.
3. alertas de grupos con indecisión alta.

### Criterios de aceptación
1. Tendencias comparables mes a mes.
2. Exportable para reuniones de dirección.

## 4. Plan de Implementación por Sprint (8 semanas)

## Sprint 1-2
1. Cerrar flujo `leads` (ya avanzado) + reporte IA persistido.
2. Mejorar UX final test y encuesta.
3. Revisión leads con filtros básicos.

Entregables:
- `backend/app/leads/*`
- `frontend/app/test-gratis/page.tsx`
- `frontend/app/revision-leads/page.tsx`

## Sprint 3-4
1. Tabla/lista operativa orientador.
2. Notas y tareas por estudiante.
3. Métricas admin básicas.

Entregables:
- `backend/app/orientador/*` (nuevo módulo)
- `frontend/app/(dashboard)/orientador/estudiantes/*`
- `frontend/app/(dashboard)/admin/metricas/page.tsx`

## Sprint 5-6
1. Seguimiento automático D0/D7/D21.
2. Exportables CSV/PDF.
3. Índice de indecisión visible en paneles.

## Sprint 7-8
1. Comparador de carreras.
2. Insights por cohorte.
3. Alertas grupales.

## 5. Priorización Impacto vs Esfuerzo

1. Alto impacto / bajo esfuerzo:
- persistencia completa de informe IA
- revisión leads robusta
- índice de claridad en paneles

2. Alto impacto / medio esfuerzo:
- panel orientador con notas y tareas
- dashboard admin con agregados

3. Alto impacto / alto esfuerzo:
- seguimiento automático multicanal
- comparador con escenarios avanzados

## 6. KPIs de Negocio y Producto

1. `% completitud test` por curso.
2. `% estudiantes con claridad >= 4`.
3. `% estudiantes con seguimiento post-test`.
4. tiempo promedio de revisión por orientador.
5. uso mensual de panel admin y orientador.

## 7. Definition of Done (DoD)

1. Endpoint + UI + persistencia + permisos.
2. Test mínimo backend para endpoint nuevo.
3. Métricas instrumentadas.
4. Validación mobile/desktop.
5. Documentación actualizada en `specs/`.

## 8. Riesgos Activos y Mitigación

1. Riesgo: respuestas IA genéricas.
- Mitigación: formato estructurado obligatorio + validación de contenido.

2. Riesgo: adopción baja del orientador.
- Mitigación: flujo centrado en lista operativa y acciones rápidas.

3. Riesgo: deuda técnica por coexistencia de 2 frontends.
- Mitigación: regla de separación por dominio y ownership de carpetas.
