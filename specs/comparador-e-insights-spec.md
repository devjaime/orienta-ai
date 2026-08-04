# Spec - Comparador de Carreras + Insights Institucionales

## Objetivo
Mejorar calidad de decisión del estudiante y entregar inteligencia agregada para colegios.

## Módulo 1: Comparador de carreras (estudiante)

## Ruta
- `frontend/app/(dashboard)/estudiante/carreras/comparador` (nueva)

## Funcionalidad
1. seleccionar 2-4 carreras.
2. comparar en tabla:
- empleabilidad
- ingreso promedio
- saturación
- años de estudio
- tendencia proyectada

3. escenarios:
- conservador
- base
- optimista

## Endpoints
1. `GET /api/v1/careers/compare?ids=...`
2. `GET /api/v1/careers/scenarios?ids=...&mode=base`

## Criterios
1. usable en móvil.
2. claridad visual de trade-offs.
3. CTA para “hablar con orientador”.

## Módulo 2: Insights institucionales (admin/orientador)

## Objetivo
Detectar tendencias vocacionales y focos de intervención por cohorte.

## Vistas
1. carreras más interesadas por generación.
2. evolución de perfiles RIASEC en el tiempo.
3. mapa de indecisión por curso.

## Endpoints
1. `GET /api/v1/admin/insights/careers-trend?periodo=`
2. `GET /api/v1/admin/insights/riasec-trend?periodo=`
3. `GET /api/v1/admin/insights/indecision-alerts?periodo=`

## Datos y agregados
fuentes:
- `test_results`
- `leads` (clarity_score, holland_code)
- `student_journey` (si ya existe)

salida:
- siempre agregada por curso/generación.

## UX
1. gráficos de tendencia y barras apiladas.
2. filtros por periodo/curso/generación.
3. export CSV/PDF.

## Analytics
1. `career_compare_used`
2. `career_compare_scenario_changed`
3. `insights_dashboard_viewed`
4. `insights_export_triggered`

## Criterios de aceptación
1. Comparador permite decisión informada con datos reales.
2. Insights muestran tendencias accionables para el colegio.
3. Exportables funcionales para reuniones directivas.
