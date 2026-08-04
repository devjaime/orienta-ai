# Spec - Panel Administrativo para Colegios

## Objetivo
Dar visibilidad institucional a adopción, resultados vocacionales agregados y gestión operativa de usuarios.

## Alcance
- Frontend: `frontend/app/(dashboard)/admin/*`
- Backend: `backend/app/admin_metrics/` (nuevo) o extensión de `dashboards`.

## Dashboard mínimo
1. Adopción
- total estudiantes
- test iniciado/completado
- tasa de completitud por curso

2. Perfil vocacional agregado
- distribución RIASEC por curso/generación
- top 10 carreras de interés

3. Riesgo de indecisión
- promedio de `clarity_score` por curso
- cantidad de estudiantes en riesgo alto

## Gestión administrativa
1. Estudiantes
- importar CSV
- activar/desactivar
- reasignar curso

2. Orientadores
- alta/baja
- asignación de cursos

3. Roles
- `admin_colegio`, `orientador`, `estudiante`

## Endpoints
1. `GET /api/v1/admin/metrics?curso=&periodo=`
2. `GET /api/v1/admin/insights?periodo=`
3. `GET /api/v1/admin/riasec-distribution?curso=`
4. `GET /api/v1/admin/career-interest?curso=`
5. `GET /api/v1/admin/indecision-index?curso=`
6. `GET /api/v1/admin/export?type=csv&periodo=`

## Seguridad y permisos
1. Solo `admin_colegio` y `super_admin`.
2. Métricas siempre agregadas por institución.
3. No exponer PII en vistas agregadas.

## UX
1. Tarjetas KPI + gráficos comparativos.
2. Filtros por curso, generación y periodo.
3. Export CSV desde cabecera del dashboard.

## Analytics
1. `admin_dashboard_viewed`
2. `admin_filter_applied`
3. `admin_export_triggered`

## Criterios de aceptación
1. Dashboard carga en < 2s con datos cacheados.
2. Filtros reflejan datos correctos.
3. Export genera archivo descargable con agregados.
