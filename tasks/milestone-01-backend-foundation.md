# Milestone 1: Fundacion del Backend

> Duracion: Semanas 1-4
> Objetivo: Backend FastAPI funcional con auth, DB, y estructura base
> Dependencias: Ninguna (inicio del proyecto)

---

## Resumen

Establecer la base del nuevo backend Python FastAPI con autenticacion Google OAuth, conexion a PostgreSQL (migrando schema desde Supabase), Redis, y la estructura modular completa. Al final de este milestone, un desarrollador puede hacer login, ver su perfil, y el backend responde con datos reales.

---

## Tareas

### T1.1 - Scaffolding del proyecto backend
- **Estimacion**: 1 dia
- **Descripcion**: Crear estructura de directorios, pyproject.toml, Dockerfile, docker-compose.yml
- **Entregable**: `backend/` con estructura completa, `docker-compose up` levanta todos los servicios
- **Referencia**: `specs/backend.md` seccion 1

### T1.2 - Configuracion y settings
- **Estimacion**: 0.5 dia
- **Descripcion**: Implementar config.py con pydantic-settings, .env.example, variables de entorno
- **Entregable**: Settings cargados desde env vars, validados por Pydantic

### T1.3 - Conexion a PostgreSQL con SQLAlchemy
- **Estimacion**: 1 dia
- **Descripcion**: Configurar SQLAlchemy 2.0 async, session factory, dependency injection
- **Entregable**: `common/database.py`, connection pooling, health check endpoint
- **Referencia**: `specs/backend.md` seccion 4

### T1.4 - Modelos SQLAlchemy core
- **Estimacion**: 2 dias
- **Descripcion**: Migrar schema desde Supabase a SQLAlchemy models: User, UserProfile, Institution, Session, TestResult, ConsentRecord, AuditLog
- **Entregable**: Todos los modelos core, Alembic migrations generadas
- **Referencia**: `specs/architecture.md` seccion 5, `specs/backend.md` seccion 4.2

### T1.5 - Alembic setup y migracion inicial
- **Estimacion**: 1 dia
- **Descripcion**: Configurar Alembic, generar migracion inicial, script para importar datos existentes de Supabase
- **Entregable**: `alembic upgrade head` crea schema completo, script de migracion de datos

### T1.6 - Auth module: Google OAuth
- **Estimacion**: 2 dias
- **Descripcion**: Implementar flujo OAuth completo: redirect a Google, callback, emision de JWT, refresh tokens
- **Entregable**: Endpoints /auth/google, /auth/callback, /auth/refresh, /auth/me, /auth/logout
- **Referencia**: `specs/backend.md` seccion 2.1

### T1.7 - Auth middleware y RBAC
- **Estimacion**: 1 dia
- **Descripcion**: Middleware de autenticacion (JWT verification), decoradores de roles, tenant context injection
- **Entregable**: `@require_roles()`, `@require_same_institution`, middleware stack funcional
- **Referencia**: `specs/backend.md` seccion 5

### T1.8 - Redis setup
- **Estimacion**: 0.5 dia
- **Descripcion**: Configurar conexion Redis, dependency injection, health check
- **Entregable**: `common/redis.py`, Redis disponible en todos los modules

### T1.9 - Institutions module
- **Estimacion**: 1 dia
- **Descripcion**: CRUD de instituciones, multi-tenant filtering, config Google Workspace (placeholder)
- **Entregable**: Endpoints /institutions/*, tenant isolation verificado
- **Referencia**: `specs/backend.md` seccion 2

### T1.10 - Error handling y logging
- **Estimacion**: 1 dia
- **Descripcion**: Exception hierarchy, global error handler, structured JSON logging
- **Entregable**: `common/exceptions.py`, error responses estandarizados, logs en JSON
- **Referencia**: `specs/backend.md` seccion 7

### T1.11 - Tests base
- **Estimacion**: 1 dia
- **Descripcion**: Setup pytest + testcontainers, fixtures base, test de auth flow, test de tenant isolation
- **Entregable**: `pytest` pasa con tests de auth y multi-tenancy

### T1.12 - CI pipeline basico
- **Estimacion**: 0.5 dia
- **Descripcion**: GitHub Actions: lint (ruff), type check (mypy), tests (pytest), build Docker image
- **Entregable**: `.github/workflows/backend.yml`

---

## Criterios de Aceptacion

- [ ] `docker-compose up` levanta backend, PostgreSQL, Redis
- [ ] Login con Google OAuth funciona end-to-end
- [ ] JWT tokens emitidos y verificados correctamente
- [ ] Multi-tenant isolation: user de institucion A no puede ver datos de institucion B
- [ ] Roles verificados en todos los endpoints
- [ ] Alembic migrations aplicables de forma limpia
- [ ] CI pipeline verde
- [ ] Cobertura de tests > 60% para auth module

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| Migracion de datos Supabase con inconsistencias | Media | Alto | Script de validacion pre-migracion |
| Google OAuth config compleja con Workspace escolar | Media | Medio | Documentar setup paso a paso |
| SQLAlchemy async learning curve | Baja | Bajo | Equipo ya tiene experiencia Python |
