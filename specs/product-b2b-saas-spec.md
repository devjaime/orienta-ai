# Vocari B2B SaaS Spec (MVP -> Licencia Anual Colegios)

## 1. Objetivo de Producto
Convertir Vocari en una plataforma institucional vendible a colegios en Chile, con foco en:
- Impacto en estudiantes: mayor claridad vocacional y plan de acción.
- Productividad de orientadores: seguimiento estructurado por curso.
- Visibilidad para dirección: métricas agregadas para decisiones académicas.

## 2. Cliente Pagador y Usuarios
- Cliente pagador: colegio/institución educativa (contrato anual).
- Usuario operativo: orientador vocacional del colegio.
- Usuario de control: administrador institucional.
- Usuario final: estudiante.

## 3. Propuesta de Valor B2B
- Plataforma única para test, interpretación, seguimiento y reportabilidad.
- Orientador virtual con contexto del estudiante (no chatbot genérico).
- Panel institucional con métricas accionables por curso/generación.
- Evidencia para reuniones con apoderados y plan de acompañamiento.

## 4. KPIs de Éxito (Contrato Anual)
- Activación: % estudiantes que completan test por curso.
- Claridad: % estudiantes con nivel de claridad vocacional >= umbral.
- Seguimiento: % estudiantes con al menos 1 interacción orientador/IA post-test.
- Eficiencia orientador: tiempo promedio por estudiante (meta a la baja).
- Retención B2B: renovación anual y NPS de orientadores/admin.

## 5. Priorización por Valor/Esfuerzo
P0 (obligatorio para vender piloto institucional):
1. Panel orientador con lista de estudiantes, estado, alertas y notas.
2. Panel admin institucional con métricas de adopción y distribución RIASEC.
3. Orientador IA contextual post-test con respuestas accionables.
4. Seguimiento automático post-test (recordatorios y nudges).
5. Exportables PDF/CSV para reuniones de orientación.

P1 (diferenciación comercial):
1. Simulación/comparador de carreras con escenarios.
2. Insights por generación y tendencias temporales.
3. Segmentación de estudiantes indecisos para intervención priorizada.

P2 (escala/ventaja):
1. Scoring predictivo de indecisión/riesgo de deserción vocacional.
2. Benchmarking entre cohortes e instituciones (agregado anonimizado).

## 6. Especificación por Módulo

### 6.1 AI Career Advisor (Post-Test)
Objetivo:
- Guiar al estudiante después del test con recomendaciones personalizadas y próximos pasos concretos.

Casos de uso:
1. Interpretar perfil RIASEC en lenguaje simple y personalizado.
2. Explicar por qué una carrera encaja/no encaja con su perfil.
3. Proponer rutas de exploración (3 carreras + acciones concretas).
4. Recomendar habilidades a desarrollar según brecha.

Entradas mínimas del motor:
- `nombre`, `holland_code`, `scores`, `recomendaciones`, `encuesta`, historial de interacción.

Formato de respuesta obligatorio:
1. Resumen personalizado (2-3 líneas).
2. Evidencia (datos de empleabilidad/ingreso/saturación).
3. Próximos pasos (checklist 7/30 días).

Criterios de aceptación:
- Toda respuesta usa nombre del estudiante.
- Toda recomendación incluye al menos 1 evidencia concreta.
- Sin respuestas vacías/generales tipo “depende”.
- Se guarda texto generado + timestamp para auditoría.

### 6.2 Panel Profesional Orientador
Objetivo:
- Operar el seguimiento de estudiantes por curso desde una sola vista.

Vista principal:
- Tabla de estudiantes con: estado test, perfil, claridad, última actividad, alerta, próxima acción.

Vista estudiante:
- Perfil vocacional, resultados test, historial IA, notas orientador, tareas y estado de seguimiento.

Alertas:
- Perfil difuso.
- Alta indecisión (según encuesta/interacciones).
- Inactividad post-test.

Criterios de aceptación:
- Filtrar por curso, estado y nivel de claridad.
- Guardar notas con fecha y autor.
- Exportar ficha de estudiante a PDF para reunión.

### 6.3 Panel Admin Colegio
Objetivo:
- Entregar control de adopción y resultados agregados por institución.

Métricas mínimas:
- Estudiantes totales vs test completado.
- Distribución RIASEC por curso/generación.
- Top carreras de interés.
- Índice de indecisión por curso.

Gestión:
- Alta/baja de orientadores/admins.
- Importación masiva de estudiantes.
- Roles y permisos institucionales.

Criterios de aceptación:
- Dashboard con filtros por curso/generación.
- Reporte mensual exportable.
- Vista agregada sin exponer datos sensibles fuera de permisos.

### 6.4 Simulación de Futuro Profesional
Objetivo:
- Mejorar calidad de decisión comparando carreras con datos reales.

Comparador:
- 2 a 4 carreras con columnas: empleabilidad, ingreso, saturación, años de estudio, demanda.

Escenarios:
- Conservador, base, optimista.

Criterios de aceptación:
- Comparador usable en móvil/desktop.
- Visualización clara de trade-offs.
- CTA directo para agendar sesión con orientador.

### 6.5 Seguimiento Automático
Objetivo:
- Mantener al estudiante en el proceso y aumentar cierre de orientación.

Flujos:
1. Día 0: resumen y próximos pasos.
2. Día 7: recordatorio de exploración.
3. Día 21: sugerencia de sesión con orientador si indecisión alta.

Criterios de aceptación:
- Plantillas por perfil RIASEC.
- Registro de envíos y estado (enviado/abierto).
- Regla de no-spam (máx. frecuencia configurable).

### 6.6 Insights Institucionales
Objetivo:
- Convertir datos en decisiones para el colegio.

Insights:
- Carreras más interesadas por cohorte.
- Evolución de perfiles en el tiempo.
- Alertas de grupos con alta indecisión.

Criterios de aceptación:
- Vista agregada por periodo.
- Tendencias comparables mes a mes.
- Exportable a CSV/PDF.

## 7. Diseño Técnico sobre Solución Actual

### 7.1 Backend FastAPI + PostgreSQL
Nuevas entidades sugeridas:
- `student_journey` (estado del proceso vocacional).
- `advisor_notes` (notas orientador por estudiante).
- `advisor_tasks` (acciones de seguimiento).
- `institution_metrics_snapshots` (agregados por período).
- `followup_events` (historial de nudges/email).

Extensiones inmediatas (sobre lo ya implementado):
1. Leads:
- Persistir y exponer `ai_report_text`, `ai_report_generated_at`, `clarity_score`.
2. Reportes:
- Endpoint de reporte orientador por estudiante (con export).
3. Dashboards:
- Endpoints agregados por institución/curso.

APIs nuevas (propuesta):
- `GET /api/v1/orientador/students?curso=&estado=&claridad=`
- `GET /api/v1/orientador/students/{id}`
- `POST /api/v1/orientador/students/{id}/notes`
- `POST /api/v1/orientador/students/{id}/tasks`
- `GET /api/v1/admin/metrics?curso=&periodo=`
- `GET /api/v1/admin/insights?periodo=`
- `GET /api/v1/students/{id}/export`

### 7.2 Frontend Next.js
Rutas nuevas sugeridas:
- `/orientador/estudiantes` (tabla operativa).
- `/orientador/estudiantes/[id]` (perfil 360° estudiante).
- `/admin/metricas` (agregados institucionales).
- `/admin/insights` (tendencias y alertas).
- `/estudiante/comparador` (simulación/comparación).

Componentes nuevos sugeridos:
- `StudentRiskBadge`, `ClarityScoreCard`, `AdvisorNotesPanel`, `FollowupTimeline`, `CareerCompareTable`.

## 8. Roadmap de Implementación (12 semanas)

Fase 1 (Semanas 1-4) - P0 operativo:
1. Panel orientador básico + notas + alertas.
2. Métricas admin básicas por curso.
3. AI Advisor contextual con formato estructurado.
4. Persistencia completa de interacciones IA.

Fase 2 (Semanas 5-8) - P0 completo:
1. Seguimiento automático (D0/D7/D21).
2. Exportables PDF/CSV orientador/admin.
3. Índice de indecisión visible en paneles.

Fase 3 (Semanas 9-12) - P1:
1. Comparador de carreras con escenarios.
2. Insights de tendencias por generación.
3. Alertas grupales para intervención.

## 9. Definition of Done (DoD)
- Feature con criterios de aceptación cumplidos.
- Eventos instrumentados para KPI.
- Permisos por rol aplicados.
- Validado en móvil y desktop.
- Documentación breve en `specs/` y changelog interno.

## 10. Backlog Inicial (Historias ejecutables)

EPIC A - Panel Orientador:
1. Como orientador, quiero ver todos mis estudiantes con estado de avance para priorizar atención.
2. Como orientador, quiero registrar notas por estudiante para mantener continuidad.
3. Como orientador, quiero marcar tareas/seguimientos para no perder casos críticos.

EPIC B - Admin Colegio:
1. Como admin, quiero ver adopción por curso para medir implementación.
2. Como admin, quiero distribución RIASEC agregada para planificar orientación.
3. Como admin, quiero exportar reportes mensuales para dirección.

EPIC C - AI Advisor:
1. Como estudiante, quiero un informe IA personalizado por mi nombre y perfil.
2. Como estudiante, quiero próximos pasos concretos para avanzar en mi decisión.
3. Como orientador, quiero revisar el informe IA generado para validar calidad.

EPIC D - Seguimiento:
1. Como estudiante, quiero recordatorios relevantes según mi perfil.
2. Como orientador, quiero alertas de indecisión para intervenir a tiempo.

## 11. Riesgos y Mitigación
- Riesgo: IA genérica y poco accionable.
  Mitigación: formato obligatorio + datos contextuales + evaluación de calidad.
- Riesgo: baja adopción orientador por complejidad.
  Mitigación: UX orientada a flujo diario, no a reportes largos.
- Riesgo: datos sensibles.
  Mitigación: permisos por rol, vistas agregadas para admin y trazabilidad.

## 12. Decisión de Arranque (Recomendada)
Iniciar por P0 en este orden:
1. `Panel orientador`.
2. `Métricas admin básicas`.
3. `AI Advisor contextual auditado`.
4. `Seguimiento automático`.

Con eso Vocari pasa de “test + resultado” a “sistema institucional de orientación” vendible por licencia anual.
