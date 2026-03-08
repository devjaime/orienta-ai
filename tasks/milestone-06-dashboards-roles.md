# Milestone 6: Dashboards Completos y Roles

> Duracion: Semanas 11-14
> Objetivo: Dashboards de apoderado, admin de colegio, y super admin
> Dependencias: Milestone 4 (frontend base), Milestone 5 (perfil longitudinal)

---

## Resumen

Completar todos los dashboards por rol: apoderado (vista del hijo), admin de colegio (metricas institucionales), y super admin (gestion de plataforma). Incluye consent management, parent-student linking, y CSV import.

---

## Tareas

### T6.1 - Parent dashboard API
- **Estimacion**: 2 dias
- **Descripcion**: GET /dashboards/parent con datos de hijos vinculados: perfil, sesiones, tests, happiness
- **Entregable**: Endpoint completo con datos agregados por hijo

### T6.2 - Parent dashboard UI
- **Estimacion**: 2 dias
- **Descripcion**: Dashboard con overview de cada hijo, navegacion a perfil detallado
- **Entregable**: `/apoderado`, `/apoderado/hijos/[id]`
- **Referencia**: `specs/frontend.md` seccion 4.3

### T6.3 - Consent management (full)
- **Estimacion**: 2 dias
- **Descripcion**: UI y backend completo: otorgar/revocar consentimiento, verificacion antes de operaciones sensibles
- **Entregable**: `/apoderado/consentimiento`, ConsentBanner, enforcement en backend
- **Referencia**: `specs/backend.md` seccion 2.8

### T6.4 - Parent-student linking
- **Estimacion**: 1 dia
- **Descripcion**: Flujo para vincular apoderado con estudiante (invitacion, verificacion)
- **Entregable**: API de linking + UI de vinculacion

### T6.5 - Admin colegio dashboard API
- **Estimacion**: 2 dias
- **Descripcion**: GET /dashboards/admin con metricas institucionales: estudiantes, sesiones, engagement, orientadores
- **Entregable**: Endpoint con datos agregados

### T6.6 - Admin colegio dashboard UI
- **Estimacion**: 3 dias
- **Descripcion**: Dashboard con stats, charts de engagement, lista de orientadores con workload, top carreras
- **Entregable**: `/admin` con graficos y tablas
- **Referencia**: `specs/frontend.md` seccion 4.4

### T6.7 - Student import (CSV)
- **Estimacion**: 2 dias
- **Descripcion**: Upload CSV, preview, validacion, creacion batch de estudiantes con codigos de activacion
- **Entregable**: `/admin/importar` con CSVUploader, validation feedback

### T6.8 - Super admin dashboard API
- **Estimacion**: 2 dias
- **Descripcion**: GET /dashboards/super-admin: instituciones activas, revenue, AI usage, errors
- **Entregable**: Endpoint con metricas de plataforma

### T6.9 - Super admin dashboard UI
- **Estimacion**: 2 dias
- **Descripcion**: Dashboard con stats globales, gestion de instituciones, monitoreo de costos IA
- **Entregable**: `/super-admin`, `/super-admin/instituciones`, `/super-admin/monitoreo`
- **Referencia**: `specs/frontend.md` seccion 4.5

### T6.10 - Notification system
- **Estimacion**: 2 dias
- **Descripcion**: Backend: crear/leer/marcar notificaciones. Frontend: NotificationBell con dropdown.
- **Entregable**: API de notificaciones, componente NotificationBell, integracion con sesiones/analisis

### T6.11 - Audit log viewer (admin)
- **Estimacion**: 1 dia
- **Descripcion**: Vista de audit log filtrable por usuario, accion, fecha. Solo para admin y super admin.
- **Entregable**: Pagina de audit log con DataTable

---

## Criterios de Aceptacion

- [ ] Apoderado ve datos de sus hijos vinculados
- [ ] Consentimiento requerido antes de grabacion/IA
- [ ] Admin de colegio ve metricas agregadas de la institucion
- [ ] Import CSV crea estudiantes con codigos de activacion
- [ ] Super admin ve metricas de toda la plataforma
- [ ] Notificaciones aparecen cuando analisis IA completo
- [ ] Audit log registra acciones sensibles
