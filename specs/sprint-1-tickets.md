# Sprint 1 - Tickets Técnicos (Inicio Inmediato)

## Objetivo del sprint
Cerrar el flujo institucional básico de captura y revisión para validar pilotos con colegios.

## Ticket 1 - Backend: normalizar flujo de leads
### Alcance
- consolidar `POST /api/v1/tests/submit`
- consolidar `POST /api/v1/leads/{lead_id}/survey`
- asegurar persistencia de `ai_report_text`, `ai_report_generated_at`, `clarity_score`

### Archivos
- `backend/app/leads/models.py`
- `backend/app/leads/router.py`
- `backend/app/main.py`

### Criterios de aceptación
1. El test crea/actualiza lead.
2. La encuesta actualiza claridad.
3. El informe IA queda persistido y visible en revisión.

## Ticket 2 - Frontend App: mejorar UX final del test
### Alcance
- barra/estado de progreso al generar informe IA
- mensajes claros de espera y próximo paso
- encuesta final breve obligatoria (3 preguntas)

### Archivos
- `frontend/app/test-gratis/page.tsx`

### Criterios de aceptación
1. Usuario nunca queda sin feedback visual.
2. Encuesta se guarda sin salir de la página.
3. Informe se visualiza en la misma página.

## Ticket 3 - Frontend App: revisión de leads usable
### Alcance
- login fijo MVP
- tabla con nombre, correo, código, test, encuesta, informe IA
- filtros básicos: fecha, código, fuente

### Archivos
- `frontend/app/revision-leads/page.tsx`

### Criterios de aceptación
1. Sin credenciales devuelve acceso denegado.
2. Con credenciales muestra registros completos.
3. Se visualiza informe IA persistido.

## Ticket 4 - QA técnico de flujo end-to-end
### Flujo
1. landing -> `app.vocari.cl/test-gratis`
2. completar test
3. generar informe IA
4. enviar encuesta
5. validar registro en `/revision-leads`

### Criterios de aceptación
1. No hay errores 4xx/5xx en consola API durante flujo.
2. Registro final contiene nombre, correo, test, encuesta e informe.

## Ticket 5 - Métricas iniciales
### Alcance
- evento `test_started`
- evento `test_completed`
- evento `survey_submitted`
- evento `ai_report_generated`

### Criterios de aceptación
1. Eventos incluyen `source`, `holland_code` y timestamp.
2. Se pueden agregar por día para panel admin futuro.
