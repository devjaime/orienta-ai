# Sprint 3 - Tickets Técnicos (Seguimiento + Insights + Comparador)

## Objetivo del sprint
Aumentar retención post-test y entregar señal estratégica para colegios.

## Ticket 1 - Backend: seguimiento automático D0/D7/D21
### Alcance
- crear/usar tabla `followup_events`.
- programar eventos al completar test.
- registrar estado de envío (`pending|sent|failed|cancelled`).

### Archivos
- `backend/app/followups/models.py` (nuevo)
- `backend/app/followups/service.py` (nuevo)
- `workers/worker.py`

### Criterios de aceptación
1. Se crean 3 eventos por estudiante (D0, D7, D21).
2. Worker procesa y actualiza estado.
3. Existe regla anti-spam configurable.

## Ticket 2 - Frontend App: timeline de seguimiento en ficha orientador
### Alcance
- mostrar historial de seguimientos en `/orientador/estudiantes/[id]`.
- mostrar tipo de mensaje, fecha programada y estado.

### Archivos
- `frontend/app/(dashboard)/orientador/estudiantes/[id]/page.tsx`
- `frontend/components/orientador/FollowupTimeline.tsx` (nuevo)

### Criterios de aceptación
1. El orientador visualiza próximos y pasados seguimientos.
2. Se identifica fácilmente eventos fallidos.

## Ticket 3 - Frontend App: comparador de carreras
### Alcance
- nueva ruta `/estudiante/comparador`.
- comparar 2-4 carreras con:
  - empleabilidad
  - ingreso promedio
  - saturación
  - años de estudio
  - tendencia futura

### Archivos
- `frontend/app/(dashboard)/estudiante/comparador/page.tsx` (nuevo)
- `frontend/components/carreras/CareerCompareTable.tsx` (nuevo)
- `frontend/lib/recomendacionCarreras*`

### Criterios de aceptación
1. Experiencia mobile-first usable.
2. Comparación clara de trade-offs.
3. CTA para conversar con orientador.

## Ticket 4 - Backend/Admin: insights por cohorte
### Alcance
- endpoint `GET /api/v1/admin/insights`.
- resultados:
  - carreras más interesadas por generación.
  - evolución de claridad por curso.
  - alertas de alta indecisión.

### Archivos
- `backend/app/admin/router.py`
- `backend/app/admin/service.py`
- `backend/tests/test_admin/test_insights.py`

### Criterios de aceptación
1. Filtro por periodo mensual.
2. Respuesta lista para render en charts.
3. Exportable a CSV.

## Ticket 5 - Frontend App: vista de insights admin
### Alcance
- nueva ruta `/admin/insights`.
- incluir:
  - top carreras por cohorte
  - gráfico tendencia claridad mensual
  - tabla alertas de indecisión

### Archivos
- `frontend/app/(dashboard)/admin/insights/page.tsx` (nuevo)
- `frontend/components/admin/*`

### Criterios de aceptación
1. Visualmente entendible para dirección académica.
2. Carga en menos de 2 segundos con datos MVP.
3. Export de vista a CSV/PDF.
