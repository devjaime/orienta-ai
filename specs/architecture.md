# Vocari - Arquitectura del Sistema

> Version: 2.0 | Fecha: Marzo 2026

---

## 1. Vista General de Arquitectura

```
                         +------------------+
                         |   CDN / Edge     |
                         |  (Cloudflare)    |
                         +--------+---------+
                                  |
                         +--------v---------+
                         |   Next.js App    |
                         |   (Frontend)     |
                         |   SSR + SPA      |
                         +--------+---------+
                                  |
                                  | HTTPS / REST + WebSocket
                                  |
                     +------------v-------------+
                     |     API Gateway          |
                     |     (Nginx / Traefik)    |
                     +---+-------+-------+------+
                         |       |       |
              +----------v+  +---v----+ +v-----------+
              | Auth       |  | Core   | | AI Engine  |
              | Service    |  | API    | | Service    |
              | (FastAPI)  |  |(FastAPI)| | (FastAPI)  |
              +-----+------+  +---+----+ +-----+------+
                    |             |             |
                    +------+------+------+------+
                           |             |
                    +------v------+ +----v--------+
                    | PostgreSQL  | | Object      |
                    | (Primary)   | | Storage     |
                    |             | | (S3/GCS)    |
                    +------+------+ +-------------+
                           |
                    +------v------+
                    | Redis       |
                    | (Cache +    |
                    |  Queue)     |
                    +-------------+

         External Services:
         +------------------+  +------------------+  +------------------+
         | Google Workspace |  | OpenRouter API   |  | MINEDUC Data     |
         | - Meet API       |  | - LLM Models     |  | (Static/Annual)  |
         | - Drive API      |  |                  |  |                  |
         | - Docs API       |  |                  |  |                  |
         | - Calendar API   |  |                  |  |                  |
         +------------------+  +------------------+  +------------------+
```

---

## 2. Principios de Arquitectura

1. **Separation of Concerns**: Frontend, API core, AI engine, y servicios externos como capas independientes
2. **API-First**: Toda la comunicacion entre frontend y backend via REST APIs bien definidas
3. **Stateless Services**: Los servicios FastAPI no mantienen estado en memoria; estado en PostgreSQL + Redis
4. **Queue-Based AI Processing**: El analisis de transcripciones es asincrono via cola de tareas
5. **Multi-Tenant by Design**: Toda query incluye filtro por `institution_id`; aislamiento de datos a nivel de aplicacion
6. **Progressive Migration**: Se puede migrar gradualmente desde el MVP actual sin big-bang rewrite

---

## 3. Servicios y Boundaries

### 3.1 Auth Service

**Responsabilidad**: Autenticacion, autorizacion, gestion de sesiones.

```
Endpoints:
  POST /auth/google          # Inicia OAuth flow con Google
  POST /auth/callback        # Callback de Google OAuth
  POST /auth/refresh         # Refresh token
  POST /auth/logout          # Cierre de sesion
  GET  /auth/me              # Usuario actual + perfil + roles

Dependencias:
  - Google OAuth 2.0
  - PostgreSQL (users, user_profiles, institutions)
  - Redis (session tokens, blacklist)
```

**Decisiones**:
- Mantener Google OAuth como unico metodo de autenticacion (alineado con Google Workspace escolar)
- JWT tokens con refresh tokens en httpOnly cookies
- Role-Based Access Control (RBAC) con roles: `estudiante`, `apoderado`, `orientador`, `admin_colegio`, `super_admin`

### 3.2 Core API Service

**Responsabilidad**: Logica de negocio principal, CRUD, coordinacion.

```
Modules:
  /institutions     # Gestion multi-tenant
  /users            # Perfiles, roles, vinculacion
  /sessions         # Sesiones de orientacion
  /tests            # Tests RIASEC y adaptativos
  /games            # Juegos de evaluacion
  /careers          # Carreras, universidades, datos MINEDUC
  /profiles         # Perfil longitudinal del estudiante
  /reports          # Generacion y descarga de reportes
  /notifications    # Notificaciones push/email
  /audit            # Log de auditoria

Dependencias:
  - PostgreSQL
  - Redis (cache)
  - Object Storage (reportes PDF, assets)
  - AI Engine Service (via HTTP interno o cola)
  - Google Workspace APIs (via servicio dedicado)
```

### 3.3 AI Engine Service

**Responsabilidad**: Todo el procesamiento de IA. Aislado para poder escalar independientemente.

```
Endpoints (internos, no expuestos al frontend):
  POST /ai/analyze-transcript     # Analisis completo de transcripcion
  POST /ai/summarize-session      # Resumen de sesion
  POST /ai/detect-interests       # Deteccion de intereses
  POST /ai/detect-skills          # Deteccion de habilidades
  POST /ai/sentiment-analysis     # Analisis de sentimiento emocional
  POST /ai/suggest-tests          # Sugerir tests/juegos
  POST /ai/generate-questions     # Generar cuestionario adaptativo
  POST /ai/career-simulation      # Simulacion de carrera futura
  POST /ai/generate-report        # Generar reporte comprehensivo
  POST /ai/explain-profile        # Explicar perfil RIASEC

Jobs asincronos (via Redis queue):
  - transcript_analysis_job       # Pipeline completo post-sesion
  - batch_report_generation       # Reportes en batch
  - profile_update_job            # Actualizar perfil longitudinal

Dependencias:
  - OpenRouter API (multiples modelos LLM)
  - PostgreSQL (leer perfiles, escribir resultados)
  - Redis (cola de tareas, cache de respuestas)
  - Object Storage (transcripciones, reportes)
```

### 3.4 Google Workspace Integration Service

**Responsabilidad**: Interfaz con Google Workspace APIs. No es un servicio separado sino un modulo dentro del Core API.

```
Funciones:
  - Crear eventos en Google Calendar con link de Meet
  - Iniciar/detener grabacion de Meet (via API)
  - Recuperar grabacion desde Google Drive
  - Extraer transcripcion desde Google Docs (generado automaticamente)
  - Gestionar permisos de archivos en Drive

APIs de Google utilizadas:
  - Google Calendar API v3
  - Google Meet REST API (recordings)
  - Google Drive API v3
  - Google Docs API v1

Flujo:
  1. Core API crea evento en Calendar con Meet link
  2. Sesion ocurre (Meet graba automaticamente si esta habilitado)
  3. Post-sesion: Core API busca grabacion en Drive del organizador
  4. Core API extrae transcripcion del documento asociado
  5. Core API envia transcripcion al AI Engine para analisis
```

---

## 4. Flujo de Datos

### 4.1 Flujo: Sesion de Orientacion Completa

```
[1] Estudiante agenda sesion
         |
         v
[2] Core API crea evento Calendar + Meet link
         |
         v
[3] Sesion ocurre en Google Meet (grabacion activa)
         |
         v
[4] Post-sesion: Webhook o polling detecta fin de sesion
         |
         v
[5] Core API recupera transcripcion desde Google Drive/Docs
         |
         v
[6] Core API encola job: transcript_analysis
         |
         v
[7] AI Engine procesa (asincrono):
    +-- Resumen
    +-- Deteccion de intereses
    +-- Deteccion de habilidades
    +-- Analisis de sentimiento
    +-- Sugerencia de tests/juegos
         |
         v
[8] Resultados guardados en PostgreSQL
         |
         v
[9] Notificacion a orientador: "Analisis de sesion disponible"
         |
         v
[10] Orientador revisa y aprueba/edita
         |
         v
[11] Perfil longitudinal del estudiante actualizado
         |
         v
[12] Dashboard del estudiante y apoderado actualizados
```

### 4.2 Flujo: Cuestionario Adaptativo

```
[1] Estudiante abre cuestionario asignado
         |
         v
[2] Core API solicita preguntas al AI Engine
    (contexto: transcripcion + perfil actual)
         |
         v
[3] AI Engine genera primera pregunta personalizada
         |
         v
[4] Estudiante responde
         |
         v
[5] Core API envia respuesta al AI Engine
         |
         v
[6] AI Engine ajusta y genera siguiente pregunta
    (loop 10-15 preguntas)
         |
         v
[7] AI Engine genera evaluacion final
         |
         v
[8] Resultados guardados, perfil actualizado
```

### 4.3 Flujo: Recomendacion de Carreras

```
[1] Estudiante solicita recomendaciones
         |
         v
[2] Core API recopila:
    +-- Perfil RIASEC (test)
    +-- Intereses detectados (sesiones)
    +-- Habilidades detectadas (juegos + sesiones)
    +-- Patrones de aprendizaje
    +-- Preferencias expresadas
         |
         v
[3] Motor de matching (deterministico):
    +-- Compara con catalogo de carreras
    +-- Aplica datos MINEDUC (matricula, titulacion)
    +-- Filtra por saturacion de mercado
    +-- Rankea por compatibilidad
         |
         v
[4] AI Engine enriquece (si solicitado):
    +-- Explicacion personalizada de cada recomendacion
    +-- Simulacion de trayectoria profesional
         |
         v
[5] Top 10 carreras presentadas al estudiante
```

---

## 5. Modelo de Datos (Entidades Core)

### Diagrama ER Simplificado

```
institutions
    |-- 1:N -- users (via institution_id)
    |-- 1:N -- institution_config

users
    |-- 1:1 -- user_profiles
    |-- 1:N -- test_results
    |-- 1:N -- session_participants (M:N con sessions)
    |-- 1:N -- game_results
    |-- 1:N -- adaptive_questionnaire_results
    |-- 1:1 -- student_longitudinal_profile

users (apoderado)
    |-- M:N -- users (estudiante) via parent_student_links

users (orientador)
    |-- 1:N -- orientador_availability
    |-- 1:N -- session_notes
    |-- M:N -- users (estudiante) via student_orientador_assignments

sessions
    |-- 1:1 -- session_recordings
    |-- 1:1 -- session_transcripts
    |-- 1:1 -- session_ai_analysis
    |-- 1:N -- session_notes

careers (carreras_enriquecidas)
    |-- datos MINEDUC
    |-- codigos Holland
    |-- universidades
    |-- datos laborales

student_longitudinal_profile
    |-- skills[]
    |-- interests[]
    |-- learning_patterns{}
    |-- happiness_indicators[]
    |-- career_recommendations[]
    |-- riasec_history[]
```

### Tablas Nuevas (vs MVP actual)

| Tabla | Proposito |
|-------|----------|
| `session_recordings` | Metadata de grabaciones (Google Drive file ID, duracion, tamano) |
| `session_transcripts` | Transcripcion completa de la sesion (texto + timestamps) |
| `session_ai_analysis` | Resultados del analisis IA (resumen, intereses, habilidades, sentimiento) |
| `adaptive_questionnaires` | Definicion de cuestionarios adaptativos |
| `adaptive_questionnaire_results` | Respuestas y evaluacion de cuestionarios |
| `games` | Catalogo de juegos de evaluacion |
| `game_results` | Resultados y metricas de juegos |
| `student_longitudinal_profile` | Perfil acumulativo del estudiante (JSON estructurado) |
| `career_simulations` | Simulaciones de carrera generadas por IA |
| `consent_records` | Registro de consentimientos (grabacion, IA, datos) |
| `ai_processing_queue` | Cola de procesamiento IA (tracking de jobs) |

### Tablas Existentes a Conservar/Evolucionar

| Tabla | Accion |
|-------|--------|
| `institutions` | Conservar, agregar campos de config Google Workspace |
| `user_profiles` | Conservar, agregar campos de consentimiento |
| `test_results` | Conservar intacta |
| `scheduled_sessions` | Evolucionar: agregar google_meet_id, recording_id |
| `orientador_availability` | Conservar intacta |
| `session_notes` | Conservar, vincular con session_ai_analysis |
| `carreras_enriquecidas` | Conservar intacta |
| `parent_student_links` | Conservar intacta |
| `audit_log` | Conservar, extender eventos |

---

## 6. Seguridad y Multi-Tenancy

### 6.1 Aislamiento de Datos

```
Estrategia: Application-Level Multi-Tenancy

Toda query a la base de datos DEBE incluir:
  WHERE institution_id = :current_user_institution_id

Implementacion:
  - Middleware FastAPI que inyecta institution_id en el contexto
  - ORM queries con filtro automatico (SQLAlchemy event listeners)
  - Tests automatizados que verifican que ningun endpoint filtra datos cross-tenant
```

### 6.2 Proteccion de Datos de Menores

```
Requisitos:
  1. Consentimiento parental registrado ANTES de:
     - Grabar sesiones
     - Procesar datos con IA
     - Almacenar perfil longitudinal
  2. Derecho a eliminacion: Borrar todos los datos de un estudiante on-demand
  3. Minimizacion de datos: Solo recopilar lo necesario para el servicio
  4. Encriptacion: Datos sensibles encriptados at-rest y in-transit
  5. Anonimizacion: Datos usados para analytics agregados deben ser anonimizados
  6. Retencion: Politica clara de retencion (max 2 anos post-egreso)
```

### 6.3 Autenticacion y Autorizacion

```
Flujo:
  1. Login via Google OAuth 2.0
  2. Backend verifica token con Google
  3. Backend emite JWT (access + refresh)
  4. Frontend envia JWT en Authorization header
  5. Backend middleware verifica JWT + extrae role + institution_id
  6. Cada endpoint tiene decorador de roles permitidos

Ejemplo:
  @router.get("/students/{id}/profile")
  @require_roles(["orientador", "admin_colegio", "super_admin"])
  @require_same_institution
  async def get_student_profile(id: int, context: AuthContext):
      ...
```

---

## 7. Integracion con Google Workspace

### 7.1 Arquitectura de Integracion

```
Vocari Backend
    |
    +-- Google OAuth 2.0 (autenticacion de usuarios)
    |
    +-- Google Calendar API v3
    |     +-- Crear eventos con conferencia Meet
    |     +-- Leer/actualizar/cancelar eventos
    |
    +-- Google Meet REST API
    |     +-- Consultar estado de grabacion
    |     +-- Obtener artifacts (recordings, transcripts)
    |
    +-- Google Drive API v3
    |     +-- Acceder a grabaciones almacenadas
    |     +-- Descargar archivos de video
    |     +-- Acceder a transcripciones auto-generadas
    |
    +-- Google Docs API v1
          +-- Leer contenido de transcripciones
          +-- Extraer texto estructurado con timestamps
```

### 7.2 Service Account vs OAuth

```
Opcion elegida: Domain-Wide Delegation con Service Account

Razon:
  - El colegio configura una Service Account con delegacion
  - Vocari puede acceder a Drive/Calendar/Meet del dominio escolar
  - No requiere que cada usuario autorice individualmente
  - Mejor para B2B donde el admin del colegio autoriza una vez

Alternativa descartada: Per-user OAuth
  - Requiere cada orientador autorice acceso
  - Tokens expiran, requiere refresh flow complejo
  - Peor UX para onboarding
```

### 7.3 Requisitos de Google Workspace

```
Plan minimo: Google Workspace Business Starter ($6 USD/user/month)
  - Google Meet con grabacion (disponible en Business Starter+)
  - Google Drive con 30GB/user
  - Google Calendar
  - Admin console para Service Account setup

Nota: La grabacion en Google Meet requiere plan Business Starter o superior.
      El plan Education (gratuito para colegios) NO incluye grabacion.
      Esto es una restriccion critica a validar con cada colegio.
```

---

## 8. Estrategia de Comunicacion entre Servicios

### Sincrono (HTTP)

- Frontend <-> Core API: REST sobre HTTPS
- Core API <-> AI Engine: HTTP interno (dentro del mismo cluster Docker)
- Core API <-> Google APIs: HTTPS con client libraries oficiales

### Asincrono (Queue)

- Analisis de transcripciones: Redis queue (via `rq` o `celery`)
- Generacion de reportes: Redis queue
- Notificaciones: Redis queue
- Actualizacion de perfil longitudinal: Redis queue

### Eventos

- WebSocket (via FastAPI WebSocket): Notificaciones en tiempo real al frontend
- Polling como fallback si WebSocket no disponible

---

## 9. Decisiones de Arquitectura (ADRs)

### ADR-001: Next.js sobre Vite+React

**Contexto**: El MVP usa Vite+React (SPA pura). La nueva arquitectura requiere SEO para landing pages, SSR para dashboards, y mejor DX.

**Decision**: Migrar a Next.js.

**Razones**:
- SSR/SSG para landing pages (SEO)
- API routes como BFF (Backend For Frontend) si se necesita
- App Router con layouts anidados para dashboards complejos
- Mejor performance percibida con streaming SSR
- Ecosistema maduro para produccion

**Riesgo**: Migracion de componentes React existentes (bajo riesgo, son compatibles).

### ADR-002: FastAPI sobre mantener Supabase+Netlify Functions

**Contexto**: El MVP usa Supabase RPCs + Netlify Functions. Esto limita la complejidad de la logica de negocio.

**Decision**: Migrar a Python FastAPI como backend principal.

**Razones**:
- Logica de negocio compleja (pipeline IA, sesiones, perfiles longitudinales)
- Python es el ecosistema natural para IA/ML
- Mejor testabilidad y debugging que serverless functions
- Tipado fuerte con Pydantic
- Escalamiento mas predecible que serverless

**Tradeoff**: Mayor complejidad operacional vs Supabase (requiere Docker, deployment propio).

### ADR-003: OpenRouter como gateway de IA

**Contexto**: El MVP usa Claude API directamente + OpenRouter para Gemini.

**Decision**: Unificar todo el acceso a LLMs via OpenRouter.

**Razones**:
- Un solo punto de integracion para multiples modelos
- Fallback automatico entre modelos
- Mejor control de costos (un solo dashboard)
- Flexibilidad para cambiar modelos sin cambiar codigo
- Rate limiting unificado

**Riesgo**: Dependencia de un intermediario. Mitigacion: abstraer el client para poder usar APIs directas como fallback.

### ADR-004: PostgreSQL managed vs Supabase

**Contexto**: El MVP usa Supabase PostgreSQL. La nueva arquitectura puede usar cualquier PostgreSQL.

**Decision**: Mantener Supabase PostgreSQL en fases iniciales, migrar a managed PostgreSQL (Cloud SQL o RDS) cuando se necesite.

**Razones**:
- Supabase PostgreSQL ya tiene el schema y datos
- Menor friccion en migracion
- Supabase ofrece connection pooling (Supavisor) incluido
- Migrar a Cloud SQL/RDS cuando se necesiten features enterprise (read replicas, failover)

### ADR-005: Redis para cache y colas

**Contexto**: Se necesita procesamiento asincrono para analisis IA y cache para reducir costos.

**Decision**: Redis como cache + cola de tareas.

**Razones**:
- Ligero, rapido, bien soportado
- `rq` (Redis Queue) es simple y suficiente para el volumen esperado
- Cache de respuestas IA reduce costos significativamente
- Pub/sub para notificaciones en tiempo real

**Alternativa descartada**: Celery (demasiado complejo para el volumen actual), RabbitMQ (innecesario).
