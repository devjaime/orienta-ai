# Vocari - Especificacion de Infraestructura

> Version: 2.0 | Fecha: Marzo 2026
> Tipo de cambio referencia: 1 USD = 950 CLP (Marzo 2026)

---

## 1. Arquitectura de Infraestructura

```
                          Internet
                             |
                    +--------v--------+
                    |   Cloudflare    |
                    |   CDN + WAF     |
                    |   DNS + SSL     |
                    +--------+--------+
                             |
                    +--------v--------+
                    |   Load Balancer |
                    |   (Cloud LB)    |
                    +---+----+----+---+
                        |    |    |
              +---------+  +-+--+ +--------+
              |            |    |          |
     +--------v---+  +----v----v-+  +-----v------+
     | Next.js    |  | FastAPI   |  | RQ Workers |
     | Container  |  | Container |  | Container  |
     | (Frontend) |  | (Backend) |  | (AI Jobs)  |
     +------------+  +-----------+  +------------+
                          |    |         |
                     +----v----v-+  +----v----+
                     | PostgreSQL|  |  Redis   |
                     | (Managed) |  | (Managed)|
                     +-----------+  +----------+

     External:
     +------------------+  +------------------+  +------------------+
     | Google Workspace |  | OpenRouter API   |  | Object Storage   |
     | APIs             |  |                  |  | (S3/GCS)         |
     +------------------+  +------------------+  +------------------+
```

---

## 2. Componentes de Infraestructura

### 2.1 Contenedores Docker

```yaml
# docker-compose.yml (desarrollo y referencia)

services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/vocari
      - REDIS_URL=redis://redis:6379/0
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - GOOGLE_SERVICE_ACCOUNT_KEY=${GOOGLE_SERVICE_ACCOUNT_KEY}
    depends_on: [postgres, redis]

  worker:
    build: ./backend
    command: rq worker ai_analysis reports profiles
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/vocari
      - REDIS_URL=redis://redis:6379/0
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    depends_on: [postgres, redis]

  postgres:
    image: postgres:17
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      - POSTGRES_DB=vocari
      - POSTGRES_USER=vocari
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes: ["redisdata:/data"]

volumes:
  pgdata:
  redisdata:
```

### 2.2 Dockerfiles

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# frontend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/package.json .
RUN npm ci --production
CMD ["npm", "start"]
```

---

## 3. Opciones de Cloud Provider

### 3.1 Opcion A: Google Cloud Platform (Recomendada)

**Razon**: Integracion nativa con Google Workspace APIs, baja latencia para servicios Google, presencia en LATAM (Santiago region disponible).

```
Componente              | Servicio GCP           | Especificacion
------------------------|------------------------|------------------
Contenedores            | Cloud Run              | Auto-scaling, pay-per-use
PostgreSQL              | Cloud SQL              | PostgreSQL 17, SSD
Redis                   | Memorystore            | Redis 7
Object Storage          | Cloud Storage          | Standard class
CDN                     | Cloudflare (externo)   | Free/Pro plan
DNS                     | Cloudflare (externo)   | Free
SSL                     | Cloudflare (externo)   | Free
Container Registry      | Artifact Registry      | Docker images
CI/CD                   | Cloud Build            | O GitHub Actions
Monitoring              | Cloud Monitoring       | Metricas basicas gratis
Logging                 | Cloud Logging          | Log routing
Secrets                 | Secret Manager         | API keys, credentials
```

### 3.2 Opcion B: DigitalOcean (Alternativa economica)

```
Componente              | Servicio DO            | Especificacion
------------------------|------------------------|------------------
Contenedores            | App Platform           | Auto-scaling
PostgreSQL              | Managed Database       | PostgreSQL 17
Redis                   | Managed Database       | Redis 7
Object Storage          | Spaces                 | S3-compatible
CDN                     | Spaces CDN             | Incluido
```

### 3.3 Opcion C: Fly.io + Supabase (Minimalista)

```
Componente              | Servicio               | Especificacion
------------------------|------------------------|------------------
Contenedores            | Fly.io Machines        | Auto-scaling por region
PostgreSQL              | Supabase (mantener)    | Migrar cuando sea necesario
Redis                   | Upstash                | Serverless Redis
Object Storage          | Supabase Storage       | Mantener existente
```

---

## 4. Estimacion de Costos por Etapa

### 4.1 Etapa 1: MVP/Piloto (10-50 estudiantes)

#### Opcion GCP (Recomendada)

| Componente | Servicio | Especificacion | Costo USD/mes | Costo CLP/mes |
|-----------|---------|----------------|---------------|---------------|
| Backend + Workers | Cloud Run | 2 servicios, min 0 instances | $5-15 | $4,750-14,250 |
| Frontend | Cloud Run | 1 servicio, min 0 instances | $3-8 | $2,850-7,600 |
| PostgreSQL | Cloud SQL | db-f1-micro, 10GB SSD | $10 | $9,500 |
| Redis | Memorystore | Basic, 1GB | $30 | $28,500 |
| Object Storage | Cloud Storage | < 5GB | $1 | $950 |
| Google Workspace | Business Starter | 3 usuarios | $18 | $17,100 |
| OpenRouter (IA) | Pay-per-use | ~50 estudiantes x $0.42 | $21 | $19,950 |
| Cloudflare | Free plan | CDN + DNS + SSL | $0 | $0 |
| Domain | vocari.cl | Anual prorrateado | $2 | $1,900 |
| **TOTAL** | | | **$90-105** | **$85,500-99,750** |

**Nota**: Cloud Run con min 0 instances = costo casi cero cuando no hay trafico (noches, fines de semana). Redis Memorystore es el componente mas caro a esta escala; alternativa Upstash ($0-10/mes).

#### Opcion Economica (Fly.io + Supabase)

| Componente | Servicio | Costo USD/mes | Costo CLP/mes |
|-----------|---------|---------------|---------------|
| Backend + Workers | Fly.io | $5-10 | $4,750-9,500 |
| Frontend | Vercel (free) | $0 | $0 |
| PostgreSQL | Supabase (free) | $0 | $0 |
| Redis | Upstash (free) | $0 | $0 |
| Storage | Supabase Storage (free) | $0 | $0 |
| Google Workspace | Business Starter | $18 | $17,100 |
| OpenRouter | Pay-per-use | $21 | $19,950 |
| Cloudflare | Free | $0 | $0 |
| **TOTAL** | | **$44-49** | **$41,800-46,550** |

### 4.2 Etapa 2: Crecimiento (100-500 estudiantes, 1-5 colegios)

#### Opcion GCP

| Componente | Servicio | Especificacion | Costo USD/mes | Costo CLP/mes |
|-----------|---------|----------------|---------------|---------------|
| Backend | Cloud Run | min 1 instance, 1 vCPU, 512MB | $25-40 | $23,750-38,000 |
| Workers | Cloud Run | min 1 instance, 2 vCPU, 1GB | $30-50 | $28,500-47,500 |
| Frontend | Cloud Run | min 1 instance | $15-25 | $14,250-23,750 |
| PostgreSQL | Cloud SQL | db-g1-small, 50GB SSD | $35 | $33,250 |
| Redis | Memorystore | Basic, 1GB | $30 | $28,500 |
| Object Storage | Cloud Storage | ~50GB | $5 | $4,750 |
| Google Workspace | Business Starter | 5 usuarios | $30 | $28,500 |
| OpenRouter (IA) | Pay-per-use | 500 est x $0.42 | $210 | $199,500 |
| Cloudflare | Pro | WAF + analytics | $20 | $19,000 |
| Monitoring | Sentry | Team plan | $26 | $24,700 |
| **TOTAL** | | | **$426-471** | **$404,700-447,450** |

### 4.3 Etapa 3: Escala (1,000-5,000 estudiantes, 10-50 colegios)

#### Opcion GCP

| Componente | Servicio | Especificacion | Costo USD/mes | Costo CLP/mes |
|-----------|---------|----------------|---------------|---------------|
| Backend | Cloud Run | min 2 instances, 2 vCPU, 1GB | $80-120 | $76,000-114,000 |
| Workers | Cloud Run | min 2 instances, 4 vCPU, 2GB | $120-180 | $114,000-171,000 |
| Frontend | Cloud Run | min 2 instances | $40-60 | $38,000-57,000 |
| PostgreSQL | Cloud SQL | db-custom-2-7680, 200GB SSD, HA | $150-200 | $142,500-190,000 |
| Redis | Memorystore | Standard, 2GB, HA | $80 | $76,000 |
| Object Storage | Cloud Storage | ~500GB | $15 | $14,250 |
| Google Workspace | Business Starter | 10 usuarios | $60 | $57,000 |
| OpenRouter (IA) | Pay-per-use | 5,000 est x $0.42 | $2,100 | $1,995,000 |
| Cloudflare | Pro | WAF + analytics | $20 | $19,000 |
| Monitoring | Sentry + Datadog | Business | $100 | $95,000 |
| Backup | Cloud Storage | Daily snapshots | $20 | $19,000 |
| **TOTAL** | | | **$2,785-2,955** | **$2,645,750-2,807,250** |

---

## 5. Comparacion de Costos: Nuevo Stack vs Actual

| Etapa | Estudiantes | Costo Actual (Supabase+Netlify) | Costo Nuevo (GCP) | Diferencia |
|-------|------------|--------------------------------|-------------------|-----------|
| MVP | 50 | ~$540/mes | ~$100/mes | **-81%** |
| Crecimiento | 500 | ~$4,380/mes | ~$450/mes | **-90%** |
| Escala | 5,000 | ~$42,750/mes | ~$2,900/mes | **-93%** |

**La reduccion masiva viene de**:
1. IA optimizada: $8.50/est -> $0.42/est (model tiering + cache + structured pipelines)
2. Infraestructura auto-scaling: Cloud Run paga solo por uso real
3. Eliminacion de chat libre (alto consumo de tokens) por pipelines estructurados

---

## 6. Estrategia de Scaling

### 6.1 Horizontal Scaling

```
Cloud Run (Backend + Workers):
  - Auto-scaling basado en CPU utilization (target: 60%)
  - Min instances: 0 (MVP), 1-2 (crecimiento), 2-4 (escala)
  - Max instances: 10 (MVP), 50 (crecimiento), 100 (escala)
  - Concurrency: 80 requests por instance
  - Startup time: < 5 segundos (imagen optimizada)

Cloud Run (Frontend):
  - Auto-scaling basado en requests
  - CDN (Cloudflare) absorbe 80%+ del trafico estatico
  - Min instances: 0-1
  - Max instances: 10-20
```

### 6.2 Database Scaling

```
Etapa 1 (MVP):
  - Cloud SQL db-f1-micro (shared vCPU, 614MB RAM)
  - 10GB SSD
  - Sin HA (single zone)
  - Connection pooling via PgBouncer (Cloud SQL proxy)

Etapa 2 (Crecimiento):
  - Cloud SQL db-g1-small (shared vCPU, 1.7GB RAM)
  - 50GB SSD
  - Sin HA (backup diario automatico)
  - Evaluar read replica si dashboard queries son pesadas

Etapa 3 (Escala):
  - Cloud SQL db-custom-2-7680 (2 vCPU, 7.5GB RAM)
  - 200GB SSD
  - HA habilitado (failover automatico)
  - Read replica para dashboards y analytics
  - Partitioning en tablas grandes (audit_log, test_results)

Etapa 4 (10,000+):
  - Cloud SQL db-custom-4-15360 (4 vCPU, 15GB RAM)
  - O migracion a AlloyDB (PostgreSQL compatible, mejor performance)
  - Read replicas multiples
  - Considerar TimescaleDB para series temporales
```

### 6.3 AI Worker Scaling

```
Etapa 1: 1 worker, procesa ~10 sesiones/dia
  - Tiempo promedio por sesion: 30 segundos
  - Capacidad: 100+ sesiones/dia (holgura amplia)

Etapa 2: 2 workers, procesa ~50 sesiones/dia
  - Concurrencia: 2 sesiones en paralelo
  - Queue depth alert: > 10 jobs pendientes

Etapa 3: 4-8 workers, procesa ~200 sesiones/dia
  - Auto-scaling basado en queue depth
  - Workers con 2 vCPU para procesamiento paralelo de sub-pipelines
  - Prioridad de queues: ai_analysis > profiles > reports
```

---

## 7. Seguridad de Infraestructura

### 7.1 Network Security

```
1. Cloudflare WAF
   - Proteccion DDoS
   - Rate limiting por IP
   - Bot detection
   - Geo-blocking (solo Chile y LATAM si aplica)

2. Cloud VPC
   - Backend y Workers en red privada
   - PostgreSQL y Redis solo accesibles desde VPC
   - Frontend accede a Backend via internal URL
   - Solo el Load Balancer expuesto a internet

3. Service Account
   - Cada servicio tiene su propio service account
   - Principio de minimo privilegio
   - Backend SA: acceso a DB, Redis, Storage, Google APIs
   - Worker SA: acceso a DB, Redis, OpenRouter
   - Frontend SA: solo acceso a Backend API
```

### 7.2 Secrets Management

```
Google Secret Manager:
  - OPENROUTER_API_KEY
  - DATABASE_URL
  - REDIS_URL
  - GOOGLE_SERVICE_ACCOUNT_KEY (para Workspace APIs)
  - JWT_SECRET_KEY
  - ENCRYPTION_KEY (para datos sensibles)

Rotacion:
  - API keys: cada 90 dias
  - DB password: cada 180 dias
  - JWT secret: cada 365 dias
  - Automatizado via Cloud Function trigger
```

### 7.3 Data Encryption

```
At Rest:
  - Cloud SQL: encriptacion automatica (AES-256)
  - Cloud Storage: encriptacion automatica
  - Redis: encriptacion en reposo (Memorystore)
  - Campos sensibles en BD: encriptacion a nivel de aplicacion (AES-256-GCM)
    - birth_date
    - phone
    - transcripciones completas
    - notas de sesion

In Transit:
  - HTTPS obligatorio (Cloudflare -> Cloud Run)
  - TLS 1.3 minimo
  - Internal traffic: mTLS entre servicios (Cloud Run default)
  - Database: SSL required
```

### 7.4 Compliance

```
Ley 19.628 (Chile - Proteccion de Datos):
  - Registro de bases de datos ante Servicio Nacional
  - Consentimiento explicito para recopilacion
  - Derecho a acceso, rectificacion y eliminacion
  - Responsable de datos identificado (representante legal)

GDPR-like requirements (preparacion para expansion):
  - Data Processing Agreement (DPA) con OpenRouter
  - Data residency: datos en region LATAM cuando posible
  - Data portability: export de datos del estudiante en formato estandar
  - Right to be forgotten: eliminacion completa implementada

Proteccion de Menores:
  - Consentimiento parental obligatorio registrado digitalmente
  - Audit log de todo acceso a datos de menores
  - Sin data sharing con terceros (excepto OpenRouter para procesamiento)
  - OpenRouter DPA debe cubrir procesamiento de datos de menores
  - Anonimizacion en prompts: nombres reales nunca enviados al LLM
```

---

## 8. Backup y Disaster Recovery

```
PostgreSQL:
  - Backups automaticos diarios (Cloud SQL automated backup)
  - Retencion: 30 dias
  - Point-in-time recovery habilitado
  - Backup manual antes de cada migracion

Object Storage:
  - Versionamiento habilitado en bucket
  - Cross-region replication (opcional, etapa 3+)

Redis:
  - Persistence habilitado (RDB snapshots cada 1 hora)
  - No critico: cache se reconstruye automaticamente

Recovery Targets:
  - RPO (Recovery Point Objective): 1 hora
  - RTO (Recovery Time Objective): 4 horas (etapa 1-2), 1 hora (etapa 3+)

Disaster Recovery Plan:
  1. DB corruption -> restore from backup (< 30 min)
  2. Region outage -> failover to secondary region (etapa 3+, < 1 hora)
  3. Cloud Run failure -> auto-restart + auto-scaling (< 2 min)
  4. OpenRouter outage -> fallback models + queue jobs for later (< 5 min)
```

---

## 9. CI/CD Pipeline

```
Herramienta: GitHub Actions

Trigger: Push to main / PR merge

Pipeline:
  1. Lint + Type Check
     - Backend: ruff + mypy
     - Frontend: ESLint + TypeScript
     Parallel execution

  2. Unit Tests
     - Backend: pytest (con testcontainers)
     - Frontend: vitest
     Parallel execution

  3. Build
     - Backend: Docker image build
     - Frontend: Docker image build (with Next.js build)
     Parallel execution

  4. Integration Tests
     - API tests contra docker-compose local
     - Multi-tenancy isolation tests

  5. Push Images
     - Push to Artifact Registry (GCP)
     - Tag with git SHA + "latest"

  6. Deploy Staging
     - Deploy to Cloud Run (staging)
     - Run smoke tests

  7. Deploy Production (manual approval)
     - Blue-green deployment via Cloud Run revisions
     - Traffic split: 10% -> 50% -> 100%
     - Rollback if error rate > 1%

Environments:
  - development: local docker-compose
  - staging: Cloud Run (separate project)
  - production: Cloud Run (production project)
```

---

## 10. Monitoring y Alerting

```
Stack de Monitoreo:

1. Application Monitoring: Sentry
   - Error tracking
   - Performance monitoring
   - Release tracking
   - Costo: $0 (free) -> $26/mes (Team)

2. Infrastructure Monitoring: Google Cloud Monitoring
   - CPU, memory, request count
   - Cloud SQL metrics
   - Custom metrics (AI processing time, queue depth)
   - Costo: incluido en GCP

3. Logging: Google Cloud Logging
   - Structured JSON logging desde FastAPI
   - Log-based alerts
   - Log routing to BigQuery (para analytics, etapa 3+)
   - Costo: incluido hasta 50GB/mes

4. Uptime Monitoring: Cloudflare Health Checks
   - /health endpoint en Backend
   - /api/health en Frontend
   - Alert via email + Slack
   - Costo: incluido en Cloudflare

Alertas Criticas:
  - Backend down (health check fails 3x)
  - Database connection errors > 5/min
  - AI processing queue > 50 jobs
  - Error rate > 5% en 5 minutos
  - Cloud SQL CPU > 80% sustained
  - OpenRouter API errors > 10% en 10 minutos
```

---

## 11. Google Workspace Integration Infrastructure

```
Requisitos por colegio:

1. Google Workspace Business Starter ($6 USD/user/mes)
   - Incluye Google Meet con grabacion
   - Google Drive con 30GB/user
   - Admin console

2. Service Account Setup (una vez por colegio):
   - Crear Service Account en Google Cloud Console del colegio
   - Habilitar Domain-Wide Delegation
   - Autorizar scopes:
     - https://www.googleapis.com/auth/calendar
     - https://www.googleapis.com/auth/drive.readonly
     - https://www.googleapis.com/auth/documents.readonly
     - https://www.googleapis.com/auth/meetings.space.readonly

3. API Quotas (Google Workspace):
   - Calendar API: 1,000,000 requests/dia (mas que suficiente)
   - Drive API: 1,000,000,000 requests/dia
   - Docs API: 300 requests/min
   - Meet API: depende del plan

4. Almacenamiento de grabaciones:
   - Las grabaciones se almacenan en Google Drive del organizador (orientador)
   - Vocari accede via Drive API para obtener transcripcion
   - Grabaciones NO se copian a Vocari (ahorra storage, respeta propiedad)
   - Solo la transcripcion (texto) se almacena en PostgreSQL
```

---

## 12. Resumen de Costos Totales

### Por Etapa (USD/mes)

| Componente | MVP (50 est) | Crec. (500 est) | Escala (5,000 est) |
|-----------|-------------|-----------------|-------------------|
| Compute (Cloud Run) | $25 | $110 | $400 |
| PostgreSQL | $10 | $35 | $200 |
| Redis | $10* | $30 | $80 |
| Storage | $1 | $5 | $15 |
| Google Workspace | $18 | $30 | $60 |
| OpenRouter (IA) | $21 | $210 | $2,100 |
| Cloudflare | $0 | $20 | $20 |
| Monitoring | $0 | $26 | $100 |
| Misc (domain, etc) | $2 | $5 | $10 |
| **TOTAL** | **~$87** | **~$471** | **~$2,985** |
| **TOTAL CLP** | **~$82,650** | **~$447,450** | **~$2,835,750** |

*Upstash en vez de Memorystore para MVP

### Revenue vs Cost

| Etapa | Estudiantes | Costo/mes | Revenue ($15/est) | Margen Bruto |
|-------|------------|-----------|-------------------|-------------|
| MVP | 50 | $87 | $750 | 88% |
| Crecimiento | 500 | $471 | $7,500 | 94% |
| Escala | 5,000 | $2,985 | $75,000 | 96% |

**Observacion critica**: La optimizacion del pipeline de IA (de $8.50 a $0.42/estudiante) transforma completamente la economia del negocio. Los margenes son drasticamente superiores al modelo actual.
