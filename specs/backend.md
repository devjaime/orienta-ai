# Vocari - Especificacion de Backend

> Version: 2.0 | Fecha: Marzo 2026
> Stack: Python 3.12+ | FastAPI | SQLAlchemy 2.0 | Pydantic v2 | PostgreSQL | Redis

---

## 1. Estructura del Proyecto Backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory
│   ├── config.py                  # Settings via pydantic-settings
│   ├── dependencies.py            # Dependency injection (DB, Redis, Auth)
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── router.py              # /auth/* endpoints
│   │   ├── service.py             # Google OAuth, JWT, session management
│   │   ├── models.py              # User, UserProfile SQLAlchemy models
│   │   ├── schemas.py             # Pydantic request/response schemas
│   │   ├── middleware.py          # Auth middleware, role checker
│   │   └── permissions.py         # RBAC decorators
│   │
│   ├── institutions/
│   │   ├── __init__.py
│   │   ├── router.py              # /institutions/* endpoints
│   │   ├── service.py             # Multi-tenant business logic
│   │   ├── models.py              # Institution, InstitutionConfig
│   │   └── schemas.py
│   │
│   ├── sessions/
│   │   ├── __init__.py
│   │   ├── router.py              # /sessions/* endpoints
│   │   ├── service.py             # Session lifecycle management
│   │   ├── models.py              # Session, SessionRecording, SessionTranscript
│   │   ├── schemas.py
│   │   └── google_meet.py         # Google Meet/Calendar/Drive integration
│   │
│   ├── tests_vocational/          # "tests" es reservado en Python
│   │   ├── __init__.py
│   │   ├── router.py              # /tests/* endpoints
│   │   ├── service.py             # RIASEC scoring, adaptive questionnaires
│   │   ├── models.py              # TestResult, AdaptiveQuestionnaire
│   │   ├── schemas.py
│   │   └── riasec.py              # Algoritmo RIASEC (migrado de JS)
│   │
│   ├── games/
│   │   ├── __init__.py
│   │   ├── router.py              # /games/* endpoints
│   │   ├── service.py             # Game management, result processing
│   │   ├── models.py              # Game, GameResult
│   │   └── schemas.py
│   │
│   ├── careers/
│   │   ├── __init__.py
│   │   ├── router.py              # /careers/* endpoints
│   │   ├── service.py             # Career matching, MINEDUC data
│   │   ├── models.py              # Career, University, LaborData
│   │   ├── schemas.py
│   │   └── recommendation.py      # Motor de recomendacion
│   │
│   ├── profiles/
│   │   ├── __init__.py
│   │   ├── router.py              # /profiles/* endpoints
│   │   ├── service.py             # Longitudinal profile management
│   │   ├── models.py              # StudentLongitudinalProfile
│   │   └── schemas.py
│   │
│   ├── reports/
│   │   ├── __init__.py
│   │   ├── router.py              # /reports/* endpoints
│   │   ├── service.py             # Report generation orchestration
│   │   ├── models.py              # Report, ReportTemplate
│   │   └── schemas.py
│   │
│   ├── dashboards/
│   │   ├── __init__.py
│   │   ├── router.py              # /dashboards/* endpoints
│   │   └── service.py             # Aggregated data for each role
│   │
│   ├── notifications/
│   │   ├── __init__.py
│   │   ├── router.py              # /notifications/* endpoints
│   │   ├── service.py             # Notification dispatch
│   │   └── models.py
│   │
│   ├── ai_engine/
│   │   ├── __init__.py
│   │   ├── router.py              # /ai/* internal endpoints
│   │   ├── service.py             # Orchestration of AI tasks
│   │   ├── openrouter_client.py   # OpenRouter API client
│   │   ├── prompts.py             # Prompt templates
│   │   ├── pipelines.py           # Analysis pipelines
│   │   └── workers.py             # Async workers (rq jobs)
│   │
│   ├── consent/
│   │   ├── __init__.py
│   │   ├── router.py              # /consent/* endpoints
│   │   ├── service.py             # Consent management
│   │   └── models.py              # ConsentRecord
│   │
│   ├── audit/
│   │   ├── __init__.py
│   │   ├── router.py              # /audit/* endpoints
│   │   ├── service.py
│   │   └── models.py              # AuditLog
│   │
│   └── common/
│       ├── __init__.py
│       ├── database.py            # SQLAlchemy engine, session factory
│       ├── redis.py               # Redis connection
│       ├── storage.py             # Object storage (S3/GCS) client
│       ├── exceptions.py          # Custom exceptions
│       ├── pagination.py          # Pagination utilities
│       └── tenant.py              # Multi-tenant filter utilities
│
├── migrations/
│   └── alembic/                   # Alembic migrations
│       ├── env.py
│       └── versions/
│
├── workers/
│   ├── __init__.py
│   └── worker.py                  # rq worker entrypoint
│
├── tests/
│   ├── conftest.py
│   ├── test_auth/
│   ├── test_sessions/
│   ├── test_ai_engine/
│   ├── test_careers/
│   └── ...
│
├── scripts/
│   ├── seed_careers.py            # Cargar datos MINEDUC
│   └── migrate_from_supabase.py   # Script de migracion
│
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml                 # Poetry/uv project config
├── alembic.ini
└── .env.example
```

---

## 2. API Specification

### 2.1 Auth Module

```yaml
# POST /api/v1/auth/google
# Inicia flujo OAuth con Google
Request: {}
Response:
  redirect_url: string  # URL de autorizacion de Google

# GET /api/v1/auth/callback?code=...&state=...
# Callback de Google OAuth
Response:
  access_token: string
  refresh_token: string  # en httpOnly cookie
  user:
    id: uuid
    email: string
    name: string
    role: enum[estudiante, apoderado, orientador, admin_colegio, super_admin]
    institution_id: uuid | null
    profile_complete: boolean

# POST /api/v1/auth/refresh
# Renueva access token
Request: {}  # refresh_token en cookie
Response:
  access_token: string

# GET /api/v1/auth/me
# Perfil del usuario autenticado
Response:
  id: uuid
  email: string
  name: string
  avatar_url: string
  role: string
  institution: { id: uuid, name: string } | null
  permissions: string[]
  consent_status: { recording: bool, ai_processing: bool, data_storage: bool }
```

### 2.2 Sessions Module

```yaml
# GET /api/v1/sessions
# Listar sesiones del usuario (filtradas por rol)
Query: ?status=scheduled|completed|cancelled&page=1&per_page=20
Response:
  items: Session[]
  total: int
  page: int

# POST /api/v1/sessions
# Agendar nueva sesion
# Roles: estudiante
Request:
  orientador_id: uuid
  preferred_datetime: datetime
  duration_minutes: 30  # fijo
  notes: string | null
Response:
  session: Session
  google_meet_link: string
  calendar_event_id: string

# GET /api/v1/sessions/{id}
# Detalle de una sesion
# Roles: participantes de la sesion, admin
Response:
  session: Session
  recording: SessionRecording | null
  transcript: SessionTranscript | null
  ai_analysis: SessionAIAnalysis | null
  notes: SessionNote[]

# POST /api/v1/sessions/{id}/complete
# Marcar sesion como completada (trigger analisis IA)
# Roles: orientador
Request: {}
Response:
  status: "processing"
  job_id: string  # para tracking del analisis asincrono

# GET /api/v1/sessions/{id}/transcript
# Obtener transcripcion de la sesion
# Roles: orientador, admin
Response:
  transcript_text: string
  segments: [{ speaker: string, text: string, timestamp: float }]
  source: "google_meet_auto" | "manual"

# GET /api/v1/sessions/{id}/analysis
# Obtener analisis IA de la sesion
# Roles: orientador, admin
Response:
  summary: string
  interests_detected: [{ interest: string, confidence: float, evidence: string }]
  skills_detected: [{ skill: string, confidence: float, evidence: string }]
  emotional_sentiment:
    overall: enum[positive, neutral, negative, mixed]
    score: float  # -1.0 to 1.0
    moments: [{ timestamp: float, sentiment: string, trigger: string }]
  suggested_tests: [{ test_type: string, reason: string, priority: string }]
  suggested_games: [{ game_id: uuid, reason: string }]
```

### 2.3 Tests Module

```yaml
# GET /api/v1/tests/riasec
# Obtener preguntas del test RIASEC
Response:
  questions: [{ id: int, text: string, dimension: string, options: [...] }]
  total_questions: 36

# POST /api/v1/tests/riasec/submit
# Enviar respuestas del test RIASEC
# Roles: estudiante
Request:
  answers: [{ question_id: int, value: int }]  # Likert 1-5
Response:
  result:
    code: string  # ej: "RIA"
    scores: { R: float, I: float, A: float, S: float, E: float, C: float }
    certainty: float
    primary: string
    secondary: string
    tertiary: string
  career_matches: Career[]  # top 10

# GET /api/v1/tests/adaptive/{session_id}
# Obtener cuestionario adaptativo post-sesion
# Roles: estudiante
Response:
  questionnaire_id: uuid
  first_question:
    id: uuid
    text: string
    type: enum[likert, multiple_choice, open_text]
    options: [...] | null

# POST /api/v1/tests/adaptive/{questionnaire_id}/answer
# Enviar respuesta a pregunta adaptativa
# Roles: estudiante
Request:
  question_id: uuid
  answer: string | int
Response:
  next_question: Question | null  # null si es la ultima
  progress: float  # 0.0 - 1.0
  is_complete: boolean
  result: AdaptiveQuestionnaireResult | null  # solo si is_complete

# GET /api/v1/tests/history
# Historial de tests del estudiante
# Roles: estudiante, orientador (su estudiante), apoderado (su hijo)
Response:
  items: TestResult[]
```

### 2.4 Games Module

```yaml
# GET /api/v1/games
# Catalogo de juegos disponibles
Response:
  games: [{
    id: uuid
    name: string
    description: string
    skills_evaluated: string[]
    duration_minutes: int
    difficulty: enum[easy, medium, hard]
    thumbnail_url: string
  }]

# POST /api/v1/games/{game_id}/start
# Iniciar sesion de juego
# Roles: estudiante
Response:
  game_session_id: uuid
  config: {}  # configuracion adaptada al perfil del estudiante

# POST /api/v1/games/{game_session_id}/submit
# Enviar resultados del juego
# Roles: estudiante
Request:
  metrics:
    completion_time: float
    score: int
    decisions: [{ timestamp: float, choice: string, context: string }]
    reaction_times: float[]
    strategy_changes: int
    persistence_score: float
Response:
  result:
    skills_evaluated: [{ skill: string, score: float, percentile: float }]
    insights: string[]
    badge_earned: string | null
```

### 2.5 Careers Module

```yaml
# GET /api/v1/careers
# Catalogo de carreras
Query: ?search=...&area=...&holland_code=...&page=1
Response:
  items: Career[]
  total: int

# GET /api/v1/careers/{id}
# Detalle de carrera
Response:
  career:
    id: uuid
    name: string
    area: string
    holland_codes: string[]
    description: string
    salary_range: { min: int, max: int, median: int, currency: "CLP" }
    employability: float
    saturation_index: float
    universities: University[]
    mineduc_data:
      matricula_trend: [{ year: int, count: int }]
      titulados_trend: [{ year: int, count: int }]
      projected_demand: float

# GET /api/v1/careers/recommendations
# Recomendaciones personalizadas para el estudiante
# Roles: estudiante
Response:
  recommendations: [{
    career: Career
    compatibility_score: float
    match_reasons: string[]
    risk_factors: string[]
  }]
  profile_used:
    riasec_code: string
    interests: string[]
    skills: string[]

# POST /api/v1/careers/{id}/simulate
# Simulacion de carrera futura
# Roles: estudiante
Response:
  simulation:
    career: string
    timeline: [{
      year: int
      milestone: string
      salary_estimate: int
      description: string
    }]
    probability_of_success: float
    alternative_paths: string[]
    ai_narrative: string
```

### 2.6 Profiles Module (Perfil Longitudinal)

```yaml
# GET /api/v1/profiles/me
# Perfil longitudinal del estudiante autenticado
# Roles: estudiante
Response:
  profile:
    student_id: uuid
    riasec_history: [{ date: datetime, code: string, scores: {} }]
    skills:
      confirmed: [{ skill: string, confidence: float, sources: string[] }]
      emerging: [{ skill: string, confidence: float, first_detected: datetime }]
    interests:
      stable: [{ interest: string, consistency: float }]
      evolving: [{ interest: string, trend: "growing" | "declining" }]
    learning_patterns:
      preferred_style: string
      engagement_peaks: string[]  # ej: "visual", "interactive"
      attention_span: string
    happiness_indicators:
      current: float  # 0.0 - 1.0
      trend: "improving" | "stable" | "declining"
      history: [{ date: datetime, score: float, context: string }]
    career_recommendations:
      current_top3: Career[]
      evolution: [{ date: datetime, top3: string[] }]
    sessions_count: int
    tests_completed: int
    games_played: int
    last_activity: datetime

# GET /api/v1/profiles/{student_id}
# Perfil de un estudiante especifico
# Roles: orientador (asignado), apoderado (vinculado), admin
Response: # mismo schema que /me
```

### 2.7 Dashboards Module

```yaml
# GET /api/v1/dashboards/student
# Dashboard del estudiante
Response:
  upcoming_sessions: Session[]
  pending_tests: Test[]
  recent_results: TestResult[]
  profile_summary: ProfileSummary
  recommended_careers: Career[]
  recent_games: GameResult[]
  notifications: Notification[]

# GET /api/v1/dashboards/orientador
# Dashboard del orientador
Response:
  upcoming_sessions: Session[]
  students_assigned: int
  recent_analyses: SessionAIAnalysis[]
  workload_stats: { this_week: int, this_month: int, capacity: int }
  pending_reviews: int  # analisis IA pendientes de revision
  alerts: [{ student_id: uuid, type: string, message: string }]

# GET /api/v1/dashboards/parent
# Dashboard del apoderado
Response:
  children: [{
    student: User
    profile_summary: ProfileSummary
    recent_sessions: Session[]
    recent_tests: TestResult[]
    happiness_indicator: float
    upcoming_sessions: Session[]
  }]

# GET /api/v1/dashboards/admin
# Dashboard del admin de colegio
Response:
  institution_stats:
    total_students: int
    active_students: int
    sessions_this_month: int
    tests_completed_this_month: int
    average_engagement: float
  orientador_stats: [{
    orientador: User
    students_assigned: int
    sessions_completed: int
    workload_percentage: float
  }]
  top_careers: Career[]  # mas recomendadas en la institucion
  engagement_trend: [{ week: string, active_students: int }]
```

### 2.8 Consent Module

```yaml
# GET /api/v1/consent/status
# Estado de consentimiento del usuario
Response:
  recording_consent: bool
  ai_processing_consent: bool
  data_storage_consent: bool
  parental_consent: bool | null  # null si no es menor
  consent_date: datetime | null
  consent_method: "digital" | "physical" | null

# POST /api/v1/consent/grant
# Otorgar consentimiento
# Roles: apoderado (para su hijo), estudiante mayor de edad
Request:
  consent_type: enum[recording, ai_processing, data_storage, all]
  student_id: uuid | null  # si es apoderado otorgando para hijo
Response:
  status: "granted"
  consent_record_id: uuid

# POST /api/v1/consent/revoke
# Revocar consentimiento
Request:
  consent_type: enum[recording, ai_processing, data_storage, all]
  student_id: uuid | null
Response:
  status: "revoked"
  data_deletion_scheduled: bool  # si revoca data_storage
```

---

## 3. Microservice Boundaries Decision

### Decision: Monolito Modular (no microservicios)

Para el volumen esperado (hasta 5,000 estudiantes), un monolito modular FastAPI es la decision correcta:

```
+-------------------------------------------------------+
|                  FastAPI Application                   |
|                                                       |
|  +----------+  +----------+  +----------+             |
|  |   Auth   |  | Sessions |  |  Tests   |             |
|  |  Module   |  |  Module  |  |  Module  |             |
|  +----------+  +----------+  +----------+             |
|                                                       |
|  +----------+  +----------+  +----------+             |
|  |  Games   |  | Careers  |  | Profiles |             |
|  |  Module   |  |  Module  |  |  Module  |             |
|  +----------+  +----------+  +----------+             |
|                                                       |
|  +----------+  +----------+  +----------+             |
|  |   AI     |  | Reports  |  | Consent  |             |
|  |  Engine   |  |  Module  |  |  Module  |             |
|  +----------+  +----------+  +----------+             |
|                                                       |
|  Shared: Database, Redis, Storage, Auth Middleware     |
+-------------------------------------------------------+
         |              |              |
    PostgreSQL        Redis      Object Storage
```

**Razon**:
- Un equipo pequeno (2-4 devs) no se beneficia de microservicios
- La latencia intra-proceso es orden de magnitud mejor que HTTP entre servicios
- Un solo deployment simplifica operaciones
- Los modulos estan bien separados y pueden extraerse a servicios si se necesita

**Excepcion**: Los workers de IA (rq jobs) corren como procesos separados pero comparten el mismo codebase.

### Cuando extraer un servicio

| Senal | Accion |
|-------|--------|
| Workers IA saturan CPU y afectan API | Extraer AI Engine a servicio separado |
| > 10,000 estudiantes | Evaluar separation de read/write paths |
| Equipo > 8 personas | Evaluar domain boundaries para equipos |
| Latencia de Google APIs afecta respuestas | Extraer Google integration a servicio async |

---

## 4. Base de Datos - Schema Detallado

### 4.1 Migraciones (Alembic)

Todas las migraciones se gestionan con Alembic. La base inicial se construye desde el schema existente de Supabase.

### 4.2 Modelos SQLAlchemy Core

```python
# Esquema conceptual - NO es codigo ejecutable, es especificacion

class Institution:
    id: UUID (PK)
    name: str
    slug: str (unique)
    domain: str | None  # dominio Google Workspace
    google_workspace_config: JSON  # service account credentials ref
    plan: enum[free, basic, premium]
    max_students: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

class User:
    id: UUID (PK)
    email: str (unique)
    google_id: str (unique)
    name: str
    avatar_url: str | None
    role: enum[estudiante, apoderado, orientador, admin_colegio, super_admin]
    institution_id: UUID (FK -> Institution) | None
    is_active: bool
    last_login: datetime
    created_at: datetime

class UserProfile:
    id: UUID (PK)
    user_id: UUID (FK -> User, unique)
    birth_date: date | None
    grade: str | None  # ej: "4to Medio"
    phone: str | None
    additional_info: JSON

class ConsentRecord:
    id: UUID (PK)
    student_id: UUID (FK -> User)
    granted_by: UUID (FK -> User)  # apoderado o el mismo estudiante
    consent_type: enum[recording, ai_processing, data_storage]
    granted: bool
    granted_at: datetime
    revoked_at: datetime | None
    ip_address: str
    method: enum[digital, physical]

class Session:
    id: UUID (PK)
    institution_id: UUID (FK -> Institution)
    student_id: UUID (FK -> User)
    orientador_id: UUID (FK -> User)
    scheduled_at: datetime
    duration_minutes: int (default 30)
    status: enum[scheduled, in_progress, completed, cancelled, no_show]
    google_calendar_event_id: str | None
    google_meet_link: str | None
    notes_by_student: str | None
    completed_at: datetime | None
    created_at: datetime

class SessionRecording:
    id: UUID (PK)
    session_id: UUID (FK -> Session, unique)
    google_drive_file_id: str
    duration_seconds: int
    file_size_bytes: int
    storage_url: str | None  # si se descarga a object storage propio
    status: enum[available, downloading, downloaded, deleted]
    created_at: datetime

class SessionTranscript:
    id: UUID (PK)
    session_id: UUID (FK -> Session, unique)
    google_docs_id: str | None
    full_text: text
    segments: JSON  # [{ speaker, text, start_time, end_time }]
    language: str (default "es")
    word_count: int
    source: enum[google_meet_auto, manual, whisper]
    created_at: datetime

class SessionAIAnalysis:
    id: UUID (PK)
    session_id: UUID (FK -> Session, unique)
    summary: text
    interests_detected: JSON  # [{ interest, confidence, evidence }]
    skills_detected: JSON  # [{ skill, confidence, evidence }]
    emotional_sentiment: JSON  # { overall, score, moments[] }
    suggested_tests: JSON  # [{ test_type, reason, priority }]
    suggested_games: JSON  # [{ game_id, reason }]
    model_used: str  # ej: "anthropic/claude-3.5-sonnet"
    tokens_used: int
    processing_time_seconds: float
    reviewed_by_orientador: bool (default false)
    orientador_edits: JSON | None
    created_at: datetime

class TestResult:
    id: UUID (PK)
    user_id: UUID (FK -> User)
    institution_id: UUID (FK -> Institution)
    test_type: str  # "riasec", "adaptive_post_session"
    answers: JSON
    scores: JSON
    result_code: str | None  # ej: "RIA" para RIASEC
    certainty: float | None
    metadata: JSON
    created_at: datetime

class AdaptiveQuestionnaire:
    id: UUID (PK)
    session_id: UUID (FK -> Session)
    student_id: UUID (FK -> User)
    questions: JSON  # preguntas generadas
    answers: JSON  # respuestas del estudiante
    evaluation: JSON  # evaluacion IA
    status: enum[pending, in_progress, completed, expired]
    created_at: datetime
    completed_at: datetime | None

class Game:
    id: UUID (PK)
    name: str
    slug: str (unique)
    description: str
    skills_evaluated: JSON  # ["logica", "creatividad", ...]
    duration_minutes: int
    difficulty: enum[easy, medium, hard]
    config: JSON  # configuracion del juego
    is_active: bool
    created_at: datetime

class GameResult:
    id: UUID (PK)
    game_id: UUID (FK -> Game)
    student_id: UUID (FK -> User)
    institution_id: UUID (FK -> Institution)
    metrics: JSON  # metricas del juego
    skills_scores: JSON  # [{ skill, score, percentile }]
    duration_seconds: int
    created_at: datetime

class StudentLongitudinalProfile:
    id: UUID (PK)
    student_id: UUID (FK -> User, unique)
    institution_id: UUID (FK -> Institution)
    skills: JSON  # { confirmed: [], emerging: [] }
    interests: JSON  # { stable: [], evolving: [] }
    learning_patterns: JSON
    happiness_indicators: JSON  # { current, trend, history[] }
    career_recommendations: JSON
    riasec_history: JSON  # [{ date, code, scores }]
    data_sources: JSON  # tracking de que alimenta el perfil
    last_updated: datetime
    created_at: datetime

class CareerSimulation:
    id: UUID (PK)
    student_id: UUID (FK -> User)
    career_id: UUID (FK -> Career)
    simulation_data: JSON  # timeline, milestones, salary projections
    ai_narrative: text
    model_used: str
    created_at: datetime

class ParentStudentLink:
    id: UUID (PK)
    parent_id: UUID (FK -> User)
    student_id: UUID (FK -> User)
    verified: bool
    created_at: datetime

class AuditLog:
    id: UUID (PK)
    user_id: UUID (FK -> User)
    institution_id: UUID (FK -> Institution) | None
    action: str
    resource_type: str
    resource_id: UUID | None
    details: JSON
    ip_address: str
    created_at: datetime
```

---

## 5. Middleware Stack

```python
# Orden de ejecucion (de afuera hacia adentro):

1. CORSMiddleware          # Permitir origenes del frontend
2. TrustedHostMiddleware   # Validar Host header
3. RateLimitMiddleware     # Rate limiting por IP y por usuario
4. RequestIdMiddleware     # Inyectar request_id para tracing
5. AuthenticationMiddleware  # Verificar JWT, extraer user
6. TenantMiddleware        # Inyectar institution_id en contexto
7. AuditMiddleware         # Log de acciones (para endpoints sensibles)
```

---

## 6. Background Workers

### 6.1 Worker de Analisis de Transcripciones

```
Job: transcript_analysis_job
Trigger: POST /sessions/{id}/complete
Queue: "ai_analysis" (high priority)

Steps:
  1. Recuperar transcripcion de Google Drive/Docs
  2. Guardar transcripcion en BD
  3. Enviar a OpenRouter para analisis:
     a. Resumen (1 llamada)
     b. Deteccion de intereses (1 llamada)
     c. Deteccion de habilidades (1 llamada)
     d. Analisis de sentimiento (1 llamada)
     e. Sugerencia de tests/juegos (1 llamada)
  4. Guardar resultados en session_ai_analysis
  5. Actualizar perfil longitudinal del estudiante
  6. Notificar orientador que el analisis esta listo
  7. Generar cuestionario adaptativo si aplica

Timeout: 5 minutos
Retries: 3 (con backoff exponencial)
```

### 6.2 Worker de Generacion de Reportes

```
Job: generate_report_job
Trigger: POST /reports/generate
Queue: "reports" (low priority)

Steps:
  1. Recopilar todos los datos del estudiante
  2. Generar narrativa con IA
  3. Renderizar PDF
  4. Subir a Object Storage
  5. Actualizar registro en BD
  6. Notificar que el reporte esta listo

Timeout: 10 minutos
Retries: 2
```

### 6.3 Worker de Actualizacion de Perfil

```
Job: update_longitudinal_profile_job
Trigger: Despues de cualquier nuevo dato (test, sesion, juego)
Queue: "profiles" (medium priority)

Steps:
  1. Leer datos actuales del perfil
  2. Incorporar nuevo dato
  3. Recalcular scores consolidados
  4. Detectar cambios significativos
  5. Actualizar perfil en BD
  6. Si cambio significativo: generar alerta para orientador

Timeout: 2 minutos
Retries: 3
```

---

## 7. Error Handling

```python
# Jerarquia de excepciones

VocariException (base)
├── AuthenticationError (401)
│   ├── TokenExpiredError
│   └── InvalidCredentialsError
├── AuthorizationError (403)
│   ├── InsufficientRoleError
│   └── CrossTenantAccessError
├── NotFoundError (404)
│   ├── UserNotFoundError
│   ├── SessionNotFoundError
│   └── CareerNotFoundError
├── ValidationError (422)
│   ├── ConsentRequiredError
│   └── InvalidScheduleError
├── ConflictError (409)
│   ├── DuplicateSessionError
│   └── AlreadyCompletedError
├── ExternalServiceError (502)
│   ├── GoogleAPIError
│   ├── OpenRouterError
│   └── StorageError
└── RateLimitError (429)

# Respuesta estandar de error
{
  "error": {
    "code": "CONSENT_REQUIRED",
    "message": "Se requiere consentimiento parental para grabar la sesion",
    "details": { "consent_types_needed": ["recording", "ai_processing"] }
  },
  "request_id": "req_abc123"
}
```

---

## 8. Testing Strategy

```
Tipo              | Cobertura Target | Herramienta
------------------|------------------|------------
Unit tests        | 80%              | pytest
Integration tests | Core flows       | pytest + testcontainers (PostgreSQL, Redis)
API tests         | Todos endpoints  | pytest + httpx (TestClient)
E2E tests         | Happy paths      | (frontend-driven, ver frontend spec)

Tests criticos:
  - Multi-tenancy: verificar que NINGUN endpoint filtra datos cross-institution
  - Auth: verificar todos los roles en todos los endpoints
  - AI pipeline: verificar manejo de errores cuando OpenRouter falla
  - Consent: verificar que operaciones bloqueadas sin consentimiento
  - Google API: mock tests para Calendar, Drive, Docs, Meet
```

---

## 9. Dependencias Python

```toml
# pyproject.toml (especificacion, no instalacion)

[dependencies]
fastapi = ">=0.115"
uvicorn = { version = ">=0.34", extras = ["standard"] }
pydantic = ">=2.10"
pydantic-settings = ">=2.7"
sqlalchemy = { version = ">=2.0", extras = ["asyncio"] }
asyncpg = ">=0.30"          # PostgreSQL async driver
alembic = ">=1.14"
redis = ">=5.2"
rq = ">=1.16"               # Redis Queue
httpx = ">=0.28"             # HTTP client (for OpenRouter, Google APIs)
python-jose = ">=3.3"       # JWT
google-auth = ">=2.37"
google-api-python-client = ">=2.159"
google-auth-oauthlib = ">=1.2"
boto3 = ">=1.36"             # S3-compatible storage
python-multipart = ">=0.0.18"
jinja2 = ">=3.1"             # templates para emails
weasyprint = ">=63"          # PDF generation

[dev-dependencies]
pytest = ">=8.3"
pytest-asyncio = ">=0.25"
httpx = ">=0.28"             # TestClient
testcontainers = ">=4.9"
factory-boy = ">=3.3"
faker = ">=33"
ruff = ">=0.9"               # linting
mypy = ">=1.14"
```
