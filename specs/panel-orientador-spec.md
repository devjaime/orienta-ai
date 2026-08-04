# Spec - Panel Profesional de Orientador

## Objetivo
Entregar al orientador una vista operativa para priorizar estudiantes, registrar notas y gestionar seguimiento.

## Alcance
- Frontend: `frontend/app/(dashboard)/orientador/estudiantes`
- Backend: módulo nuevo `backend/app/orientador/`

## Vistas
1. Lista estudiantes
- columnas: nombre, curso, estado test, holland_code, claridad, última actividad, alerta.
- filtros: curso, estado, claridad, búsqueda por nombre/correo.

2. Ficha estudiante
- resumen vocacional.
- historial test/informes IA.
- notas orientador.
- tareas de seguimiento.

## Modelo de datos
1. `advisor_notes`
- `id`, `student_id`, `orientador_id`, `note`, `created_at`, `updated_at`.

2. `advisor_tasks`
- `id`, `student_id`, `orientador_id`, `title`, `status`, `due_date`, `created_at`.

3. `student_journey`
- `student_id`, `test_status`, `clarity_score`, `risk_level`, `last_activity_at`.

## Endpoints
1. `GET /api/v1/orientador/students`
2. `GET /api/v1/orientador/students/{student_id}`
3. `POST /api/v1/orientador/students/{student_id}/notes`
4. `GET /api/v1/orientador/students/{student_id}/notes`
5. `POST /api/v1/orientador/students/{student_id}/tasks`
6. `PATCH /api/v1/orientador/tasks/{task_id}`

## Reglas
1. Solo `orientador`, `admin_colegio`, `super_admin` pueden acceder.
2. Filtro por institución obligatoria.
3. `risk_level`:
- `alto` si `clarity_score <= 2`
- `medio` si `clarity_score = 3`
- `bajo` si `clarity_score >= 4`

## UX
1. Tabla con badges de riesgo/estado.
2. Drawer/modal para notas rápidas.
3. Timeline de actividad por estudiante.

## Analytics
1. `orientador_students_viewed`
2. `orientador_note_created`
3. `orientador_task_created`
4. `orientador_task_completed`

## Criterios de aceptación
1. Orientador puede filtrar y priorizar casos críticos.
2. Notas/tareas quedan persistidas y visibles en ficha.
3. Sin cruce de estudiantes entre instituciones.
