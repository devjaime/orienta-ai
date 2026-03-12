# Sprint 2 - Tickets Técnicos (Paneles y Advisor)

## Objetivo del sprint
Consolidar el valor para colegios con seguimiento operativo orientador + métricas admin + AI Advisor auditable.

## Ticket 1 - Backend: histórico de informes IA
### Alcance
- crear tabla `ai_reports` (si no existe) y exponer histórico por estudiante.
- vincular generación de informe desde `POST /api/v1/leads/ai-report`.
- guardar `model_name` y `prompt_version`.

### Archivos
- `backend/app/leads/models.py`
- `backend/app/leads/router.py`
- `backend/alembic/versions/*`

### Criterios de aceptación
1. Se persiste un registro por generación.
2. Se puede consultar histórico por `lead_id` y `student_id`.
3. Se registra timestamp y metadata técnica.

## Ticket 2 - Frontend App: bloque AI en ficha de estudiante
### Alcance
- mostrar historial IA en `/orientador/estudiantes/[id]`.
- incluir secciones del informe con estilo legible (alto contraste).
- permitir expandir/colapsar informes anteriores.

### Archivos
- `frontend/app/(dashboard)/orientador/estudiantes/[id]/page.tsx`
- `frontend/components/orientador/*`

### Criterios de aceptación
1. El orientador ve al menos el último informe y su fecha.
2. Se distingue claramente resumen, carreras y plan de acción.
3. Funciona en móvil y desktop.

## Ticket 3 - Backend: métricas admin institucionales
### Alcance
- implementar `GET /api/v1/admin/metrics`.
- agregar agregados por curso: completitud test, claridad promedio, top códigos RIASEC.
- filtros por `curso`, `periodo`.

### Archivos
- `backend/app/admin/router.py` (o módulo nuevo)
- `backend/app/admin/service.py`
- `backend/tests/test_admin/test_metrics.py`

### Criterios de aceptación
1. Endpoint responde en <500ms con dataset MVP.
2. No mezcla información entre instituciones.
3. Incluye metadatos de periodo consultado.

## Ticket 4 - Frontend App: dashboard admin métricas
### Alcance
- reforzar `/admin/metricas` con cards y tablas:
  - total estudiantes
  - test completos
  - claridad promedio
  - top RIASEC por curso
- filtros rápidos de curso y periodo.

### Archivos
- `frontend/app/(dashboard)/admin/metricas/page.tsx`
- `frontend/components/charts/*`

### Criterios de aceptación
1. Visualización clara para reunión con dirección.
2. Estado loading y error manejados.
3. Export CSV básico.

## Ticket 5 - QA E2E de valor institucional
### Flujo
1. estudiante completa test e informe.
2. orientador revisa estudiante en panel.
3. admin revisa métricas agregadas.

### Criterios de aceptación
1. informe IA aparece en ficha del estudiante.
2. métricas admin reflejan nuevo test completado.
3. no hay errores 5xx en API durante flujo.
