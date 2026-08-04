# Plan de Desarrollo Dual (vocari.cl + app.vocari.cl)

## 1. Objetivo
Definir una ejecución clara para dos soluciones que conviven en el mismo repositorio:

- `vocari.cl` (React/Vite + Netlify): adquisición y derivación al producto.
- `app.vocari.cl` (Next.js + FastAPI + PostgreSQL): producto institucional para colegios.

## 2. Regla de Separación

### Solución A: Sitio Público (`vocari.cl`)
- Carpeta: `src/` (raíz).
- Meta: capturar intención, derivar al test y convertir leads.
- KPI: tasa de clic a `/test`, tasa de derivación a `app.vocari.cl/test-gratis`.

### Solución B: Producto Institucional (`app.vocari.cl`)
- Frontend: `frontend/`.
- Backend: `backend/`.
- Meta: ejecutar test, generar informe IA, seguimiento y paneles para colegios.
- KPI: finalización de test, calidad de informe, uso de paneles por orientador.

## 3. Alcance Inmediato (Siguiente Sprint)

### A. vocari.cl (funnel)
1. Asegurar que `/test` redirija a `https://app.vocari.cl/test-gratis`.
2. Capturar `nombre` + `email` antes de derivar.
3. Enviar evento de origen para atribución (source/campaign).

### B. app.vocari.cl (producto)
1. Mejorar UX de carga al final del test (estado de progreso y mensajes claros).
2. Guardar en backend: `nombre`, `correo`, respuestas de test, encuesta final e informe IA.
3. Mostrar informe IA con mejor contraste visual y contenido personalizado por nombre.
4. Exponer revisión de resultados en `/revision-leads` con login fijo de MVP.

## 4. Modelo de Datos Mínimo (Backend FastAPI)

Tabla recomendada para MVP institucional:

- `leads`
  - `id` uuid
  - `nombre` text not null
  - `email` text not null
  - `holland_code` text
  - `test_answers` jsonb not null default `{}`
  - `survey_response` jsonb not null default `{}`
  - `ai_report_text` text
  - `ai_report_generated_at` timestamptz
  - `source` text
  - `metadata` jsonb not null default `{}`
  - `created_at` timestamptz not null default now()
  - `updated_at` timestamptz not null default now()

## 5. Contratos API Base (MVP)

1. `POST /api/v1/leads`
  - Crea lead con nombre/correo/source.

2. `POST /api/v1/tests/submit`
  - Guarda respuestas y dispara generación de informe IA.

3. `POST /api/v1/leads/{id}/survey`
  - Guarda encuesta final.

4. `GET /api/v1/informe/{id}`
  - Retorna informe IA y resumen de resultados.

5. `GET /api/v1/revision/leads`
  - Lista leads + estado del test + encuesta + extracto informe IA.
  - Protegido con login fijo MVP.

## 6. Plan de Implementación (2 Semanas)

### Semana 1
1. Backend:
  - cerrar schema `leads` y migración
  - endpoint de escritura test + encuesta
  - persistencia de informe IA
2. Frontend app:
  - formulario de identificación antes del test
  - estado de carga final optimizado
  - encuesta final corta (3 preguntas)

### Semana 2
1. Frontend app:
  - refinamiento UI informe IA (colores claros y legibles)
  - `/revision-leads` funcional con filtros básicos
2. Sitio público:
  - validación de redirección y tracking origen
3. QA:
  - prueba E2E: landing -> test -> informe -> revisión leads

## 7. Criterios de Aceptación

1. El nombre y correo se guardan antes del test.
2. El informe IA usa el nombre del estudiante y queda persistido.
3. Encuesta final queda en base de datos vinculada al lead.
4. `/revision-leads` muestra todos los registros para revisión interna.
5. La carga final del informe no supera 3-5s percibidos sin feedback visual.

## 8. Orden de Desarrollo Recomendado

1. Backend de persistencia (`leads` + endpoints).
2. Flujo de test (`frontend/app/test-gratis`) con identificación obligatoria.
3. Informe IA persistido y UI legible.
4. Panel de revisión de leads.
5. Ajustes de landing (`vocari.cl`) para derivación y tracking.
