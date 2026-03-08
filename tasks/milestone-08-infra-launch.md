# Milestone 8: Infrastructure, Deployment, y Launch

> Duracion: Semanas 19-24
> Objetivo: Produccion-ready: CI/CD, monitoring, security hardening, deployment
> Dependencias: Milestones 1-6 completados, Milestone 7 en progreso

---

## Resumen

Preparar la plataforma para produccion: deployment a GCP Cloud Run, CI/CD completo, monitoring, security review, performance testing, y documentacion de operaciones.

---

## Tareas

### T8.1 - GCP project setup
- **Estimacion**: 1 dia
- **Descripcion**: Crear proyecto GCP, habilitar APIs, configurar billing, IAM roles
- **Entregable**: Proyecto GCP configurado con todos los servicios necesarios

### T8.2 - Cloud SQL setup
- **Estimacion**: 1 dia
- **Descripcion**: Provisionar Cloud SQL PostgreSQL 17, configurar backups, SSL, connection pooling
- **Entregable**: Base de datos productiva con schema migrado

### T8.3 - Cloud Run deployment
- **Estimacion**: 2 dias
- **Descripcion**: Deploy frontend, backend, y workers como Cloud Run services. Configurar auto-scaling, env vars, secrets.
- **Entregable**: 3 servicios Cloud Run funcionando

### T8.4 - Redis (Memorystore o Upstash)
- **Estimacion**: 0.5 dia
- **Descripcion**: Provisionar Redis managed, configurar conexion desde Cloud Run
- **Entregable**: Redis productivo conectado

### T8.5 - Object Storage setup
- **Estimacion**: 0.5 dia
- **Descripcion**: Crear bucket Cloud Storage, configurar CORS, lifecycle rules
- **Entregable**: Bucket para reportes PDF y assets

### T8.6 - Cloudflare DNS + CDN + SSL
- **Estimacion**: 0.5 dia
- **Descripcion**: Configurar DNS vocari.cl, SSL, CDN, WAF rules basicas
- **Entregable**: vocari.cl resuelve correctamente con HTTPS

### T8.7 - CI/CD pipeline completo
- **Estimacion**: 2 dias
- **Descripcion**: GitHub Actions: lint -> test -> build -> push -> deploy staging -> smoke test -> deploy prod (manual gate)
- **Entregable**: `.github/workflows/deploy.yml`
- **Referencia**: `specs/infra.md` seccion 9

### T8.8 - Monitoring setup
- **Estimacion**: 1 dia
- **Descripcion**: Sentry (error tracking), Cloud Monitoring (infra), health checks, alertas
- **Entregable**: Monitoring funcional con alertas criticas
- **Referencia**: `specs/infra.md` seccion 10

### T8.9 - Security review
- **Estimacion**: 2 dias
- **Descripcion**: Review de: auth flow, RBAC enforcement, multi-tenancy isolation, PII handling, secrets management, CORS, rate limiting
- **Entregable**: Security checklist completada, vulnerabilidades mitigadas

### T8.10 - Performance testing
- **Estimacion**: 1 dia
- **Descripcion**: Load test con k6 o locust: 100 usuarios concurrentes, 50 sesiones/hora, AI pipeline under load
- **Entregable**: Reporte de performance, bottlenecks identificados

### T8.11 - Data migration from Supabase
- **Estimacion**: 2 dias
- **Descripcion**: Migrar datos existentes de Supabase a Cloud SQL: users, institutions, test_results, sessions
- **Entregable**: Script de migracion, validacion de integridad, rollback plan

### T8.12 - Google Workspace onboarding guide
- **Estimacion**: 1 dia
- **Descripcion**: Guia paso a paso para admin de colegio: configurar Service Account, habilitar APIs, Domain-Wide Delegation
- **Entregable**: Documento + screenshots + video

### T8.13 - Operations runbook
- **Estimacion**: 1 dia
- **Descripcion**: Documentar: deployment, rollback, database maintenance, incident response, scaling
- **Entregable**: Runbook para operaciones

### T8.14 - Staging environment
- **Estimacion**: 1 dia
- **Descripcion**: Replicar infra en proyecto GCP separado para staging
- **Entregable**: Staging environment funcional

---

## Criterios de Aceptacion

- [ ] vocari.cl accesible con HTTPS
- [ ] Deploy automatizado via GitHub Actions
- [ ] Rollback funcional en < 5 minutos
- [ ] Monitoring con alertas para errores criticos
- [ ] Performance: < 500ms p95 para API requests, < 3s para page load
- [ ] Security: sin vulnerabilidades criticas
- [ ] Datos migrados desde Supabase con integridad verificada
- [ ] Staging environment funcional para QA

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| Migracion de datos con perdida | Media | **Critico** | Dry-run multiple, validacion checksum, rollback a Supabase |
| Cold start de Cloud Run alto (> 5s) | Media | Medio | Min instances = 1 en produccion, imagen optimizada |
| Costos GCP mayores a lo estimado | Baja | Medio | Billing alerts, budget caps |
